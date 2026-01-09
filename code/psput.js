import { okResponse, notOkResponse, missingResponse, notOk } from './lib/constants.js'
import { mustBePOST, mustBeJSON, apiKey, handleCORS } from './lib/checks.js'
import { generateR2PresignedUrl } from './lib/psu2.js'

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
    R2_ACCOUNT_ID: context.env.ACCOUNT_ID,
    R2_ACCESS_KEY_ID: context.env.AWS_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: context.env.AWS_SECRET_ACCESS_KEY,
    R2_BUCKET: context.env.BUCKET
  }

  // generate URL
  const options = {
    key: 'test.jpg', 
    contentType: 'image/jpeg', 
    expiresIn: 3600*24, 
    method: 'PUT'  
  }
  const putUrl = await generateR2PresignedUrl(options, credentials) 

  // reply
  const response = {
    ok: true,
    url: putUrl
  }
  return new Response(JSON.stringify(response), okResponse)

}

