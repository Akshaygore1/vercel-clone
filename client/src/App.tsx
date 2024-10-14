import React, { useState, useEffect, useRef, FormEvent } from "react";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import "./App.css";

interface LogEntry {
  type: "info" | "log" | "error";
  message: string;
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

  useEffect(() => {
    socketRef.current = io("http://localhost:3000");

    socketRef.current.on("connect", () => {
      console.log("Connected to WebSocket");
    });

    socketRef.current.on("log", (data: { message: string }) => {
      console.log("Received log:", data.message);
      setLogs((prevLogs) => [
        ...prevLogs,
        { type: "log", message: data.message },
      ]);
    });

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
          { type: "info", message: "Build process started successfully" },
        ]);
      }
    } catch (error) {
      console.error("Error:", error);
      setLogs((prevLogs) => [
        ...prevLogs,
        { type: "error", message: "Failed to start build process" },
      ]);
      setIsBuilding(false);
    }
  };

  return (
    <div className="container">
      <form onSubmit={handleSubmit}>
        <label htmlFor="github-url">GitHub URL</label>
        <input
          type="text"
          id="github-url"
          value={gitRepoUrl}
          onChange={(e) => setGitRepoUrl(e.target.value)}
        />
        <label htmlFor="project-id">Project ID</label>
        <input
          type="text"
          id="project-id"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        />
        <button type="submit" disabled={isBuilding}>
          {isBuilding ? "Building..." : "Submit"}
        </button>
      </form>

      {logs.length > 0 && (
        <div className="logs">
          <h3>Build Logs:</h3>
          {logs.map((log, index) => (
            <div key={index} className={`log-entry ${log.type}`}>
              {log.message}
            </div>
          ))}
        </div>
      )}

      {buildStatus && (
        <div className="build-result">
          <h3>Build Status:</h3>
          <p>Build ID: {buildStatus.buildId}</p>
          <p>Status: {buildStatus.status}</p>
          {buildStatus.statusCode !== undefined && (
            <p>Status Code: {buildStatus.statusCode}</p>
          )}
          {buildStatus.error && <p>Error: {buildStatus.error}</p>}
        </div>
      )}
    </div>
  );
}
