export const UA_ = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export const BASE_HEADERS_ = {
  'User-Agent': UA_,
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://finance.yahoo.com/'
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Simple fetch wrapper
export async function simpleFetch_(url: string, retries = 2) {
  let lastError: any = null;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { headers: BASE_HEADERS_, next: { revalidate: 180 } });
      if (res.ok) return await res.json();
      lastError = new Error(`HTTP Error: ${res.status}`);
    } catch (error) {
      lastError = error;
    }
    if (i < retries) await delay(500 * (i + 1));
  }
  console.error('simpleFetch_ error:', lastError);
  return null;
}

let cachedAuth: { cookie: string; crumb: string } | null = null;
let authCacheTime = 0;

export async function getYFAuth_() {
  if (cachedAuth && Date.now() - authCacheTime < 3300 * 1000) {
    return cachedAuth;
  }

  let cookie = '';
  try {
    const res = await fetch('https://fc.yahoo.com', { headers: { 'User-Agent': UA_ } });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      cookie = setCookie.split(';')[0];
    }
  } catch (e) {
    console.error('Failed to get cookie', e);
  }

  let crumb = '';
  if (cookie) {
    try {
      const res = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
        headers: { 'User-Agent': UA_, 'Cookie': cookie }
      });
      const text = await res.text();
      if (text && text.length < 80 && !text.startsWith('{') && !text.startsWith('<')) {
        crumb = text;
      }
    } catch (e) {
      console.error('Failed to get crumb', e);
    }
  }

  const auth = { cookie, crumb };
  if (crumb) {
    cachedAuth = auth;
    authCacheTime = Date.now();
  }
  return auth;
}

export async function authFetch_(url: string, auth: { cookie: string; crumb: string }, retries = 2) {
  const sep = url.includes('?') ? '&' : '?';
  const u = auth.crumb ? `${url}${sep}crumb=${encodeURIComponent(auth.crumb)}` : url;
  
  let lastError: any = null;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(u, {
        headers: { ...BASE_HEADERS_, 'Cookie': auth.cookie || '' },
        next: { revalidate: 180 }
      });
      if (res.ok) return await res.json();
      lastError = new Error(`HTTP Error: ${res.status}`);
    } catch (error) {
      lastError = error;
    }
    if (i < retries) await delay(500 * (i + 1));
  }
  console.error('authFetch_ error:', lastError);
  return null;
}
