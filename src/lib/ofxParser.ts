export type OFXTransaction = {
  date: string; // YYYY-MM-DD
  description: string;
  value: number;
  type: "entrada" | "saida";
};

/**
 * Clean a raw OFX description to extract just the entity/vendor name.
 * Removes bank prefixes, dates, times, and other noise.
 */
export function cleanOFXDescription(raw: string): string {
  let desc = raw.trim();

  // Remove common bank operation prefixes (case-insensitive)
  const prefixes = [
    /^pix\s*[-–—]?\s*(enviado|recebido|transf\.?|transferencia)\s*[-–—]?\s*/i,
    /^pix\s*[-–—]?\s*/i,
    /^pagamento\s+de\s+(boleto|conta\s*\/?\s*tributo|titulo)\s*[-–—]?\s*/i,
    /^pagamento\s*[-–—]?\s*/i,
    /^ted\s*[-–—]?\s*(enviada?|recebida?)\s*[-–—]?\s*/i,
    /^doc\s*[-–—]?\s*(enviado?|recebido?)\s*[-–—]?\s*/i,
    /^transferencia\s*[-–—]?\s*(enviada?|recebida?)\s*[-–—]?\s*/i,
    /^debito\s+automatico\s*[-–—]?\s*/i,
    /^compra\s+no\s+debito\s*[-–—]?\s*/i,
    /^(enviado|recebido)\s+(para|de)\s+/i,
    /^(para|de)\s+/i,
  ];

  for (const prefix of prefixes) {
    desc = desc.replace(prefix, "");
  }

  // Remove date patterns like DD/MM, DD/MM/YY, DD/MM/YYYY
  desc = desc.replace(/\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/g, "");

  // Remove time patterns like HH:MM, HH:MM:SS
  desc = desc.replace(/\b\d{1,2}:\d{2}(:\d{2})?\b/g, "");

  // Remove standalone numeric sequences that look like bank refs (6+ digits)
  desc = desc.replace(/\b\d{6,}\b/g, "");

  // Remove trailing/leading dashes, dots, asterisks, slashes
  desc = desc.replace(/^[\s\-–—.*\/]+/, "").replace(/[\s\-–—.*\/]+$/, "");

  // Collapse multiple spaces
  desc = desc.replace(/\s{2,}/g, " ").trim();

  // If nothing meaningful remains, return the original
  if (desc.length < 2) return raw.trim();

  return desc;
}

/**
 * Parse an OFX file content and extract transactions.
 * Handles standard OFX/QFX banking formats.
 */
export function parseOFX(content: string): OFXTransaction[] {
  const transactions: OFXTransaction[] = [];

  // Find all STMTTRN blocks
  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match: RegExpExecArray | null;

  while ((match = stmtTrnRegex.exec(content)) !== null) {
    const block = match[1];

    // Extract date (DTPOSTED)
    const dateMatch = block.match(/<DTPOSTED>(\d{8})/i);
    const rawDate = dateMatch ? dateMatch[1] : null;

    // Extract value (TRNAMT)
    const amtMatch = block.match(/<TRNAMT>([-+]?\d+[.,]?\d*)/i);
    const rawAmt = amtMatch ? amtMatch[1].replace(",", ".") : null;

    // Extract description (MEMO or NAME)
    const memoMatch = block.match(/<MEMO>([^\n<]+)/i);
    const nameMatch = block.match(/<NAME>([^\n<]+)/i);
    const rawDescription = (memoMatch?.[1] || nameMatch?.[1] || "Sem descrição").trim();
    const description = cleanOFXDescription(rawDescription);

    // Skip balance entries — not real transactions
    if (/\bsaldo\b/i.test(description) || /\bsaldo\b/i.test(rawDescription)) {
      continue;
    }

    if (rawDate && rawAmt) {
      const year = rawDate.substring(0, 4);
      const month = rawDate.substring(4, 6);
      const day = rawDate.substring(6, 8);
      const dateFormatted = `${year}-${month}-${day}`;

      const value = parseFloat(rawAmt);

      transactions.push({
        date: dateFormatted,
        description,
        value: Math.abs(value),
        type: value >= 0 ? "entrada" : "saida",
      });
    }
  }

  return transactions;
}
