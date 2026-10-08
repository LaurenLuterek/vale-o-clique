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

  const url = new URL(context.request.url);
  const query = url.searchParams.get("q");

  if (!query) {
    return new Response(
      JSON.stringify({
        erro: "Informe o produto. Exemplo: ?q=cadeira%20gamer",
      }),
      {
        status: 400,
        headers: {
          "content-type": "application/json; charset=UTF-8",
        },
      }
    );
  }

  const searchUrl = new URL(
    "https://api.mercadolibre.com/sites/MLB/search"
  );

  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("limit", "10");

  const response = await fetch(searchUrl.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      Accept: "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    return new Response(
      JSON.stringify({
        erro: "O Mercado Livre recusou a busca.",
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

  const produtos = (data.results || []).map((produto) => ({
    id: produto.id,
    titulo: produto.title,
    preco: produto.price,
    precoOriginal: produto.original_price,
    moeda: produto.currency_id,
    imagem: produto.thumbnail,
    link: produto.permalink,
    vendedor: produto.seller?.nickname || null,
    categoria: produto.category_id,
    condicao: produto.condition,
    vendido: produto.sold_quantity,
  }));

  return new Response(
    JSON.stringify(
      {
        status: 200,
        busca: query,
        totalEncontrado: data.paging?.total || 0,
        produtos,
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
