import chalk from "chalk";
import boxen from "boxen";
import { format } from "date-fns";
export const formatDockerLog = (log) => {
  const cleanLog = log.replace(/\u001b\[.*?m/g, "");
  try {
    const parsed = JSON.parse(cleanLog);
    return chalk.cyan(JSON.stringify(parsed, null, 2));
  } catch {
    return cleanLog;
  }
};

export const createSection = (title) =>
  boxen(chalk.green.bold(title), {
    padding: 1,
    margin: 1,
    borderStyle: "round",
    borderColor: "green",
  });

export const validateRequest = (req, res, next) => {
  const { gitRepoUrl, projectId } = req.body;
  if (!gitRepoUrl || !projectId) {
    return res.status(400).json({
      error: "Missing required fields: gitRepoUrl and projectId are required",
    });
  }
  next();
};

export const streamLogs = async (container, buildId) => {
  const logStream = await container.attach({
    stream: true,
    stdout: true,
    stderr: true,
    follow: true,
  });

  console.log(createSection(`Build ${buildId} Started`));

  return new Promise((resolve, reject) => {
    let logs = "";

    const handleLogLine = (logLine) => {
      if (!logLine) return;
      logs += logLine + "\n";

      if (logLine.startsWith("===") || logLine.startsWith("---")) {
        console.log(chalk.yellow("\n" + "=".repeat(50)));
        console.log(chalk.yellow.bold(logLine));
        console.log(chalk.yellow("=".repeat(50)) + "\n");
      } else {
        const formattedTime = format(new Date(), "HH:mm:ss");
        console.log(
          `${chalk.gray(formattedTime)} ${chalk.blue("│")} ${formatDockerLog(
            logLine
          )}`
        );
      }
    };

    logStream.on("data", (chunk) =>
      handleLogLine(chunk.toString("utf8").trim())
    );
    logStream.on("error", (err) => reject(err));
    logStream.on("end", () => {
      console.log(createSection(`Build ${buildId} Completed`));
      resolve(logs);
    });
  });
};
