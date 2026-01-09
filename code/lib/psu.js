"use strict";
/**
 * R2 Presigned URL Generator
 *
 * A lightweight, zero-dependency library for generating presigned URLs for Cloudflare R2 storage
 * using AWS Signature Version 4. Compatible with Cloudflare Workers and Node.js environments.
 *
 * @packageDocumentation
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
function generateR2PresignedUrl(options, credentials) {
    return __awaiter(this, void 0, void 0, function () {
        var key, contentType, expiresIn, _a, method, date, dateStamp, bucketName, canonicalUri, algorithm, credentialScope, credential, queryParams, sortedQueryParams, canonicalQueryString, canonicalHeaders, signedHeaders, payloadHash, canonicalRequest, stringToSign, _b, signature, url;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    key = options.key, contentType = options.contentType, expiresIn = options.expiresIn, _a = options.method, method = _a === void 0 ? "PUT" : _a;
                    // Validate inputs
                    if (!credentials.R2_ACCESS_KEY_ID ||
                        !credentials.R2_SECRET_ACCESS_KEY ||
                        !credentials.R2_ACCOUNT_ID) {
                        throw new Error("Missing required R2 credentials");
                    }
                    if (!key || !contentType || expiresIn <= 0 || expiresIn > 604800) {
                        throw new Error("Invalid parameters for presigned URL generation");
                    }
                    date = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
                    dateStamp = date.slice(0, 8);
                    bucketName = credentials.R2_BUCKET || "development";
                    canonicalUri = "/".concat(bucketName, "/").concat(key);
                    algorithm = "AWS4-HMAC-SHA256";
                    credentialScope = "".concat(dateStamp, "/auto/s3/aws4_request");
                    credential = "".concat(credentials.R2_ACCESS_KEY_ID, "/").concat(credentialScope);
                    queryParams = {
                        "X-Amz-Algorithm": algorithm,
                        "X-Amz-Credential": credential,
                        "X-Amz-Date": date,
                        "X-Amz-Expires": expiresIn.toString(),
                        "X-Amz-SignedHeaders": "content-type;host;x-amz-date",
                    };
                    sortedQueryParams = Object.keys(queryParams)
                        .sort()
                        .map(function (key) {
                        return "".concat(key, "=").concat(encodeURIComponent(queryParams[key]));
                    })
                        .join("&");
                    canonicalQueryString = sortedQueryParams;
                    canonicalHeaders = "content-type:".concat(contentType, "\nhost:").concat(credentials.R2_ACCOUNT_ID, ".r2.cloudflarestorage.com\nx-amz-date:").concat(date, "\n");
                    signedHeaders = "content-type;host;x-amz-date";
                    payloadHash = "UNSIGNED-PAYLOAD";
                    canonicalRequest = [
                        method,
                        canonicalUri,
                        canonicalQueryString,
                        canonicalHeaders,
                        signedHeaders,
                        payloadHash,
                    ].join("\n");
                    _b = [algorithm,
                        date,
                        credentialScope];
                    return [4 /*yield*/, sha256(canonicalRequest)];
                case 1:
                    stringToSign = _b.concat([
                        _c.sent()
                    ]).join("\n");
                    return [4 /*yield*/, getSignatureKey(credentials.R2_SECRET_ACCESS_KEY, dateStamp, "auto", "s3", stringToSign)];
                case 2:
                    signature = _c.sent();
                    url = "https://".concat(credentials.R2_ACCOUNT_ID, ".r2.cloudflarestorage.com/").concat(bucketName, "/").concat(key, "?").concat(canonicalQueryString, "&X-Amz-Signature=").concat(signature);
                    // Validate the generated URL
                    try {
                        new URL(url);
                    }
                    catch (error) {
                        throw new Error("Generated invalid URL: ".concat(error));
                    }
                    return [2 /*return*/, url];
            }
        });
    });
}
/**
 * Calculate SHA256 hash using Web Crypto API
 */
function sha256(message) {
    return __awaiter(this, void 0, void 0, function () {
        var msgBuffer, hashBuffer, hashArray, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    msgBuffer = new TextEncoder().encode(message);
                    return [4 /*yield*/, crypto.subtle.digest("SHA-256", msgBuffer)];
                case 1:
                    hashBuffer = _a.sent();
                    hashArray = Array.from(new Uint8Array(hashBuffer));
                    return [2 /*return*/, hashArray.map(function (b) { return b.toString(16).padStart(2, "0"); }).join("")];
                case 2:
                    error_1 = _a.sent();
                    throw new Error("SHA256 calculation failed: ".concat(error_1));
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Calculate HMAC-SHA256 using Web Crypto API
 */
function hmacSha256(key, message) {
    return __awaiter(this, void 0, void 0, function () {
        var cryptoKey, messageBuffer, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"])];
                case 1:
                    cryptoKey = _a.sent();
                    messageBuffer = new TextEncoder().encode(message);
                    return [4 /*yield*/, crypto.subtle.sign("HMAC", cryptoKey, messageBuffer)];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    error_2 = _a.sent();
                    throw new Error("HMAC-SHA256 calculation failed: ".concat(error_2));
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Generate AWS Signature Version 4 signing key
 */
function getSignatureKey(key, dateStamp, regionName, serviceName, stringToSign) {
    return __awaiter(this, void 0, void 0, function () {
        var kDate, kRegion, kService, kSigning, signature, signatureArray, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    return [4 /*yield*/, hmacSha256(new TextEncoder().encode("AWS4" + key).buffer, dateStamp)];
                case 1:
                    kDate = _a.sent();
                    return [4 /*yield*/, hmacSha256(kDate, regionName)];
                case 2:
                    kRegion = _a.sent();
                    return [4 /*yield*/, hmacSha256(kRegion, serviceName)];
                case 3:
                    kService = _a.sent();
                    return [4 /*yield*/, hmacSha256(kService, "aws4_request")];
                case 4:
                    kSigning = _a.sent();
                    return [4 /*yield*/, hmacSha256(kSigning, stringToSign)];
                case 5:
                    signature = _a.sent();
                    signatureArray = new Uint8Array(signature);
                    return [2 /*return*/, Array.from(signatureArray)
                            .map(function (b) { return b.toString(16).padStart(2, "0"); })
                            .join("")];
                case 6:
                    error_3 = _a.sent();
                    throw new Error("Signature key generation failed: ".concat(error_3));
                case 7: return [2 /*return*/];
            }
        });
    });
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
function testPresignedUrlGeneration(credentials) {
    return __awaiter(this, void 0, void 0, function () {
        var testKey, testContentType, testExpiresIn, url, urlObj, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    testKey = "test/upload.txt";
                    testContentType = "text/plain";
                    testExpiresIn = 3600;
                    return [4 /*yield*/, generateR2PresignedUrl({
                            key: testKey,
                            contentType: testContentType,
                            expiresIn: testExpiresIn,
                        }, credentials)];
                case 1:
                    url = _a.sent();
                    urlObj = new URL(url);
                    if (!urlObj.searchParams.has("X-Amz-Signature")) {
                        throw new Error("Generated URL missing signature");
                    }
                    return [2 /*return*/, {
                            success: true,
                            url: url,
                            debug: {
                                canonicalRequest: "See generateR2PresignedUrl for details",
                                stringToSign: "See generateR2PresignedUrl for details",
                                signature: urlObj.searchParams.get("X-Amz-Signature") || "unknown",
                            },
                        }];
                case 2:
                    error_4 = _a.sent();
                    return [2 /*return*/, {
                            success: false,
                            error: error_4 instanceof Error ? error_4.message : String(error_4),
                        }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
