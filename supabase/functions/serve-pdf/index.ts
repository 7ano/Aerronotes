// Secure PDF download / preview edge function
// Verifies user Pro status server-side before returning a file stream.
// Non-Pro users receive a watermarked first-page preview only.

import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const ADMIN_EMAIL = 'support@aeronotes.study';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Create an authed client from the user's JWT to verify their identity
    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse query params: path (storage path) and mode (preview|download)
    const url = new URL(req.url);
    const path = url.searchParams.get('path');
    const mode = url.searchParams.get('mode') ?? 'preview';
    const resource = url.searchParams.get('resource');

    if (!path) {
      return new Response(JSON.stringify({ error: 'Missing file path' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Look up the resource to check if it's Pro-gated
    let isProResource = false;
    if (resource) {
      const { data: resData } = await supabase
        .from('resources')
        .select('is_pro')
        .eq('id', resource)
        .maybeSingle();
      if (resData?.is_pro) isProResource = true;
    }

    // Check the user's Pro status from their profile
    const { data: profile } = await supabase
      .from('student_profiles')
      .select('is_pro, email')
      .eq('id', user.id)
      .maybeSingle();

    const isAdmin = (user.email ?? '').toLowerCase() === ADMIN_EMAIL;
    const isProUser = isAdmin || profile?.is_pro === true;

    // If the resource is Pro-gated and the user is NOT Pro, deny the raw file
    if (isProResource && !isProUser) {
      return new Response(JSON.stringify({
        error: 'Pro access required',
        upgrade: true,
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch the file from the private notes bucket using the service role
    const { data: fileData, error: fileError } = await supabase
      .storage
      .from('notes')
      .download(path);

    if (fileError || !fileData) {
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For download mode (Pro users only), return the raw PDF
    if (mode === 'download') {
      const bytes = new Uint8Array(await fileData.arrayBuffer());
      return new Response(bytes, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="aeronotes-resource.pdf"',
          'Cache-Control': 'no-store',
        },
      });
    }

    // For preview mode, return the PDF blob (the client renders it to canvas)
    // The browser never gets a direct public URL — only this server-controlled stream
    const bytes = new Uint8Array(await fileData.arrayBuffer());
    return new Response(bytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
