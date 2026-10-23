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
  returnUrl: string;
  callbackUrl: string;
}): Promise<CreateBillResult | ToyyibPayError> {
  const creds = getCredentials();
  if ('error' in creds) return creds;

  const formData = new FormData();
  formData.append('userSecretKey', creds.secretKey);
  formData.append('categoryCode', creds.categoryCode);
  formData.append('billName', 'MIAT Central Pro Subscription');
  formData.append(
    'billDescription',
    'Monthly access to EASA question banks and UniKL study materials',
  );
  formData.append('billPriceSetting', '1');
  formData.append('billPayorRequired', '1');
  formData.append('billAmount', '1500');
  formData.append('billReturnUrl', params.returnUrl);
  formData.append('billCallbackUrl', params.callbackUrl);
  formData.append('billExternalReferenceNo', params.userId);
  formData.append('billTo', params.userEmail);
  formData.append('billEmail', params.userEmail);
  formData.append('billPhone', '0123456789');
  formData.append('billSplitPaymentArgs', '');
  formData.append('billPaymentChannel', '0');
  formData.append('billContentFields', '');
  formData.append('billChargeToCustomer', '');

  try {
    const response = await fetch(`${TOYYIBPAY_API}/createBill`, {
      method: 'POST',
      body: formData,
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

    const result = await response.json();
    const billCode = Array.isArray(result) ? result[0]?.billCode : result?.billCode;

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
