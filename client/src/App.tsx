import { useState, useEffect, useRef, FormEvent } from "react";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import "./App.css";

interface LogEntry {
  type: "info" | "log" | "error";
  message: string;
  projectId: string;
}

interface BuildStatus {
  status: "started" | "success" | "failed" | "error";
  buildId: string;
  statusCode?: number;
  error?: string;
}

export default function App() {
  const [gitRepoUrl, setGitRepoUrl] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [buildStatus, setBuildStatus] = useState<BuildStatus | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socketRef.current = io("http://localhost:3000");

    socketRef.current.on("connect", () => {
      console.log("Connected to WebSocket");
    });

    socketRef.current.on(
      "log",
      (data: { message: string; projectId: string }) => {
        console.log(
          `Received log for project ${data.projectId}:`,
          data.message
        );
        setLogs((prevLogs) => [
          ...prevLogs,
          { type: "log", message: data.message, projectId: data.projectId },
        ]);
      }
    );

    socketRef.current.on("buildStatus", (status: BuildStatus) => {
      console.log("Received build status:", status);
      setBuildStatus(status);
      if (status.status !== "started") {
        setIsBuilding(false);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLogs([]);
    setBuildStatus(null);
    setIsBuilding(true);

    if (socketRef.current) {
      console.log("Joining project room:", projectId);
      socketRef.current.emit("joinProject", projectId);
    }

    try {
      console.log("Sending build request");
      const res = await axios.post("http://localhost:3000/api/build", {
        gitRepoUrl,
        projectId,
      });
      console.log("Build request response:", res.data);
      if (res.status === 200) {
        setLogs((prevLogs) => [
          ...prevLogs,
          {
            type: "info",
            message: "Build process started successfully",
            projectId,
          },
        ]);
        setIsBuilding(false);
      }
    } catch (error) {
      console.error("Error:", error);
      setLogs((prevLogs) => [
        ...prevLogs,
        { type: "error", message: "Failed to start build process", projectId },
      ]);
      setIsBuilding(false);
    }
  };

  return (
    <div className="app">
      <div className="particles">
        {[...Array(50)].map((_, i) => (
          <div key={i} className="particle"></div>
        ))}
      </div>
      <div className="container">
        <h1 className="title">Vercel Clone</h1>
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="github-url">GitHub URL</label>
            <input
              type="text"
              id="github-url"
              value={gitRepoUrl}
              onChange={(e) => setGitRepoUrl(e.target.value)}
              placeholder="https://github.com/user/repo"
            />
          </div>
          <div className="form-group">
            <label htmlFor="project-id">Project ID</label>
            <input
              type="text"
              id="project-id"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value.toUpperCase())}
              placeholder="MY-PROJECT"
            />
          </div>
          <button type="submit" disabled={isBuilding} className="submit-button">
            {isBuilding ? "Building..." : "Deploy"}
          </button>
        </form>

        {logs.length > 0 && (
          <div className="logs-container">
            <h3 className="logs-title">Build Logs:</h3>
            <div className="logs">
              {logs.map((log, index) => (
                <div key={index} className={`log-entry ${log.type}`}>
                  <span className="log-project">[{log.projectId}]</span>{" "}
                  <span className="log-message">{log.message}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}

        {buildStatus && (
          <div className={`build-status ${buildStatus.status}`}>
            <div className="status-indicator"></div>
            <p className="status-text">{buildStatus.status}</p>
          </div>
        )}

        {buildStatus && buildStatus.status === "success" && (
          <a
            href={`http://${projectId}.localhost:8000`}
            className="view-project"
            target="_blank"
            rel="noopener noreferrer"
          >
            View Project
          </a>
        )}
      </div>
    </div>
  );
}
