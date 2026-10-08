export async function onRequestPost(context) {
  return new Response("OK", {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=UTF-8",
    },
  });
}

export async function onRequestGet(context) {
  return new Response("Mercado Livre notifications funcionando!", {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=UTF-8",
    },
  });
}
