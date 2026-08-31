// Supabase Edge Function: r2-presigned-url
// Deployed to Supabase Edge Functions environment
// Requires Environment Secrets:
// R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME

import { S3Client, PutObjectCommand, GetObjectCommand } from "npm:@aws-sdk/client-s3@^3.528.0";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner@^3.528.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const endpoint = (Deno.env.get("R2_ENDPOINT") || "").trim();
    const accessKeyId = (Deno.env.get("R2_ACCESS_KEY_ID") || "").trim();
    const secretAccessKey = (Deno.env.get("R2_SECRET_ACCESS_KEY") || "").trim();
    const bucketName = (Deno.env.get("R2_BUCKET_NAME") || "mineguard-files").trim();

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      return new Response(
        JSON.stringify({ error: "Storage credentials (R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY) are not configured on server." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let endpointUrl = endpoint.trim();
    if (!endpointUrl.startsWith("http://") && !endpointUrl.startsWith("https://")) {
      endpointUrl = `https://${endpointUrl}`;
    }

    const regionMatch = endpointUrl.match(/s3\.([a-z0-9-]+)\.backblazeb2\.com/i);
    const region = regionMatch ? regionMatch[1] : "us-east-1";

    const s3 = new S3Client({
      region,
      endpoint: endpointUrl,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const { action, objectKey, contentType } = await req.json();

    if (!objectKey) {
      return new Response(
        JSON.stringify({ error: "Missing required field: objectKey" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "upload" || action === "put") {
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        ContentType: contentType || "application/octet-stream",
      });

      const uploadUrl = await getSignedUrl(s3, putCommand, { expiresIn: 900 }); // 15 mins

      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
      });

      const downloadUrl = await getSignedUrl(s3, getCommand, { expiresIn: 3600 }); // 1 hour

      return new Response(
        JSON.stringify({
          uploadUrl,
          downloadUrl,
          fileUrl: downloadUrl,
          objectKey,
          bucket: bucketName,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action === "download" || action === "get") {
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
      });

      const downloadUrl = await getSignedUrl(s3, getCommand, { expiresIn: 3600 }); // 1 hour

      return new Response(
        JSON.stringify({
          downloadUrl,
          objectKey,
          bucket: bucketName,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Supported: upload, download" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
