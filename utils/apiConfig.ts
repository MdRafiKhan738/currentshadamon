const configuredApiUrl = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  ""
)
  .trim()
  .replace(/\/$/, "");

const isProduction = process.env.NODE_ENV === "production";
const isLocalApi = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(?:\/.*)?$/i.test(
  configuredApiUrl
);

// Production is intentionally pinned to the new investment backend.
// This prevents an old/local NEXT_PUBLIC_* value from being baked into a production build.
const PRODUCTION_API_URL = "https://currentbackend.onrender.com";

export const API_BASE_URL =
  isProduction
    ? (!configuredApiUrl || isLocalApi ? PRODUCTION_API_URL : configuredApiUrl)
    : (configuredApiUrl || "http://localhost:5000");
