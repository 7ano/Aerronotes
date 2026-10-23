import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow requests from your domain
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, userEmail, userFullName, userPhone, returnUrl, callbackUrl } = req.body;

    // Use server-side process.env or fallback to VITE_ vars
    const secretKey = process.env.TOYYIBPAY_SECRET_KEY || process.env.VITE_TOYYIBPAY_SECRET_KEY || '';
    const categoryCode = process.env.TOYYIBPAY_CATEGORY_CODE || process.env.VITE_TOYYIBPAY_CATEGORY_CODE || '';

    if (!secretKey || !categoryCode) {
      return res.status(400).json({ error: 'ToyyibPay credentials not configured on server.' });
    }

    const studentName = userFullName || userEmail?.split('@')[0] || 'MIAT Student';
    const studentEmail = userEmail || 'student@s.unikl.edu.my';
    const studentPhone = userPhone || '0123456789';

    const payload = new URLSearchParams();
    payload.append('userSecretKey', secretKey);
    payload.append('categoryCode', categoryCode);
    payload.append('billName', 'MIAT Central Pro');
    payload.append('billDescription', 'Pro Subscription Access');
    payload.append('billPriceSetting', '1');
    payload.append('billPayorInfo', '1');
    payload.append('billTo', studentName);
    payload.append('billEmail', studentEmail);
    payload.append('billPhone', studentPhone);
    payload.append('billAmount', '1500'); // RM 15.00
    payload.append('billReturnUrl', returnUrl);
    payload.append('billCallbackUrl', callbackUrl);
    payload.append('billExternalReferenceNo', userId || 'SUB-PRO');

    const response = await fetch('https://toyyibpay.com/index.php/api/createBill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload.toString(),
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({
      error: `Server error contacting ToyyibPay: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}
