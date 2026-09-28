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
    if (remainder) {
      if (remainder % 1000 === 0) {
        parts.push(`${trim(remainder / 1000)} thousand`);
      } else {
        parts.push(trim(remainder));
      }
    }

    return parts.join(" ");
  }

  const lakh = Math.floor(parsed / 100_000);
  if (lakh > 0) {
    remainder = parsed - lakh * 100_000;

    if (remainder === 0) return `${trim(lakh)} lakh`;

    // When the remainder is an exact thousand, use a decimal lakh
    // (450000 -> 4.5 lakh; 475000 -> 4.75 lakh).
    if (remainder % 1000 === 0) {
      const lakhValue = parsed / 100_000;
      const decimalPart = lakhValue.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
      return `${decimalPart} lakh`;
    }

    return `${trim(lakh)} lakh ${trim(remainder)}`;
  }

  if (parsed >= 1_000) {
    const thousand = Math.floor(parsed / 1_000);
    const remainder = parsed - thousand * 1_000;
    return remainder
      ? `${trim(thousand)} thousand ${trim(remainder)}`
      : `${trim(thousand)} thousand`;
  }

  return trim(parsed);
}
