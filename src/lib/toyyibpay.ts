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
  try {
    // Routes request through serverless proxy to eliminate browser CORS dropping form fields
    const response = await fetch('/api/create-toyyibpay-bill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data: ToyyibPayBillResponse[] | ToyyibPayBillResponse = await response.json();

    if (!response.ok) {
      const errorMsg = Array.isArray(data)
        ? data[0]?.msg ?? JSON.stringify(data)
        : (data as any)?.error ?? (data as ToyyibPayBillResponse)?.msg ?? JSON.stringify(data);
      
      return {
        error: `ToyyibPay API error (HTTP ${response.status}): ${errorMsg}`,
        status: response.status,
      };
    }

    // Parse bill code from Array [{ BillCode: "xxx" }] or Object { BillCode: "xxx" }
    const billCode = Array.isArray(data)
      ? data[0]?.BillCode ?? data[0]?.billCode
      : data.BillCode ?? data.billCode;

    if (!billCode) {
      const errorDetail = Array.isArray(data)
        ? data[0]?.msg ?? JSON.stringify(data)
        : data.msg ?? JSON.stringify(data);
      return {
        error: `ToyyibPay did not return a bill code. Response: ${errorDetail.slice(0, 300)}`,
      };
    }

    return { billCode };
  } catch (err) {
    return {
      error: `Network error contacting server: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export async function verifyBill(billCode: string): Promise<VerifyBillResult | ToyyibPayError> {
  const secretKey = import.meta.env.VITE_TOYYIBPAY_SECRET_KEY || '';

  if (!secretKey) {
    return { error: 'ToyyibPay secret key is not configured.' };
  }

  const payload = new URLSearchParams();
  payload.append('userSecretKey', secretKey);
  payload.append('billCode', billCode);

  try {
    const response = await fetch('https://toyyibpay.com/index.php/api/getBillTransactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
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
    return {
      error: `Network error verifying payment: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
