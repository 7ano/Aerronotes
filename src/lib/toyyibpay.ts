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

  // ToyyibPay's PHP REST endpoint expects URL-encoded form data,
  // not multipart/form-data. URLSearchParams guarantees proper encoding.
  const form = new URLSearchParams();
  form.append('userSecretKey', creds.secretKey);
  form.append('categoryCode', creds.categoryCode);
  form.append('billName', 'MIAT Central Pro Subscription');
  form.append('billDescription', 'Monthly access to EASA question banks and UniKL study materials');
  form.append('billPriceSetting', '1');
  form.append('billPayorRequired', '1');
  form.append('billAmount', '1500');
  form.append('billReturnUrl', params.returnUrl);
  form.append('billCallbackUrl', params.callbackUrl);
  form.append('billExternalReferenceNo', params.userId);
  // Payor info — ToyyibPay requires these when billPayorRequired is 1.
  // Some API versions use billTo/billEmail/billPhone, others use billPayorName/billPayorEmail/billPayorPhone.
  // We send both sets to cover all versions.
  form.append('billTo', payorName);
  form.append('billEmail', params.userEmail);
  form.append('billPhone', '0123456789');
  form.append('billPayorName', payorName);
  form.append('billPayorEmail', params.userEmail);
  form.append('billPayorPhone', '0123456789');
  form.append('billSplitPaymentArgs', '');
  form.append('billPaymentChannel', '0');
  form.append('billContentFields', '');
  form.append('billChargeToCustomer', '');

  console.log('[toyyibpay] createBill payload keys:', [...form.keys()].join(', '));

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

  const formData = new FormData();
  formData.append('userSecretKey', creds.secretKey);
  formData.append('billCode', billCode);

  try {
    const response = await fetch(`${TOYYIBPAY_API}/getBillTransactions`, {
      method: 'POST',
      body: formData,
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
