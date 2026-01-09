import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { okResponse, notOkResponse, missingResponse, notOk } from './lib/constants.js'
import { mustBePOST, mustBeJSON, apiKey, handleCORS } from './lib/checks.js'
import { get } from './lib/db.js'



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
  const ACCOUNT_ID = context.request.headers.get('ACCOUNT_ID')
  const AWS_ACCESS_KEY_ID = context.request.headers.get('AWS_ACCESS_KEY_ID')
  const AWS_SECRET_ACCESS_KEY= context.request.headers.get('AWS_SECRET_ACCESS_KEY')
  const BUCKET = context.request.headers.get('BUCKET')

  const S3 = new S3Client({
    region: "auto", // Required by SDK but not used by R2
    // Provide your Cloudflare account ID
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    // Retrieve your S3 API credentials for your R2 bucket via API tokens (see: https://developers.cloudflare.com/r2/api/tokens)
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY
    },
  })


  // Generate presigned URL for reading (GET)
  const putUrl = await getSignedUrl(
    S3,
    new PutObjectCommand({ Bucket: BUCKET, Key: json.path }),
    { expiresIn: 3600 }, // Valid for 1 hour
  );

  // reply
  const response = {
    ok: true,
    url: putUrl
  }
  return new Response(JSON.stringify(response), okResponse)

}

