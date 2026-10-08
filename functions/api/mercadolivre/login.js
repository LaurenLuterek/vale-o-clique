export async function onRequestGet(context) {
  const clientId = context.env.ML_CLIENT_ID;

  if (!clientId) {
    return new Response("ML_CLIENT_ID não configurado.", {
      status: 500,
    });
  }

  const redirectUri =
    "https://valeoclique.pages.dev/api/mercadolivre/callback";

  const state = crypto.randomUUID();

  const codeVerifier = crypto.randomUUID() + crypto.randomUUID();

  const data = new TextEncoder().encode(codeVerifier);
  const hash = await crypto.subtle.digest("SHA-256", data);

  const codeChallenge = btoa(
    String.fromCharCode(...new Uint8Array(hash))
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const authUrl = new URL(
    "https://auth.mercadolivre.com.br/authorization"
  );

  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  return Response.redirect(authUrl.toString(), 302);
}
