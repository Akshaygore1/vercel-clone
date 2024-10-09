import express, { json } from "express";
import Docker from "dockerode";
import winston from "winston";
import chalk from "chalk";
import boxen from "boxen";
import { format } from "date-fns";
import { streamLogs, validateRequest } from "./utils.js";

const app = express();
app.use(json());

const PORT = process.env.PORT || 3000;
const docker = new Docker();

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

app.post("/api/build", validateRequest, async (req, res) => {
  const buildId = Math.random().toString(36).substring(7);
  const { gitRepoUrl, projectId } = req.body;
  let projectName = projectId.toUpperCase();
  logger.info(`New build request received - Build ID: ${buildId}`);
  logger.info(`Repository: ${gitRepoUrl}`);
  logger.info(`Project ID: ${projectName}`);

  try {
    logger.info("Creating container...");
    const container = await docker.createContainer({
      Image: "build-server",
      Env: [`GIT_REPO_URL=${gitRepoUrl}`, `PROJECT_ID=${projectName}`],
      AttachStdout: true,
      AttachStderr: true,
      Tty: false,
      OpenStdin: false,
      StdinOnce: false,
    });

    logger.info("Starting container...");
    await container.start();

    const logs = await streamLogs(container, buildId);

    logger.info("Waiting for container to finish...");
    const data = await container.wait();

    logger.info("Removing container...");
    await container.remove();

    const success = data.StatusCode === 0;
    logger.info(
      `Build ${buildId} ${success ? "succeeded" : "failed"} with status code ${
        data.StatusCode
      }`
    );

    res.status(200).json({
      buildId,
      success,
      output: logs,
      statusCode: data.StatusCode,
    });
  } catch (error) {
    logger.error(`Build ${buildId} failed with error: ${error.message}`);
    res.status(500).json({
      error: "Failed to execute Docker container",
      details: error.message,
      buildId,
    });
  }
});

app.listen(PORT, () => {
  console.log(
    boxen(chalk.bold.green(`Server running on port ${PORT}`), {
      padding: 1,
      margin: 1,
      borderStyle: "double",
      borderColor: "green",
    })
  );
});
