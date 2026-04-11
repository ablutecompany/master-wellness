/**
 * FRONTEND RUNTIME CONFIGURATION — M6 Fatia 1
 * Centralizes all environment-specific constants.
 */

const isProduction = process.env.NODE_ENV === 'production';

const getBackendUrl = () => {
  if (process.env.EXPO_PUBLIC_BACKEND_URL) {
    return process.env.EXPO_PUBLIC_BACKEND_URL;
  }

  if (isProduction) {
    // Warn but don't crash — allows Guest mode to work without backend
    console.warn('[ENV] EXPO_PUBLIC_BACKEND_URL not set. Backend features will be unavailable.');
    return '';
  }

  return 'http://localhost:3000';
};

export const ENV = {
  BACKEND_URL: getBackendUrl(),
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  IS_DEV: !isProduction,
};

// Warn but don't throw — allows app to boot even with missing config
if (isProduction && (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY)) {
  console.warn('[ENV] Supabase config missing. Auth features will not work.');
}
