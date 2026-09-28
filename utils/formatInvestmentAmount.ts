/**
 * Format investment amounts in the Bangladeshi/Indian number system.
 * Examples:
 * 400000 -> 4 lakh
 * 450000 -> 4.5 lakh
 * 50000000 -> 5 crore
 * 500200 -> 5 lakh 200
 */
export function formatInvestmentAmount(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") return "—";

  const parsed = typeof amount === "number"
    ? amount
    : Number(String(amount).replace(/,/g, "").trim());

  if (!Number.isFinite(parsed) || parsed < 0) return "—";
  if (parsed === 0) return "0";

  const trim = (value: number) =>
    Number(value.toFixed(2)).toLocaleString("en-BD", {
      maximumFractionDigits: 2,
    });

  const crore = Math.floor(parsed / 10_000_000);
  let remainder = parsed - crore * 10_000_000;

  if (crore > 0) {
    const lakh = Math.floor(remainder / 100_000);
    remainder -= lakh * 100_000;
    const parts = [`${trim(crore)} crore`];
    if (lakh) parts.push(`${trim(lakh)} lakh`);
    if (remainder) parts.push(trim(remainder));
    return parts.join(" ");
  }

  const lakh = Math.floor(parsed / 100_000);
  if (lakh > 0) {
    remainder = parsed - lakh * 100_000;
    const parts = [`${trim(lakh)} lakh`];
    if (remainder) {
      const thousand = Math.floor(remainder / 1_000);
      remainder -= thousand * 1_000;
      if (thousand) parts.push(`${trim(thousand)} thousand`);
      if (remainder) parts.push(trim(remainder));
    }
    return parts.join(" ");
  }

  if (parsed >= 1_000) {
    const thousand = Math.floor(parsed / 1_000);
    const remainder = parsed - thousand * 1_000;
    return remainder ? `${trim(thousand)} thousand ${trim(remainder)}` : `${trim(thousand)} thousand`;
  }

  return trim(parsed);
}
