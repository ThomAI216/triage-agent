/**
 * Corti OAuth Token Manager
 * Fetches client_credentials token, caches it, auto-refreshes before expiry.
 */

import fetch from 'node-fetch';

let cachedToken = null;
let tokenExpiresAt = 0;

function getAuthUrl() {
  const env = process.env.CORTI_ENVIRONMENT;
  const tenant = process.env.CORTI_TENANT;
  return `https://auth.${env}.corti.app/realms/${tenant}/protocol/openid-connect/token`;
}

export function getApiBaseUrl() {
  return `https://api.${process.env.CORTI_ENVIRONMENT}.corti.app`;
}

export async function getToken() {
  const now = Date.now();
  // Refresh if token is missing or expires in less than 60 seconds
  if (cachedToken && now < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.CORTI_CLIENT_ID,
    client_secret: process.env.CORTI_CLIENT_SECRET,
  });

  const res = await fetch(getAuthUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Corti auth failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  // expires_in is in seconds
  tokenExpiresAt = now + data.expires_in * 1000;

  console.log(`[auth] Token refreshed, expires in ${data.expires_in}s`);
  return cachedToken;
}
