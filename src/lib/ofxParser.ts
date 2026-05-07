export type OFXTransaction = {
  date: string; // YYYY-MM-DD
  description: string;     // clean entity name (client/supplier)
  rawDescription: string;  // original bank description (for observation field)
  value: number;
  type: "entrada" | "saida";
};

// Keywords in MEMO/NAME that indicate a DEBIT (saida) — even if TRNAMT is positive
const SAIDA_KEYWORDS = [
  /^pix\s*[-–]?\s*(enviado|agendamento)/i,
  /^transfer[eê]ncia\s*enviada/i,
  /^transferencia\s*enviada/i,
  /^pagamento\s+de\s+boleto/i,
  /^pagamento\s+de\s+impostos/i,
  /^pagto\s+conta\s+telefone/i,
  /^pagamento\s+de\s+conta/i,
  /^ted\s+transf/i,
  /^tarifa/i,
  /^d[eé]bito\s+autom[aá]tico/i,
  /^compra\s+no\s+d[eé]bito/i,
  /^cap\s+giro/i,
  /^capital\s+giro/i,
  /^seg\s+cr[eé]d/i,
  /^pix\s*[-–]?\s*rejeitado/i, // rejected PIX — skip or treat as 0
];

// Keywords that indicate ENTRADA (credit)
const ENTRADA_KEYWORDS = [
  /^transfer[eê]ncia\s*recebida/i,
  /^transferencia\s*recebida/i,
  /^pix\s*[-–]?\s*recebido/i,
  /^estorno\s+de\s+d[eé]bito/i,
  /^bb\s+rende\s+f[aá]cil/i,
  /^rende\s+facil/i,
  /^credito/i,
  /^dep[oó]sito/i,
];

// Entries to skip entirely
const SKIP_KEYWORDS = [
  /\bsaldo\s+anterior\b/i,
  /\bsaldo\s+do\s+dia\b/i,
  /\bmovimento\s+do\s+dia\b/i,
  /\bsaldo\b/i,
  /^pix\s*[-–]?\s*rejeitado/i,
];

export function cleanOFXDescription(raw: string): string {
  let desc = raw.trim();

  // Remove date/time prefix like "01/04 16:47 " at start
  desc = desc.replace(/^\d{1,2}\/\d{2}\s+\d{2}:\d{2}\s+/, "");

  const prefixes = [
    /^pix\s*[-–—]?\s*(enviado|recebido|agendamento|rejeitado)\s*[-–—]?\s*/i,
    /^pix\s*[-–—]?\s*/i,
    /^pagamento\s+de\s+(boleto|impostos|conta\s*\/?s*tributo|titulo)\s*[-–—]?\s*/i,
    /^pagamento\s*[-–—]?\s*/i,
    /^pagto\s+conta\s+telefone\s*[-–—]?\s*/i,
    /^ted\s*[-–—]?\s*(enviada?|recebida?)?\s*[-–—]?\s*/i,
    /^doc\s*[-–—]?\s*(enviado?|recebido?)?\s*[-–—]?\s*/i,
    /^transfer[eê]ncia\s*(enviada?|recebida?)\s*[-–—]?\s*/i,
    /^transfer[eê]ncia\s*[-–—]?\s*(enviada?|recebida?)\s*[-–—]?\s*/i,
    /^transferencia\s*[-–—]?\s*(enviada?|recebida?)\s*[-–—]?\s*/i,
    /^transfer[eê]ncia\s*[-–—]?\s*/i,
    /^transferencia\s*[-–—]?\s*/i,
    /^d[eé]bito\s+autom[aá]tico\s*[-–—]?\s*/i,
    /^compra\s+no\s+d[eé]bito\s*[-–—]?\s*/i,
    /^(enviado|recebido)\s+(para|de)\s+/i,
    /^(para|de)\s+/i,
  ];

  for (const prefix of prefixes) {
    const replaced = desc.replace(prefix, "");
    if (replaced !== desc) { desc = replaced; break; }
  }

  // Remove date/time patterns inline
  desc = desc.replace(/\b\d{1,2}\/\d{2}(\/\d{2,4})?\b/g, "");
  desc = desc.replace(/\b\d{1,2}:\d{2}(:\d{2})?\b/g, "");
  // Remove long numeric refs
  desc = desc.replace(/\b\d{6,}\b/g, "");
  // Cleanup symbols
  desc = desc.replace(/^[\s\-–—.*\/]+/, "").replace(/[\s\-–—.*\/]+$/, "");
  desc = desc.replace(/\s{2,}/g, " ").trim();

  if (desc.length < 2) return raw.trim();
  return desc;
}

