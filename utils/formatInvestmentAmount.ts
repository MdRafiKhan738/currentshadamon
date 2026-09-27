/**
 * Format investment amounts in the Bangladeshi/Indian number system used by
 * the marketplace: thousand, lakh, crore. This keeps raw values numeric while
 * presenting them in a readable, investor-facing format.
 */
export function formatInvestmentAmount(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") {
    return "—";
  }

  const parsed = typeof amount === "number" ? amount : Number(String(amount).replace(/,/g, ""));

  if (!Number.isFinite(parsed) || parsed < 0) {
    return "—";
  }

  const abs = Math.abs(parsed);
  const formatValue = (value: number) => {
    if (!Number.isFinite(value)) return "0";
    return Number(value.toFixed(2)).toLocaleString("en-BD", {
      maximumFractionDigits: 2,
    });
  };

  if (abs >= 10_000_000) {
    return `${formatValue(abs / 10_000_000)} crore`;
  }

  if (abs >= 100_000) {
    return `${formatValue(abs / 100_000)} lakh`;
  }

  if (abs >= 1_000) {
    return `${formatValue(abs / 1_000)} thousand`;
  }

  return `${formatValue(abs)}`;
}
