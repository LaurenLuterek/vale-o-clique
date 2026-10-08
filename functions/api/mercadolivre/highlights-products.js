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

  const categoryId =
    url.searchParams.get("category") || "MLB432825";

  // 1. Buscar o ranking
  const highlightsResponse = await fetch(
    `https://api.mercadolibre.com/highlights/MLB/category/${encodeURIComponent(
      categoryId
    )}`,
    {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        Accept: "application/json",
      },
    }
  );

  const highlightsData = await highlightsResponse.json();

  if (!highlightsResponse.ok) {
    return new Response(
      JSON.stringify({
        erro: "Não foi possível consultar os mais vendidos.",
        status: highlightsResponse.status,
        detalhes: highlightsData,
      }),
      {
        status: highlightsResponse.status,
        headers: {
          "content-type": "application/json; charset=UTF-8",
        },
      }
    );
  }

  const ranking = highlightsData.content || [];

  // 2. Separar os IDs que são PRODUCT
  const productIds = ranking
    .filter((produto) => produto.type === "PRODUCT")
    .map((produto) => produto.id);

  // 3. Buscar detalhes dos PRODUCTs
  let productsDetails = [];

  if (productIds.length > 0) {
    const bulkUrl = new URL(
      "https://api.mercadolibre.com/items/bulk"
    );

    bulkUrl.searchParams.set("ids", productIds.join(","));

    const productsResponse = await fetch(bulkUrl.toString(), {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        Accept: "application/json",
      },
    });

    if (productsResponse.ok) {
      productsDetails = await productsResponse.json();
    }
  }

  // 4. Organizar os produtos
  const detalhesPorId = {};

  for (const resultado of productsDetails) {
    if (resultado.status_code === 200 && resultado.body) {
      detalhesPorId[resultado.id] = resultado.body;
    }
  }

  const produtos = ranking.map((produto) => {
    const detalhe = detalhesPorId[produto.id];

    return {
      posicao: produto.position,
      id: produto.id,
      tipo: produto.type,

      titulo: detalhe?.title || null,
      preco: detalhe?.price || null,
      precoOriginal: detalhe?.original_price || null,
      moeda: detalhe?.currency_id || "BRL",

      imagem:
        detalhe?.thumbnail ||
        detalhe?.pictures?.[0]?.secure_url ||
        detalhe?.pictures?.[0]?.url ||
        null,

      link: detalhe?.permalink || null,

      categoria: detalhe?.category_id || categoryId,

      disponivel:
        detalhe?.available_quantity ?? null,

      vendas:
        detalhe?.sold_quantity ?? null,
    };
  });

  return new Response(
    JSON.stringify(
      {
        status: 200,
        categoria: categoryId,
        total: produtos.length,
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
