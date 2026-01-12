import { okResponse, notOkResponse, notOk } from './lib/constants.js'
import { apiKey, handleCORS } from './lib/checks.js'

export async function onRequest(context) {
  // handle POST/JSON/apikey chcecks
  const r = handleCORS(context.request) || apiKey(context.request, context.env)
  if (r) return r


  // get request args
  let url = new URL(context.request.url)
  const key = url.searchParams.get('key')
  if (!key) {
    return new Response(notOk, notOkResponse)
  }
  
  // write to object storage
  const r2obj = await context.env.VIDEO_BUCKET.put(key, context.request.body)

  return new Response(JSON.stringify(r2obj), okResponse)
}

