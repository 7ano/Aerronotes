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

interface ToyyibPayBillResponse {
  BillCode?: string;
  billCode?: string;
  status?: string;
  msg?: string;
}

export async function createBill(params: {
  userId: string;
  userEmail: string;
  userFullName: string;
  userPhone?: string;
  returnUrl: string;
  callbackUrl: string;
}): Promise<CreateBillResult | ToyyibPayError> {
  const secretKey = import.meta.env.VITE_TOYYIBPAY_SECRET_KEY || '';
  const categoryCode = import.meta.env.VITE_TOYYIBPAY_CATEGORY_CODE || '';

  if (!secretKey || !categoryCode) {
    return {
      error:
        'ToyyibPay credentials are not configured. Please add VITE_TOYYIBPAY_SECRET_KEY and VITE_TOYYIBPAY_CATEGORY_CODE to your environment.',
    };
  }

  const studentName = params.userFullName || params.userEmail.split('@')[0] || 'MIAT Student';
  const studentEmail = params.userEmail || 'student@s.unikl.edu.my';
  const studentPhone = params.userPhone || '0123456789';

  const payload = new URLSearchParams();
  payload.append('userSecretKey', secretKey);
  payload.append('categoryCode', categoryCode);
  payload.append('billName', 'MIAT Central Pro');
  payload.append('billDescription', 'Pro Subscription Access');
  payload.append('billPriceSetting', '1');
  payload.append('billPayorRequired', '1');

  // Send both parameter naming variations for API compatibility
  payload.append('billTo', studentName);
  payload.append('billEmail', studentEmail);
  payload.append('billPhone', studentPhone);
  payload.append('billPayorName', studentName);
  payload.append('billPayorEmail', studentEmail);
  payload.append('billPayorPhone', studentPhone);

  payload.append('billAmount', '1500');
  payload.append('billReturnUrl', params.returnUrl);
  payload.append('billCallbackUrl', params.callbackUrl);
  payload.append('billExternalReferenceNo', params.userId || 'SUB-PRO');

  const payloadStr = payload.toString();
  console.log('[toyyibpay] createBill payload string:', payloadStr);

  try {
    const response = await fetch(`${TOYYIBPAY_API}/createBill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payloadStr,
    });

    const data: ToyyibPayBillResponse[] | ToyyibPayBillResponse = await response.json();
    console.log('[toyyibpay] createBill response:', data);

    if (!response.ok) {
      const errorMsg = Array.isArray(data)
        ? data[0]?.msg ?? JSON.stringify(data)
        : data.msg ?? JSON.stringify(data);
      console.error('[toyyibpay] createBill HTTP error:', {
        status: response.status,
        statusText: response.statusText,
        body: data,
      });
      return {
        error: `ToyyibPay API error (HTTP ${response.status}): ${errorMsg}`,
        status: response.status,
      };
    }

    // ToyyibPay may return BillCode (capital) or billCode (lowercase)
    const billCode = Array.isArray(data)
      ? data[0]?.BillCode ?? data[0]?.billCode
      : data.BillCode ?? data.billCode;

    if (!billCode) {
      const errorDetail = Array.isArray(data)
        ? data[0]?.msg ?? JSON.stringify(data)
        : data.msg ?? JSON.stringify(data);
      console.error('[toyyibpay] createBill: no bill code in response:', data);
      return {
        error: `ToyyibPay did not return a bill code. Response: ${errorDetail.slice(0, 300)}`,
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
  const secretKey = import.meta.env.VITE_TOYYIBPAY_SECRET_KEY || '';
  const categoryCode = import.meta.env.VITE_TOYYIBPAY_CATEGORY_CODE || '';

  if (!secretKey || !categoryCode) {
    return {
      error: 'ToyyibPay credentials are not configured.',
    };
  }

  const payload = new URLSearchParams();
  payload.append('userSecretKey', secretKey);
  payload.append('billCode', billCode);

  try {
    const response = await fetch(`${TOYYIBPAY_API}/getBillTransactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload.toString(),
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
    const hasPaid =
      Array.isArray(transactions) &&
      transactions.some(
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
