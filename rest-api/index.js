import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import Docker from "dockerode";
import winston from "winston";
import chalk from "chalk";
import boxen from "boxen";
import { format } from "date-fns";
import dotenv from "dotenv";
import cors from "cors";
import { validateRequest } from "./utils.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;
const docker = new Docker();

// Winston logger setup
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      const formattedTime = format(new Date(timestamp), "HH:mm:ss");
      const coloredLevel =
        {
          info: chalk.blue("INFO"),
          error: chalk.red("ERROR"),
          warn: chalk.yellow("WARN"),
        }[level] || level.toUpperCase();
      return `${chalk.gray(formattedTime)} ${coloredLevel} ${message}`;
    })
  ),
  transports: [new winston.transports.Console()],
});

// WebSocket connection handler
io.on("connection", (socket) => {
  logger.info(`New WebSocket connection: ${socket.id}`);

  socket.on("joinProject", (projectId) => {
    socket.join(projectId);
    logger.info(`Socket ${socket.id} joined project: ${projectId}`);
  });

  socket.on("disconnect", () => {
    logger.info(`WebSocket disconnected: ${socket.id}`);
  });
});

// Function to stream logs
const streamLogs = async (container, projectId) => {
  try {
    const logStream = await container.logs({
      follow: true,
      stdout: true,
      stderr: true,
    });

    logStream.on("data", (chunk) => {
      const logLine = chunk.toString("utf8").trim();
      if (logLine) {
        console.log(`Emitting log for project ${projectId}:`, logLine);
        io.to(projectId).emit("log", { message: logLine });
      }
    });

    return new Promise((resolve, reject) => {
      logStream.on("end", () => {
        console.log(`Log stream ended for project ${projectId}`);
        resolve();
      });
      logStream.on("error", (err) => {
        console.error(`Log stream error for project ${projectId}:`, err);
        reject(err);
      });
    });
  } catch (error) {
    console.error(
      `Error setting up log stream for project ${projectId}:`,
      error
    );
    throw error;
  }
};
// Docker build route
app.post("/api/build", validateRequest, async (req, res) => {
  const buildId = Math.random().toString(36).substring(7);
  const { gitRepoUrl, projectId } = req.body;
  const projectName = projectId.toUpperCase();

  logger.info(
    `New build request - ID: ${buildId}, Repo: ${gitRepoUrl}, Project: ${projectName}`
  );

  try {
    const requiredEnv = [
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET_NAME",
    ];
    const missingEnv = requiredEnv.filter((env) => !process.env[env]);
    if (missingEnv.length) {
      throw new Error(
        `Missing environment variables: ${missingEnv.join(", ")}`
      );
    }

    logger.info("Creating and starting Docker container...");
    const container = await docker.createContainer({
      Image: "akshaygore7798/build-server:latest",
      Env: [
        `GIT_REPO_URL=${gitRepoUrl}`,
        `PROJECT_ID=${projectName}`,
        ...requiredEnv.map((env) => `${env}=${process.env[env]}`),
      ],
      AttachStdout: true,
      AttachStderr: true,
      Tty: false,
    });

    await container.start();

    // Send initial status to WebSocket clients
    io.to(projectName).emit("buildStatus", { status: "started", buildId });

    // Stream logs
    await streamLogs(container, projectName);

    const { StatusCode } = await container.wait();
    await container.remove();

    const success = StatusCode === 0;
    logger.info(
      `Build ${buildId} ${
        success ? "succeeded" : "failed"
      } with status code ${StatusCode}`
    );

    // Send final status to WebSocket clients
    io.to(projectName).emit("buildStatus", {
      status: success ? "success" : "failed",
      buildId,
      statusCode: StatusCode,
    });

    res.status(200).json({ buildId, success, statusCode: StatusCode });
  } catch (error) {
    logger.error(`Build ${buildId} failed: ${error.message}`);

    // Send error status to WebSocket clients
    io.to(projectName).emit("buildStatus", {
      status: "error",
      buildId,
      error: error.message,
    });

    res.status(500).json({
      error: "Failed to execute Docker container",
      details: error.message,
      buildId,
    });
  }
});

// Start the server
httpServer.listen(PORT, () => {
  console.log(
    boxen(chalk.bold.green(`Server running on port ${PORT}`), {
      borderStyle: "double",
      borderColor: "green",
    })
  );
});
