// Canonical production URL -- auth email links (signup confirmation,
// password reset) must always point here, regardless of where the request
// was made from (local dev, a Vercel preview, etc.), otherwise Supabase can
// redirect users to e.g. http://localhost:3000.
export const SITE_URL = 'https://pregnancylog.vercel.app'
