// The API is served from the same origin as the app: Vite proxies /api in
// development and vercel.json rewrites it in production. Keeping it same-origin
// is what lets the HttpOnly refresh cookie survive a page reload.
export const API_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export const SOURCE_URL = 'https://github.com/hammad2914/inked';
