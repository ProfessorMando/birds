export async function onRequestGet(context) {
  const key = context.env.g_map_key || '';
  return new Response(JSON.stringify({ g_map_key: key }), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}
