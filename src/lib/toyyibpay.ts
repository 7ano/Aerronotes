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
      error: 'ToyyibPay credentials missing. Check VITE_TOYYIBPAY_SECRET_KEY and VITE_TOYYIBPAY_CATEGORY_CODE.',
    };
  }

  const studentName = params.userFullName || params.userEmail.split('@')[0] || 'MIAT Student';
  const studentEmail = params.userEmail || 'student@s.unikl.edu.my';
  const studentPhone = params.userPhone || '0123456789';

  // Use native FormData object
  const body = new FormData();
  body.append('userSecretKey', secretKey);
  body.append('categoryCode', categoryCode);
  body.append('billName', 'MIAT Central Pro');
  body.append('billDescription', 'Pro Subscription Access');
  body.append('billPriceSetting', '1');
  body.append('billPayorInfo', '1');
  body.append('billTo', studentName);
  body.append('billEmail', studentEmail);
  body.append('billPhone', studentPhone);
  body.append('billAmount', '1500'); // RM15.00
  body.append('billReturnUrl', params.returnUrl);
  body.append('billCallbackUrl', params.callbackUrl);
  body.append('billExternalReferenceNo', params.userId || 'SUB-PRO');

  try {
    const response = await fetch(`${TOYYIBPAY_API}/createBill`, {
      method: 'POST',
      body: body, // Send raw FormData (browser handles headers automatically)
    });

    const text = await response.text();
    console.log('[toyyibpay] raw response:', text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return { error: `ToyyibPay returned non-JSON response: ${text.slice(0, 150)}` };
    }

    const billCode = Array.isArray(data)
      ? data[0]?.BillCode ?? data[0]?.billCode
      : data?.BillCode ?? data?.billCode;

    if (!billCode) {
      const errorDetail = Array.isArray(data)
        ? data[0]?.msg ?? JSON.stringify(data)
        : data?.msg ?? JSON.stringify(data);
      return {
        error: `ToyyibPay error: ${errorDetail}`,
      };
    }

    return { billCode };
  } catch (err) {
    return {
      error: `Network error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
