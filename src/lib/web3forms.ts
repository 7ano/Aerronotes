const WEB3FORMS_ACCESS_KEY = '21c65234-6c52-4b64-aff9-c2fa49de5e01';
const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

export async function sendWeb3FormEmail(payload: Record<string, string>): Promise<void> {
  const res = await fetch(WEB3FORMS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ access_key: WEB3FORMS_ACCESS_KEY, ...payload }),
  });
  if (!res.ok) throw new Error(`Web3Forms responded ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Web3Forms submission failed');
}
