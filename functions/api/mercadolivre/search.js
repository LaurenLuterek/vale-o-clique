export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const query = url.searchParams.get("q");

  if (!query) {
    return new Response(
      JSON.stringify({
        erro: "Informe o que deseja pesquisar. Exemplo: ?q=aspirador",
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
  searchUrl.searchParams.set("limit", "20");

  const response = await fetch(searchUrl.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    return new Response(
      JSON.stringify({
        erro: "Não foi possível pesquisar produtos no Mercado Livre.",
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
    condicao: produto.condition,
    quantidadeDisponivel: produto.available_quantity,
    quantidadeVendida: produto.sold_quantity,
  }));

  return new Response(
    JSON.stringify(
      {
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
