import { okResponse, notOkResponse, missingResponse, notOk } from './lib/constants.js'
import { mustBePOST, mustBeJSON, apiKey, handleCORS } from './lib/checks.js'
import { generateR2PresignedUrl } from './lib/psu.js'

export async function onRequest(context) {
  // handle POST/JSON/apikey chcecks
  const r = handleCORS(context.request) || apiKey(context.request, context.env) || mustBePOST(context.request) || mustBeJSON(context.request)
  if (r) return r

  // parse the json
  const json = await context.request.json()

  // we need a path
  if (!json.path) {
    return new Response(notOk, notOkResponse)
  }

  // get keys
  const credentials = {
    ACCOUNT_ID: context.request.headers.get('ACCOUNT_ID'),
    AWS_ACCESS_KEY_ID: context.request.headers.get('AWS_ACCESS_KEY_ID'),
    AWS_SECRET_ACCESS_KEY: context.request.headers.get('AWS_SECRET_ACCESS_KEY'),
    BUCKET: context.request.headers.get('BUCKET')
  }

  // generate URL
  const putUrl = await generateR2PresignedUrl('GET', 'test.jpg', 'img/jpeg', 3600*24, credentials) 

  // reply
  const response = {
    ok: true,
    url: putUrl
  }
  return new Response(JSON.stringify(response), okResponse)

}

