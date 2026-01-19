import { okResponse, notOkResponse, notOk } from './lib/constants.js'
import { mustBePOST, mustBeJSON, apiKey, handleCORS } from './lib/checks.js'
import { add } from './lib/db.js'

export async function onRequest(context) {
  // handle POST/JSON/apikey chcecks
  const r = handleCORS(context.request) || apiKey(context.request, context.env) || mustBePOST(context.request) || mustBeJSON(context.request)
  if (r) return r

  // parse the json
  const json = await context.request.json()

  // if there's a title
  if (json.title) {
    // create a time-based key
    const id = json.id || (new Date().getTime()).toString()

    const doc = {
      id,
      ...json
    }

    // add to KV store
    const response = await add(context.env.CHOIRLESSKV, doc)

    // add JSON to the video bucket
    const key = `${json.id}/song.json`
    await context.env.VIDEO_BUCKET.put(key, doc)

    // send response
    return new Response(JSON.stringify(response), okResponse)
  }
  
  // everyone else gets a 400 response
  return new Response(notOk, notOkResponse)

}