function extractField(block: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}>([^<\\n\\r]+)`, "i");
  const match = block.match(regex);
  return match ? match[1].trim() : null;
}

export function parseOFX(content: string): OFXTransaction[] {
  const transactions: OFXTransaction[] = [];

  const normalized = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const parts = normalized.split(/<STMTTRN>/i);

  for (let i = 1; i < parts.length; i++) {
    let block = parts[i];
    const closeIdx = block.search(/<\/STMTTRN>/i);
    if (closeIdx !== -1) block = block.slice(0, closeIdx);

    const trnType = (extractField(block, "TRNTYPE") || "").toUpperCase();
    const rawDate = extractField(block, "DTPOSTED");
    if (!rawDate) continue;

    const dateDigits = rawDate.replace(/\D/g, "").substring(0, 8);
    if (dateDigits.length < 8) continue;
    const dateFormatted = `${dateDigits.substring(0,4)}-${dateDigits.substring(4,6)}-${dateDigits.substring(6,8)}`;

    const rawAmt = extractField(block, "TRNAMT");
    if (!rawAmt) continue;
    const value = parseFloat(rawAmt.replace(",", "."));
    if (isNaN(value)) continue;

    // Get best description: prefer MEMO if it has useful content, else NAME
    const memo = extractField(block, "MEMO") || "";
    const name = extractField(block, "NAME") || "";
    // Use MEMO if it has more info than NAME, otherwise NAME
    const rawDescription = memo.length > name.length ? memo : (name || memo || "Sem descrição");

    // Skip saldo/balance/rejected entries
    if (SKIP_KEYWORDS.some(kw => kw.test(rawDescription) || kw.test(name) || kw.test(memo))) continue;
    if (value === 0) continue;

    // Determine entrada/saida:
    // 1. If TRNAMT has explicit sign, use it
    // 2. If all values are positive (BB March format), use MEMO keywords
    // 3. Fallback to TRNTYPE
    let type: "entrada" | "saida";

    if (value < 0) {
      // Explicit negative = saida
      type = "saida";
    } else {
      // Positive value — need to determine direction from MEMO/NAME or TRNTYPE
      const descToCheck = rawDescription + " " + name;

      if (SAIDA_KEYWORDS.some(kw => kw.test(descToCheck))) {
        type = "saida";
      } else if (ENTRADA_KEYWORDS.some(kw => kw.test(descToCheck))) {
        type = "entrada";
      } else if (trnType === "DEBIT") {
        type = "saida";
      } else if (trnType === "CREDIT") {
        // Be careful: in March OFX, CREDIT is used for debits too!
        // Use MEMO to disambiguate
        type = SAIDA_KEYWORDS.some(kw => kw.test(descToCheck)) ? "saida" : "entrada";
      } else if (trnType === "XFER" || trnType === "OTHER") {
        // In March BB format, XFER/OTHER with positive = saida (transfers sent)
        type = ENTRADA_KEYWORDS.some(kw => kw.test(descToCheck)) ? "entrada" : "saida";
      } else {
        // Last resort: positive with no clues = entrada
        type = "entrada";
      }
    }

    const description = cleanOFXDescription(rawDescription);

    transactions.push({
      date: dateFormatted,
      description,
      value: Math.abs(value),
      type,
    });
  }

  return transactions;
}
