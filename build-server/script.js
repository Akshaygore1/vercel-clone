const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

// R2 configuration
const R2_ACCOUNT_ID = "";
const R2_ACCESS_KEY_ID = "";
const R2_SECRET_ACCESS_KEY = "";
const R2_BUCKET_NAME = "vercel-clone";

// Initialize S3 client for R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const projectId = process.env.PROJECT_ID;

// Function to execute build command and return a promise
function executeBuild(outDirPath) {
  return new Promise((resolve, reject) => {
    console.log(`Starting build process in directory: ${outDirPath}`);

    // First, ensure the directory exists and we're in it
    if (!fs.existsSync(outDirPath)) {
      console.error(`Output directory ${outDirPath} does not exist`);
      return reject(new Error(`Output directory ${outDirPath} does not exist`));
    }

    let buildOutput = "";
    let errorOutput = "";

    // Execute commands one by one
    const installProcess = exec("npm install", { cwd: outDirPath });

    installProcess.stdout.on("data", (data) => {
      console.log(`[npm install] stdout: ${data}`);
      buildOutput += data;
    });

    installProcess.stderr.on("data", (data) => {
      console.error(`[npm install] stderr: ${data}`);
      errorOutput += data;
    });

    installProcess.on("error", (error) => {
      console.error("[npm install] Error:", error);
      reject(error);
    });

    installProcess.on("close", (code) => {
      if (code !== 0) {
        console.error(`[npm install] process exited with code ${code}`);
        reject(
          new Error(`npm install failed with code ${code}\n${errorOutput}`)
        );
        return;
      }

      console.log("[npm install] completed successfully, starting build...");

      // Now run the build command
      const buildProcess = exec("npm run build", { cwd: outDirPath });

      buildProcess.stdout.on("data", (data) => {
        console.log(`[npm run build] stdout: ${data}`);
        buildOutput += data;
      });

      buildProcess.stderr.on("data", (data) => {
        console.error(`[npm run build] stderr: ${data}`);
        errorOutput += data;
      });

      buildProcess.on("error", (error) => {
        console.error("[npm run build] Error:", error);
        reject(error);
      });

      buildProcess.on("close", (buildCode) => {
        if (buildCode !== 0) {
          console.error(
            `[npm run build] process exited with code ${buildCode}`
          );
          reject(
            new Error(`Build failed with code ${buildCode}\n${errorOutput}`)
          );
          return;
        }

        // Add a small delay to ensure file system operations are complete
        setTimeout(() => {
          const distPath = path.join(outDirPath, "dist");
          if (!fs.existsSync(distPath)) {
            reject(
              new Error(
                `Build completed but dist folder not found at ${distPath}`
              )
            );
            return;
          }
          console.log("[npm run build] completed successfully");
          resolve();
        }, 1000);
      });
    });
  });
}

// Function to upload a single file to R2
async function uploadFileToR2(filePath, projectId, bucketKey) {
  try {
    const projectName = projectId.toLowerCase();
    const fileContent = fs.readFileSync(filePath);
    const fullBucketKey = `${projectName}/${bucketKey}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fullBucketKey,
      Body: fileContent,
      ContentType: getContentType(filePath),
    });

    await s3Client.send(command);
    console.log(`Successfully uploaded ${filePath} to R2 as ${bucketKey}`);
  } catch (error) {
    console.error(`Error uploading ${filePath}:`, error);
    throw error;
  }
}

// Helper function to determine content type
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
  };
  return contentTypes[ext] || "application/octet-stream";
}

// Function to upload all files from dist folder
async function uploadDistFolder(distFolderPath) {
  try {
    if (!fs.existsSync(distFolderPath)) {
      throw new Error(`Dist folder not found at ${distFolderPath}`);
    }

    const distFolderContent = fs.readdirSync(distFolderPath, {
      recursive: true,
    });

    if (distFolderContent.length === 0) {
      throw new Error("Dist folder is empty");
    }

    for (const file of distFolderContent) {
      const filePath = path.join(distFolderPath, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        console.log(`Skipping directory: ${file}`);
        continue;
      }

      console.log(`Uploading file: ${file}`);
      const bucketKey = path.relative(distFolderPath, filePath);
      await uploadFileToR2(filePath, projectId, bucketKey);
    }
  } catch (error) {
    console.error("Error uploading dist folder:", error);
    throw error;
  }
}

async function init() {
  try {
    const outDirPath = path.join(__dirname, "output");

    await executeBuild(outDirPath);

    const distFolderPath = path.join(outDirPath, "dist");

    console.log("Deploy started");
    await uploadDistFolder(distFolderPath);
    console.log("Build and deploy completed successfully");
  } catch (error) {
    console.error("Build and deploy failed:", error);
    process.exit(1);
  }
}

init();
