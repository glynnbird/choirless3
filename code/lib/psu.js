/**
 * R2 Utilities for Cloudflare Workers
 * Custom implementation of AWS Signature Version 4 for R2 presigned URLs
 */

/**
 * Generate a presigned URL for R2 uploads using AWS Signature Version 4
 * Compatible with Cloudflare Workers (no Node.js dependencies)
 */
export async function generateR2PresignedUrl(method, key, contentType, expiresIn, credentials) {
  console.log(credentials)
  // Validate inputs
  if (
    !credentials.AWS_ACCESS_KEY_ID ||
    !credentials.AWS_SECRET_ACCESS_KEY ||
    !credentials.ACCOUNT_ID ||
    !credentials.BUCKET
  ) {
    throw new Error("Missing required R2 credentials");
  }

  if (!key || !contentType || expiresIn <= 0) {
    throw new Error("Invalid parameters for presigned URL generation");
  }

  const date = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = date.slice(0, 8);

  // Create the canonical request with bucket name in path
  const bucketName = credentials.BUCKET || "development";
  const canonicalUri = `/${bucketName}/${key}`;

  // Build query parameters for presigned URL
  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const credential = `${credentials.AWS_ACCESS_KEY_ID}/${credentialScope}`;

  const queryParams = {
    "X-Amz-Algorithm": algorithm,
    "X-Amz-Credential": credential,
    "X-Amz-Date": date,
    "X-Amz-Expires": expiresIn.toString(),
    "X-Amz-SignedHeaders": "content-type;host;x-amz-date",
  };

  // Sort query parameters alphabetically
  const sortedQueryParams = Object.keys(queryParams)
    .sort()
    .map((key) => `${key}=${encodeURIComponent(queryParams[key])}`)
    .join("&");

  const canonicalQueryString = sortedQueryParams;

  // Create canonical headers (must be sorted alphabetically)
  const canonicalHeaders = `content-type:${contentType}\nhost:${credentials.ACCOUNT_ID}.r2.cloudflarestorage.com\nx-amz-date:${date}\n`;
  const signedHeaders = "content-type;host;x-amz-date";

  // Create the payload hash (empty for PUT requests)
  const payloadHash = "UNSIGNED-PAYLOAD";

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  // Create the string to sign
  const stringToSign = [
    algorithm,
    date,
    credentialScope,
    await sha256(canonicalRequest),
  ].join("\n");

  // Calculate the signature
  const signature = await getSignatureKey(
    credentials.AWS_SECRET_ACCESS_KEY,
    dateStamp,
    "auto",
    "s3",
    stringToSign
  );

  // Build the presigned URL with the signature and bucket name
  const url = `https://${credentials.ACCOUNT_ID}.r2.cloudflarestorage.com/${bucketName}/${key}?${canonicalQueryString}&X-Amz-Signature=${signature}`;

  // Validate the generated URL
  try {
    new URL(url);
  } catch (error) {
    throw new Error(`Generated invalid URL: ${error}`);
  }

  return url;
}

/**
 * Calculate SHA256 hash using Web Crypto API
 */
async function sha256(message){
  try {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch (error) {
    throw new Error(`SHA256 calculation failed: ${error}`);
  }
}

/**
 * Calculate HMAC-SHA256 using Web Crypto API
 */
async function hmacSha256(key, message) {
  try {
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const messageBuffer = new TextEncoder().encode(message);
    return await crypto.subtle.sign("HMAC", cryptoKey, messageBuffer);
  } catch (error) {
    throw new Error(`HMAC-SHA256 calculation failed: ${error}`);
  }
}

/**
 * Generate AWS Signature Version 4 signing key
 */
async function getSignatureKey(key, dateStamp, regionName, serviceName, stringToSign) {
  try {
    const kDate = await hmacSha256(
      new TextEncoder().encode("AWS4" + key).buffer,
      dateStamp
    );
    const kRegion = await hmacSha256(kDate, regionName);
    const kService = await hmacSha256(kRegion, serviceName);
    const kSigning = await hmacSha256(kService, "aws4_request");
    const signature = await hmacSha256(kSigning, stringToSign);

    const signatureArray = new Uint8Array(signature);
    return Array.from(signatureArray)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch (error) {
    throw new Error(`Signature key generation failed: ${error}`);
  }
}
