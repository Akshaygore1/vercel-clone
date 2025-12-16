#!/usr/bin/env node

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");
const { createReadStream } = require("fs");

// Check required environment variables
const requiredEnvVars = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_ENDPOINT",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: ${envVar} environment variable is required`);
    process.exit(1);
  }
}

// Initialize S3 client for R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const bucketName = process.env.R2_BUCKET_NAME;
const basePath = process.env.R2_BASE_PATH || ""; // Optional base path prefix

// Get file/directory path from command line arguments
const targetPath = process.argv[2];

if (!targetPath) {
  console.error("Error: Please provide a file or directory path to upload");
  console.error("Usage: node upload-to-r2.js <file-or-directory-path>");
  process.exit(1);
}

if (!fs.existsSync(targetPath)) {
  console.error(`Error: Path does not exist: ${targetPath}`);
  process.exit(1);
}

// Get file stats
const stats = fs.statSync(targetPath);
const isDirectory = stats.isDirectory();

/**
 * Upload a single file to R2
 */
async function uploadFile(filePath, key) {
  const fileStream = createReadStream(filePath);
  const fileStats = fs.statSync(filePath);

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: fileStream,
    ContentLength: fileStats.size,
  });

  try {
    await s3Client.send(command);
    return { success: true, key, size: fileStats.size };
  } catch (error) {
    return { success: false, key, error: error.message };
  }
}

/**
 * Get all files recursively from a directory
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

/**
 * Get the S3 key (path) for a file
 */
function getS3Key(filePath, rootPath) {
  const relativePath = path.relative(rootPath, filePath);
  const normalizedPath = relativePath.split(path.sep).join("/");
  return basePath ? `${basePath}/${normalizedPath}` : normalizedPath;
}

/**
 * Main upload function
 */
async function main() {
  console.log("Starting upload to Cloudflare R2...");
  console.log(`Bucket: ${bucketName}`);
  console.log(`Target: ${targetPath}`);
  console.log(`Type: ${isDirectory ? "Directory" : "File"}\n`);

  const filesToUpload = isDirectory ? getAllFiles(targetPath) : [targetPath];

  console.log(`Found ${filesToUpload.length} file(s) to upload\n`);

  const results = [];
  let successCount = 0;
  let failCount = 0;
  let totalSize = 0;

  for (let i = 0; i < filesToUpload.length; i++) {
    const filePath = filesToUpload[i];
    const s3Key = getS3Key(
      filePath,
      isDirectory ? targetPath : path.dirname(targetPath)
    );

    process.stdout.write(
      `[${i + 1}/${filesToUpload.length}] Uploading ${s3Key}... `
    );

    const result = await uploadFile(filePath, s3Key);
    results.push(result);

    if (result.success) {
      successCount++;
      totalSize += result.size;
      const sizeKB = (result.size / 1024).toFixed(2);
      console.log(`✓ (${sizeKB} KB)`);
    } else {
      failCount++;
      console.log(`✗ Error: ${result.error}`);
    }
  }

  console.log("\n=== Upload Summary ===");
  console.log(`Total files: ${filesToUpload.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

  if (failCount > 0) {
    console.log("\nFailed uploads:");
    results
      .filter((r) => !r.success)
      .forEach((r) => console.log(`  - ${r.key}: ${r.error}`));
    process.exit(1);
  }

  console.log("\n✓ All files uploaded successfully!");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
