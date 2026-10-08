export async function onRequestGet(context) {
  const url = new URL(context.request.url);

  return new Response(
    `Callback do Mercado Livre funcionando!\
<br><br>\
Código recebido: ${url.searchParams.get("code") || "nenhum"}\
<br>\
Estado: ${url.searchParams.get("state") || "nenhum"}`,
    {
      headers: {
        "content-type": "text/html; charset=UTF-8",
      },
    }
  );
}
