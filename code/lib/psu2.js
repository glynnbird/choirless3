"use strict";
/**
 * R2 Presigned URL Generator
 *
 * A lightweight, zero-dependency library for generating presigned URLs for Cloudflare R2 storage
 * using AWS Signature Version 4. Compatible with Cloudflare Workers and Node.js environments.
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateR2PresignedUrl = generateR2PresignedUrl;
exports.testPresignedUrlGeneration = testPresignedUrlGeneration;
/**
 * Generate a presigned URL for R2 uploads using AWS Signature Version 4
 * Compatible with Cloudflare Workers (no Node.js dependencies)
 *
 * @param options - Configuration options for the presigned URL
 * @param credentials - R2 credentials
 * @returns Promise<string> - The presigned URL
 *
 * @example
 * ```typescript
 * import { generateR2PresignedUrl } from 'r2-presigned-url';
 *
 * const credentials = {
 *   R2_ACCESS_KEY_ID: 'your-access-key',
 *   R2_SECRET_ACCESS_KEY: 'your-secret-key',
 *   R2_ACCOUNT_ID: 'your-account-id',
 *   R2_BUCKET: 'my-bucket'
 * };
 *
 * const url = await generateR2PresignedUrl(
 *   {
 *     key: 'uploads/file.jpg',
 *     contentType: 'image/jpeg',
 *     expiresIn: 3600
 *   },
 *   credentials
 * );
 * ```
 */
async function generateR2PresignedUrl(options, credentials) {
    const { key, contentType, expiresIn, method = "PUT" } = options;
    // Validate inputs
    if (!credentials.R2_ACCESS_KEY_ID ||
        !credentials.R2_SECRET_ACCESS_KEY ||
        !credentials.R2_ACCOUNT_ID) {
        throw new Error("Missing required R2 credentials");
    }
    if (!key || !contentType || expiresIn <= 0 || expiresIn > 604800) {
        throw new Error("Invalid parameters for presigned URL generation");
    }
    const date = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
    const dateStamp = date.slice(0, 8);
    // Create the canonical request with bucket name in path
    const bucketName = credentials.R2_BUCKET || "development";
    const canonicalUri = `/${bucketName}/${key}`;
    // Build query parameters for presigned URL
    const algorithm = "AWS4-HMAC-SHA256";
    const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
    const credential = `${credentials.R2_ACCESS_KEY_ID}/${credentialScope}`;
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
    const canonicalHeaders = `content-type:${contentType}\nhost:${credentials.R2_ACCOUNT_ID}.r2.cloudflarestorage.com\nx-amz-date:${date}\n`;
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
    const signature = await getSignatureKey(credentials.R2_SECRET_ACCESS_KEY, dateStamp, "auto", "s3", stringToSign);
    // Build the presigned URL with the signature and bucket name
    const url = `https://${credentials.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${bucketName}/${key}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
    // Validate the generated URL
    try {
        new URL(url);
    }
    catch (error) {
        throw new Error(`Generated invalid URL: ${error}`);
    }
    return url;
}
/**
 * Calculate SHA256 hash using Web Crypto API
 */
async function sha256(message) {
    try {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    catch (error) {
        throw new Error(`SHA256 calculation failed: ${error}`);
    }
}
/**
 * Calculate HMAC-SHA256 using Web Crypto API
 */
async function hmacSha256(key, message) {
    try {
        const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const messageBuffer = new TextEncoder().encode(message);
        return await crypto.subtle.sign("HMAC", cryptoKey, messageBuffer);
    }
    catch (error) {
        throw new Error(`HMAC-SHA256 calculation failed: ${error}`);
    }
}
/**
 * Generate AWS Signature Version 4 signing key
 */
async function getSignatureKey(key, dateStamp, regionName, serviceName, stringToSign) {
    try {
        const kDate = await hmacSha256(new TextEncoder().encode("AWS4" + key).buffer, dateStamp);
        const kRegion = await hmacSha256(kDate, regionName);
        const kService = await hmacSha256(kRegion, serviceName);
        const kSigning = await hmacSha256(kService, "aws4_request");
        const signature = await hmacSha256(kSigning, stringToSign);
        const signatureArray = new Uint8Array(signature);
        return Array.from(signatureArray)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
    }
    catch (error) {
        throw new Error(`Signature key generation failed: ${error}`);
    }
}
/**
 * Test function to validate presigned URL generation
 * This can be used for debugging purposes
 *
 * @param credentials - R2 credentials to test with
 * @returns Promise<TestResult> - Test results with success status and debug info
 *
 * @example
 * ```typescript
 * const result = await testPresignedUrlGeneration(credentials);
 * if (result.success) {
 *   console.log('Test passed:', result.url);
 *   console.log('Signature:', result.debug?.signature);
 * } else {
 *   console.error('Test failed:', result.error);
 * }
 * ```
 */
async function testPresignedUrlGeneration(credentials) {
    try {
        const testKey = "test/upload.txt";
        const testContentType = "text/plain";
        const testExpiresIn = 3600;
        const url = await generateR2PresignedUrl({
            key: testKey,
            contentType: testContentType,
            expiresIn: testExpiresIn,
        }, credentials);
        // Validate URL format
        const urlObj = new URL(url);
        if (!urlObj.searchParams.has("X-Amz-Signature")) {
            throw new Error("Generated URL missing signature");
        }
        return {
            success: true,
            url,
            debug: {
                canonicalRequest: "See generateR2PresignedUrl for details",
                stringToSign: "See generateR2PresignedUrl for details",
                signature: urlObj.searchParams.get("X-Amz-Signature") || "unknown",
            },
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
