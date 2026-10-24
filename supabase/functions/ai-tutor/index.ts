import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ADMIN_EMAIL = "support@aeronotes.study";
const FREE_DAILY_LIMIT = 5;

const SYSTEM_PROMPT = `You are AeroNotes AI, an expert EASA Part-66 and UniKL MIAT Aviation Engineering Tutor.

Your expertise covers:
- Electrical Fundamentals (M3, M4, M5)
- Aerodynamics (M8)
- Thermofluids (M6, M9)
- Gas Turbine Engines (M15)
- Piston Engines (M14)
- Aircraft Structures (M10, M11)
- Aviation Legislation (M9)

Guidelines:
- Provide clear, step-by-step explanations suitable for aviation engineering students.
- Use LaTeX for all mathematical formulas (wrap inline math in $...$ and display math in $$...$$).
- Use clean Markdown formatting with headings, bullet points, and numbered steps.
- Relate explanations to real-world aviation maintenance and engineering contexts.
- If a question is outside aviation engineering, gently redirect to relevant aviation topics.
- Be encouraging and educational. Suggest follow-up topics when helpful.`;

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
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Determine pro status
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
    const isAdmin = user.email?.toLowerCase() === ADMIN_EMAIL;

    let isPro = isAdmin;
    if (!isPro) {
      const { data: profile } = await adminSupabase
        .from("student_profiles")
        .select("is_pro")
        .eq("id", user.id)
        .maybeSingle();
      isPro = profile?.is_pro ?? false;
    }

    // Enforce daily limit for free users
    if (!isPro) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count, error: countError } = await adminSupabase
        .from("ai_queries")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", twentyFourHoursAgo);

      if (countError) {
        console.error("[ai-tutor] Count error:", countError.message);
      }

      const usedToday = count ?? 0;
      if (usedToday >= FREE_DAILY_LIMIT) {
        return new Response(
          JSON.stringify({
            error: "daily_limit_reached",
            limit: FREE_DAILY_LIMIT,
            used: usedToday,
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    // Parse request body
    const { message, history } = await req.json();
    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Build conversation contents for Gemini
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    if (Array.isArray(history)) {
      for (const msg of history) {
        if (msg.role === "user" && msg.content) {
          contents.push({ role: "user", parts: [{ text: msg.content }] });
        } else if (msg.role === "assistant" && msg.content) {
          contents.push({ role: "model", parts: [{ text: msg.content }] });
        }
      }
    }
    contents.push({ role: "user", parts: [{ text: message }] });

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      console.error("[ai-tutor] GEMINI_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured. Please add GEMINI_API_KEY as an edge function secret." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("[ai-tutor] Gemini API error:", geminiResponse.status, errorText.slice(0, 300));
      return new Response(
        JSON.stringify({ error: `AI service error (${geminiResponse.status})` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const geminiData = await geminiResponse.json();
    const aiText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!aiText) {
      console.error("[ai-tutor] Empty Gemini response:", JSON.stringify(geminiData).slice(0, 300));
      return new Response(
        JSON.stringify({ error: "AI returned an empty response. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Store the query for usage tracking
    const { error: insertError } = await adminSupabase
      .from("ai_queries")
      .insert({
        user_id: user.id,
        query_text: message.slice(0, 5000),
        response_text: aiText.slice(0, 10000),
      });

    if (insertError) {
      console.error("[ai-tutor] Failed to store query:", insertError.message);
    }

    // Calculate remaining queries for free users
    let remaining: number | null = null;
    if (!isPro) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: newCount } = await adminSupabase
        .from("ai_queries")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", twentyFourHoursAgo);
      remaining = Math.max(0, FREE_DAILY_LIMIT - (newCount ?? 0));
    }

    return new Response(
      JSON.stringify({ response: aiText, remaining, isPro }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[ai-tutor] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
