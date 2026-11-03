/**
 * Pluggable Admin Authentication Adapter
 *
 * NOTE: Credentials are NOT hardcoded in client code.
 * This adapter provides a clean async abstraction layer that can be plugged
 * into any backend infrastructure:
 * - Next.js / Astro SSR API Route (`/api/auth/login`) with bcrypt + httpOnly cookie session
 * - Supabase Auth (`supabase.auth.signInWithPassword(...)`)
 * - Firebase Authentication
 * - Cloudflare Workers / OAuth2 / MSAL
 */

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  redirectUrl?: string;
}

/**
 * Primary authentication entrypoint called by the admin login interface.
 */
export async function authenticateAdmin(credentials: AuthCredentials): Promise<AuthResponse> {
  // Simulate network latency for the authentic retro feel
  await new Promise((resolve) => setTimeout(resolve, 850));

  // --- PLUG YOUR REAL BACKEND HERE ---
  // Example real implementation:
  // const res = await fetch('/api/auth/login', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(credentials),
  // });
  // return await res.json();

  // Current stub handler (never hardcodes static passwords):
  // Rejects default attempts with a security instruction, or handles stub demo
  if (!credentials.username || !credentials.password) {
    return {
      success: false,
      message: 'Both username and password are required.',
    };
  }

  // Safe stub feedback:
  return {
    success: false,
    message: 'Backend auth service not yet connected. Configure API endpoint in src/scripts/auth.ts.',
  };
}

