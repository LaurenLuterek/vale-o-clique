export async function onRequestGet(context) {
  const tokensJson = await context.env.ML_TOKENS.get("mercadolivre");

  if (!tokensJson) {
    return new Response(
      JSON.stringify({
        erro: "Mercado Livre ainda não está conectado.",
      }),
      {
        status: 401,
        headers: {
          "content-type": "application/json; charset=UTF-8",
        },
      }
    );
  }

  let tokens;

  try {
    tokens = JSON.parse(tokensJson);
  } catch {
    return new Response(
      JSON.stringify({
        erro: "Dados de conexão inválidos.",
      }),
      {
        status: 500,
        headers: {
          "content-type": "application/json; charset=UTF-8",
        },
      }
    );
  }

  if (!tokens.access_token) {
    return new Response(
      JSON.stringify({
        erro: "Access Token não encontrado.",
      }),
      {
        status: 401,
        headers: {
          "content-type": "application/json; charset=UTF-8",
        },
      }
    );
  }

  const appId = context.env.ML_CLIENT_ID;

  if (!appId) {
    return new Response(
      JSON.stringify({
        erro: "ML_CLIENT_ID não configurado.",
      }),
      {
        status: 500,
        headers: {
          "content-type": "application/json; charset=UTF-8",
        },
      }
    );
  }

  const response = await fetch(
    `https://api.mercadolibre.com/applications/${appId}/grants`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        Accept: "application/json",
      },
    }
  );

  const data = await response.json();

  return new Response(
    JSON.stringify(
      {
        status: response.status,
        grants: data,
      },
      null,
      2
    ),
    {
      status: response.ok ? 200 : response.status,
      headers: {
        "content-type": "application/json; charset=UTF-8",
      },
    }
  );
}
