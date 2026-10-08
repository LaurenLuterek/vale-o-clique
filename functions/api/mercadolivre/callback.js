export async function onRequestGet(context) {
  const url = new URL(context.request.url);

  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return new Response(
      `O Mercado Livre não autorizou a conexão.<br><br>Erro: ${error}`,
      {
        status: 400,
        headers: {
          "content-type": "text/html; charset=UTF-8",
        },
      }
    );
  }

  if (!code || !returnedState) {
    return new Response(
      "Código ou estado não recebido pelo Mercado Livre.",
      {
        status: 400,
        headers: {
          "content-type": "text/html; charset=UTF-8",
        },
      }
    );
  }

  const cookieHeader = context.request.headers.get("Cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)ML_OAUTH=([^;]+)/);

  if (!match) {
    return new Response(
      "Sessão de autorização não encontrada. Tente conectar novamente.",
      {
        status: 400,
        headers: {
          "content-type": "text/html; charset=UTF-8",
        },
      }
    );
  }

  let oauthData;

  try {
    oauthData = JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return new Response("Dados de autorização inválidos.", {
      status: 400,
      headers: {
        "content-type": "text/html; charset=UTF-8",
      },
    });
  }

  if (returnedState !== oauthData.state) {
    return new Response(
      "Falha de segurança: o estado da autorização não confere.",
      {
        status: 400,
        headers: {
          "content-type": "text/html; charset=UTF-8",
        },
      }
    );
  }

  const clientId = context.env.ML_CLIENT_ID;
  const clientSecret = context.env.ML_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new Response(
      "Credenciais do Mercado Livre não configuradas no Cloudflare.",
      {
        status: 500,
        headers: {
          "content-type": "text/html; charset=UTF-8",
        },
      }
    );
  }

  const redirectUri =
    "https://valeoclique.pages.dev/api/mercadolivre/callback";

  const body = new URLSearchParams();

  body.set("grant_type", "authorization_code");
  body.set("client_id", clientId);
  body.set("client_secret", clientSecret);
  body.set("code", code);
  body.set("redirect_uri", redirectUri);
  body.set("code_verifier", oauthData.codeVerifier);

  const tokenResponse = await fetch(
    "https://api.mercadolibre.com/oauth/token",
    {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    }
  );

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok) {
    return new Response(
      `Não foi possível conectar ao Mercado Livre.<br><br>Detalhes: ${JSON.stringify(
        tokenData
      )}`,
      {
        status: 400,
        headers: {
          "content-type": "text/html; charset=UTF-8",
        },
      }
    );
  }

  await context.env.ML_TOKENS.put(
    "mercadolivre",
    JSON.stringify(tokenData)
  );

  return new Response(
    `
      <h2>Mercado Livre conectado! 🎉</h2>
      <p>A autorização foi concluída com sucesso.</p>
      <p>Os dados de autorização foram armazenados com segurança.</p>
    `,
    {
      status: 200,
      headers: {
        "content-type": "text/html; charset=UTF-8",
      },
    }
  );
}
