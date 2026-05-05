export type OFXTransaction = {
  date: string; // YYYY-MM-DD
  description: string;
  value: number;
  type: "entrada" | "saida";
};

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
    const description = (memoMatch?.[1] || nameMatch?.[1] || "Sem descrição").trim();

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
