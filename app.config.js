const appJson = require('./app.json');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Injects Supabase env vars into the native app bundle via expo-constants.
 * Local dev: loaded from .env (EXPO_PUBLIC_*).
 * EAS builds: set variables on Expo → Project → Environment variables → production.
 */
module.exports = () => {
  if (process.env.EAS_BUILD === 'true' && (!supabaseUrl || !supabaseAnonKey)) {
    throw new Error(
      'EAS build missing Supabase env vars. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to the production environment on expo.dev before building.'
    );
  }

  return {
    expo: {
      ...appJson.expo,
      extra: {
        ...appJson.expo.extra,
        supabaseUrl,
        supabaseAnonKey,
      },
    },
  };
};
