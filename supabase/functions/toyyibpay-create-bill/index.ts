import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CreateBillResponse {
  billCode?: string;
  [key: string]: unknown;
}

interface CreateBillRequest {
  returnUrl?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[toyyibpay-create-bill] Missing Authorization header");
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userSupabase.auth.getUser();
    if (userError || !user) {
      console.error("[toyyibpay-create-bill] Auth failed:", userError?.message ?? "no user");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userSecretKey = Deno.env.get("TOYYIBPAY_SECRET_KEY");
    const categoryCode = Deno.env.get("TOYYIBPAY_CATEGORY_CODE");

    if (!userSecretKey || !categoryCode) {
      console.error("[toyyibpay-create-bill] Missing ToyyibPay env vars:", {
        hasSecretKey: !!userSecretKey,
        hasCategoryCode: !!categoryCode,
      });
      return new Response(
        JSON.stringify({ error: "ToyyibPay credentials not configured. Please add TOYYIBPAY_SECRET_KEY and TOYYIBPAY_CATEGORY_CODE as edge function secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Parse the return URL from the request body, fallback to constructing from request origin
    let requestBody: CreateBillRequest = {};
    try {
      requestBody = await req.json();
    } catch {
      // Body might be empty, that's okay
    }
    const returnUrl = requestBody.returnUrl || `${new URL(req.url).origin}/payment-success`;

    const formData = new FormData();
    formData.append("userSecretKey", userSecretKey);
    formData.append("categoryCode", categoryCode);
    formData.append("billName", "MIAT Central Pro Monthly");
    formData.append("billDescription", "Monthly subscription to MIAT Central Pro - full access to EASA Part-66 question banks, worked solutions, and PDF bundles");
    formData.append("billAmount", "1500");
    formData.append("billReturnUrl", returnUrl);
    formData.append("billCallbackUrl", returnUrl);
    formData.append("billExternalReferenceNo", user.id);
    formData.append("billTo", user.email ?? "");
    formData.append("billEmail", user.email ?? "");
    formData.append("billPhone", "0123456789");
    formData.append("billSplitPaymentArgs", "");
    formData.append("billPaymentChannel", "0");
    formData.append("billContentFields", "");
    formData.append("billChargeToCustomer", "");

    console.log("[toyyibpay-create-bill] Calling ToyyibPay createBill for user:", user.id);

    const toyyibpayResponse = await fetch(
      "https://toyyibpay.com/index.php/api/createBill",
      { method: "POST", body: formData },
    );

    if (!toyyibpayResponse.ok) {
      const errorText = await toyyibpayResponse.text();
      console.error("[toyyibpay-create-bill] ToyyibPay API error:", {
        status: toyyibpayResponse.status,
        statusText: toyyibpayResponse.statusText,
        body: errorText,
      });
      return new Response(
        JSON.stringify({ error: `ToyyibPay API returned ${toyyibpayResponse.status}: ${errorText.slice(0, 200)}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const result: CreateBillResponse[] | CreateBillResponse = await toyyibpayResponse.json();
    const billCode = Array.isArray(result) ? result[0]?.billCode : result?.billCode;

    if (!billCode) {
      console.error("[toyyibpay-create-bill] No billCode in response:", JSON.stringify(result));
      return new Response(
        JSON.stringify({ error: "ToyyibPay did not return a bill code" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log("[toyyibpay-create-bill] Bill created successfully, billCode:", billCode);

    // Store the billCode in the transactions table using service role
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
    const { error: insertError } = await adminSupabase
      .from("transactions")
      .insert({
        user_id: user.id,
        bill_code: billCode,
        bill_amount: 1500,
        status: "pending",
      });

    if (insertError) {
      console.error("[toyyibpay-create-bill] Failed to insert transaction:", insertError.message);
    }

    return new Response(
      JSON.stringify({ billCode }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[toyyibpay-create-bill] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
