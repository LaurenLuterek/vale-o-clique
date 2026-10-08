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

  const meResponse = await fetch(
    "https://api.mercadolibre.com/users/me",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        Accept: "application/json",
      },
    }
  );

  const meData = await meResponse.json();

  if (!meResponse.ok) {
    return new Response(
      JSON.stringify({
        erro: "Não foi possível identificar o usuário.",
        detalhes: meData,
      }),
      {
        status: meResponse.status,
        headers: {
          "content-type": "application/json; charset=UTF-8",
        },
      }
    );
  }

  const userId = meData.id || meData.user_id;

  const grantsResponse = await fetch(
    `https://api.mercadolibre.com/users/${userId}/applications`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        Accept: "application/json",
      },
    }
  );

  const grantsData = await grantsResponse.json();

  return new Response(
    JSON.stringify(
      {
        user_id: userId,
        status: grantsResponse.status,
        aplicativos: grantsData,
      },
      null,
      2
    ),
    {
      status: grantsResponse.ok ? 200 : grantsResponse.status,
      headers: {
        "content-type": "application/json; charset=UTF-8",
      },
    }
  );
}
