export async function onRequestGet(context) {
  const url = new URL(context.request.url);

  const itemId = url.searchParams.get("id");

  if (!itemId) {
    return new Response(
      JSON.stringify({
        erro: "Informe o ID do produto. Exemplo: ?id=MLB1234567890",
      }),
      {
        status: 400,
        headers: {
          "content-type": "application/json; charset=UTF-8",
        },
      }
    );
  }

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
        erro: "Token de acesso do Mercado Livre não encontrado.",
      }),
      {
        status: 401,
        headers: {
          "content-type": "application/json; charset=UTF-8",
        },
      }
    );
  }

  const productResponse = await fetch(
    `https://api.mercadolibre.com/items/${encodeURIComponent(itemId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        Accept: "application/json",
      },
    }
  );

  const productData = await productResponse.json();

  if (!productResponse.ok) {
    return new Response(
      JSON.stringify({
        erro: "Não foi possível consultar o produto no Mercado Livre.",
        detalhes: productData,
      }),
      {
        status: productResponse.status,
        headers: {
          "content-type": "application/json; charset=UTF-8",
        },
      }
    );
  }

  return new Response(
    JSON.stringify(
      {
        id: productData.id,
        titulo: productData.title,
        preco: productData.price,
        moeda: productData.currency_id,
        imagem: productData.thumbnail,
        link: productData.permalink,
        vendedor: productData.seller_id,
        categoria: productData.category_id,
        disponivel: productData.available_quantity,
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
