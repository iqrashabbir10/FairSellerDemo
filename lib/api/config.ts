// API base URL, cleaned up so a stray trailing slash, backslash or space in NEXT_PUBLIC_API_URL can't break
// requests. (A trailing backslash used to turn the SignalR URL into "…55980\/hubs/support" — a double slash the
// server doesn't route — so the real-time connection silently never opened.)
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "https://localhost:55980").trim().replace(/[\\/\s]+$/, "");
