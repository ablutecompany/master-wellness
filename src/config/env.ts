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
    throw new Error('[ENV FATAL] EXPO_PUBLIC_BACKEND_URL obrigatória em produção.');
  }

  return 'http://localhost:3000';
};

export const ENV = {
  BACKEND_URL: getBackendUrl(),
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  IS_DEV: !isProduction,
};

// Fail-fast no frontend
if (isProduction && (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY)) {
  throw new Error('[ENV FATAL] Configuração do Supabase obrigatória em produção.');
}
