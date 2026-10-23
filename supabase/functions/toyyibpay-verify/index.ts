import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ToyyibPayBill {
  billpaymentStatus?: number;
  billStatus?: string;
  [key: string]: unknown;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userSupabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userSupabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const billCode: string | undefined = body.billCode;

    if (!billCode) {
      return new Response(
        JSON.stringify({ error: "billCode is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userSecretKey = Deno.env.get("TOYYIBPAY_SECRET_KEY");

    if (!userSecretKey) {
      return new Response(
        JSON.stringify({ error: "ToyyibPay credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Check transaction status via ToyyibPay API
    const formData = new FormData();
    formData.append("userSecretKey", userSecretKey);
    formData.append("billCode", billCode);

    const toyyibpayResponse = await fetch(
      "https://toyyibpay.com/index.php/api/getBillTransactions",
      { method: "POST", body: formData },
    );

    if (!toyyibpayResponse.ok) {
      const errorText = await toyyibpayResponse.text();
      console.error("ToyyibPay verify error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to verify payment with ToyyibPay" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const transactions: ToyyibPayBill[] = await toyyibpayResponse.json();
    const hasPaid = transactions.some(
      (t) => t.billpaymentStatus === 1 || t.billStatus === "Paid",
    );

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    if (hasPaid) {
      // Update transaction status to paid
      await adminSupabase
        .from("transactions")
        .update({ status: "paid", updated_at: new Date().toISOString() })
        .eq("bill_code", billCode)
        .eq("user_id", user.id);

      // Set is_pro = true on the student's profile
      const { error: profileError } = await adminSupabase
        .from("student_profiles")
        .update({ is_pro: true, updated_at: new Date().toISOString() })
        .eq("id", user.id);

      if (profileError) {
        console.error("Failed to update student profile:", profileError.message);
      }

      return new Response(
        JSON.stringify({ status: "paid", isPro: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Still pending
    await adminSupabase
      .from("transactions")
      .update({ status: "pending", updated_at: new Date().toISOString() })
      .eq("bill_code", billCode)
      .eq("user_id", user.id);

    return new Response(
      JSON.stringify({ status: "pending", isPro: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
