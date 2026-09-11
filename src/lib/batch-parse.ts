import type { CreateKitInput } from "./types";

interface RawCase {
  jd?: string;
  companyUrl?: string;
  company_url?: string;
  days?: number;
}

export function parseBatchFile(text: string): CreateKitInput[] {
  const data = JSON.parse(text) as RawCase[] | { cases?: RawCase[] };

  const rows = Array.isArray(data) ? data : data.cases;
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("File must contain a JSON array of cases");
  }

  return rows.map((row, i) => {
    const jd = row.jd?.trim();
    const companyUrl = (row.companyUrl || row.company_url)?.trim();
    const days = row.days;

    if (!jd) throw new Error(`Case ${i + 1}: missing jd`);
    if (!companyUrl) throw new Error(`Case ${i + 1}: missing company URL`);
    if (!days || days < 1 || days > 60) {
      throw new Error(`Case ${i + 1}: days must be 1–60`);
    }

    return { jd, companyUrl, days };
  });
}
