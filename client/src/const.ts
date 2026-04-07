export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Detecta se está rodando com Google OAuth (Railway/externo) ou Manus OAuth
// Google OAuth é ativado quando VITE_GOOGLE_AUTH=true OU quando VITE_OAUTH_PORTAL_URL não está configurado
const isGoogleAuth =
  !!import.meta.env.VITE_GOOGLE_AUTH ||
  !import.meta.env.VITE_OAUTH_PORTAL_URL ||
  !import.meta.env.VITE_APP_ID;

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  if (isGoogleAuth) {
    // Google OAuth: redireciona para a rota do backend que inicia o fluxo Google
    return `/api/auth/google`;
  }

  // Manus OAuth (padrão na plataforma Manus)
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
