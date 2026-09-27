const configuredApiUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "";

export const API_BASE_URL =
  configuredApiUrl.trim().replace(/\/$/, "") ||
  (process.env.NODE_ENV === "production"
    ? "https://currentbackend.onrender.com"
    : "http://localhost:5000");
