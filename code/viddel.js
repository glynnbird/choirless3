import { okResponse, notOkResponse, missingResponse, notOk } from './lib/constants.js'
import { mustBePOST, mustBeJSON, apiKey, handleCORS } from './lib/checks.js'
import { get } from './lib/db.js'

export async function onRequest(context) {
  // handle POST/JSON/apikey chcecks
  const r =  handleCORS(context.request) || apiKey(context.request, context.env) || mustBePOST(context.request) || mustBeJSON(context.request)
  if (r) return r

  // parse the json
  const json = await context.request.json()

  // if there's a id
  if (json.key) {

    const response = await context.env.VIDEO_BUCKET.delete(json.key)

    // send response
    return new Response(JSON.stringify(response), okResponse)
  }

  // everyone else gets a 400 response
  return new Response(notOk, notOkResponse)

}
