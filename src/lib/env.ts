/**
 * Environment variable validation.
 * Fails fast at startup with clear error messages.
 * NEVER import env vars directly — always use this module.
 */
function requireEnv(key: string): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
      `Copy .env.example to .env.local and fill in your Supabase credentials.`
    );
  }
  return value;
}

export const ENV = {
  SUPABASE_URL: requireEnv('VITE_SUPABASE_URL'),
  SUPABASE_ANON_KEY: requireEnv('VITE_SUPABASE_ANON_KEY'),
  APP_NAME: import.meta.env.VITE_APP_NAME || 'RotaryConnect',
} as const;
