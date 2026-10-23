const TOYYIBPAY_API = 'https://toyyibpay.com/index.php/api';

export interface CreateBillResult {
  billCode: string;
}

export interface VerifyBillResult {
  status: 'paid' | 'pending';
  isPro: boolean;
}

export interface ToyyibPayError {
  error: string;
  status?: number;
}

function getCredentials(): { secretKey: string; categoryCode: string } | ToyyibPayError {
  const secretKey = import.meta.env.VITE_TOYYIBPAY_SECRET_KEY;
  const categoryCode = import.meta.env.VITE_TOYYIBPAY_CATEGORY_CODE;

  if (!secretKey || !categoryCode) {
    return {
      error:
        'ToyyibPay credentials are not configured. Please add VITE_TOYYIBPAY_SECRET_KEY and VITE_TOYYIBPAY_CATEGORY_CODE to your environment.',
    };
  }

  return { secretKey, categoryCode };
}

export async function createBill(params: {
  userId: string;
  userEmail: string;
  userFullName: string;
  returnUrl: string;
  callbackUrl: string;
}): Promise<CreateBillResult | ToyyibPayError> {
  const creds = getCredentials();
  if ('error' in creds) return creds;

  const payorName = params.userFullName || 'MIAT Student';
  const payorEmail = params.userEmail || 'student@s.unikl.edu.my';

  // ToyyibPay's PHP REST endpoint expects URL-encoded form data with exact parameter names.
  // Sending duplicate/extra fields (billPayorName etc.) causes "billPayorInfo parameter is empty".
  const form = new URLSearchParams({
    userSecretKey: creds.secretKey,
    categoryCode: creds.categoryCode,
    billName: 'MIAT Central Pro Subscription',
    billDescription: 'Monthly access to EASA question banks and UniKL study materials',
    billPriceSetting: '1',
    billPayorRequired: '1',
    billTo: payorName,
    billEmail: payorEmail,
    billPhone: '0123456789',
    billAmount: '1500',
    billReturnUrl: params.returnUrl,
    billCallbackUrl: params.callbackUrl,
    billExternalReferenceNo: params.userId || '',
  });

  console.log('[toyyibpay] createBill payload:', form.toString());

  try {
    const response = await fetch(`${TOYYIBPAY_API}/createBill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[toyyibpay] createBill HTTP error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      return {
        error: `ToyyibPay API error (HTTP ${response.status}): ${errorText.slice(0, 300)}`,
        status: response.status,
      };
    }

    const rawText = await response.text();
    console.log('[toyyibpay] createBill raw response:', rawText.slice(0, 500));

    let result: unknown;
    try {
      result = JSON.parse(rawText);
    } catch {
      console.error('[toyyibpay] createBill: non-JSON response:', rawText);
      return { error: `ToyyibPay returned a non-JSON response: ${rawText.slice(0, 300)}` };
    }

    const billCode = Array.isArray(result) ? result[0]?.billCode : (result as { billCode?: string })?.billCode;

    if (!billCode) {
      console.error('[toyyibpay] createBill: no billCode in response:', result);
      return {
        error: `ToyyibPay did not return a bill code. Response: ${JSON.stringify(result).slice(0, 300)}`,
      };
    }

    return { billCode };
  } catch (err) {
    console.error('[toyyibpay] createBill fetch error:', err);
    return {
      error: `Network error contacting ToyyibPay: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export async function verifyBill(billCode: string): Promise<VerifyBillResult | ToyyibPayError> {
  const creds = getCredentials();
  if ('error' in creds) return creds;

  const form = new URLSearchParams({
    userSecretKey: creds.secretKey,
    billCode: billCode,
  });

  try {
    const response = await fetch(`${TOYYIBPAY_API}/getBillTransactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[toyyibpay] getBillTransactions HTTP error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      return {
        error: `ToyyibPay verify error (HTTP ${response.status}): ${errorText.slice(0, 300)}`,
        status: response.status,
      };
    }

    const transactions = await response.json();
    const hasPaid = Array.isArray(transactions) && transactions.some(
      (t: { billpaymentStatus?: number; billStatus?: string }) =>
        t.billpaymentStatus === 1 || t.billStatus === 'Paid',
    );

    return {
      status: hasPaid ? 'paid' : 'pending',
      isPro: hasPaid,
    };
  } catch (err) {
    console.error('[toyyibpay] getBillTransactions fetch error:', err);
    return {
      error: `Network error verifying payment: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
