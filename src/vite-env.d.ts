/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_TOYYIBPAY_SECRET_KEY: string;
  readonly VITE_TOYYIBPAY_CATEGORY_CODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
