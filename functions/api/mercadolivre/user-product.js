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

  const tokens = JSON.parse(tokensJson);

  const url = new URL(context.request.url);
  const productId = url.searchParams.get("id");

  if (!productId) {
    return new Response(
      JSON.stringify({
        erro: "Informe o ID do User Product. Exemplo: ?id=MLBU4448900599",
      }),
      {
        status: 400,
        headers: {
          "content-type": "application/json; charset=UTF-8",
        },
      }
    );
  }

  const response = await fetch(
    `https://api.mercadolibre.com/user-products/${encodeURIComponent(
      productId
    )}`,
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
        produto: data,
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
