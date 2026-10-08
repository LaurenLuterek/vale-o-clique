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
        erro: "Os dados de conexão do Mercado Livre estão inválidos.",
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

  const response = await fetch(
    "https://api.mercadolibre.com/users/me",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        Accept: "application/json",
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    return new Response(
      JSON.stringify({
        erro: "O Mercado Livre recusou a consulta da conta.",
        status: response.status,
        detalhes: data,
      }),
      {
        status: response.status,
        headers: {
          "content-type": "application/json; charset=UTF-8",
        },
      }
    );
  }

  return new Response(
    JSON.stringify(
      {
        conectado: true,
        user_id: data.id || data.user_id,
        nickname: data.nickname,
        site_id: data.site_id,
      },
      null,
      2
    ),
    {
      status: 200,
      headers: {
        "content-type": "application/json; charset=UTF-8",
      },
    }
  );
}
