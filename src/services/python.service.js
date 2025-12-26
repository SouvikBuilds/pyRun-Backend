import fs from "fs";
import crypto from "crypto";
import path from "path";
import { exec, spawn } from "child_process";

import { ApiError } from "../utils/ApiError.js";

const RUNTIME_DIR = path.resolve("runtime/python");

const ensureRuntimeDir = () => {
  if (!fs.existsSync(RUNTIME_DIR)) {
    fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  }
};

const createTempFile = (code) => {
  ensureRuntimeDir();
  const fileName = crypto.randomUUID() + ".py";
  const filePath = path.join(RUNTIME_DIR, fileName);
  fs.writeFileSync(filePath, code);
  return filePath;
};

const cleanupFile = (filePath) => {
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

// 🔹 RUN PYTHON CODE (with optional input)
export const runPython = (code, input = "") => {
  return new Promise((resolve, reject) => {
    const filePath = createTempFile(code);

    const pythonProcess = spawn("python3", [filePath], {
      cwd: RUNTIME_DIR,
      env: { PATH: process.env.PATH },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = "";
    let stderr = "";
    let isResolved = false;

    const timeout = setTimeout(() => {
      if (!isResolved) {
        pythonProcess.kill();
        cleanupFile(filePath);
        isResolved = true;
        reject(new ApiError(408, "Time Limit Exceeded"));
      }
    }, 5000);

    pythonProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    pythonProcess.on("close", (code) => {
      clearTimeout(timeout);
      cleanupFile(filePath);
      
      if (isResolved) return;
      isResolved = true;

      if (stderr) {
        return reject(new ApiError(400, stderr.trim()));
      }

      if (code !== 0) {
        return reject(new ApiError(500, "Execution failed"));
      }

      resolve(stdout);
    });

    // Handle stdin properly
    if (input && input.trim()) {
      pythonProcess.stdin.write(input);
    }
    pythonProcess.stdin.end();
  });
};

// 🔹 SYNTAX CHECK
export const checkPythonSyntax = (code) => {
  return new Promise((resolve, reject) => {
    const filePath = createTempFile(code);

    exec(
      `python3 -m py_compile "${filePath}"`,
      {
        cwd: RUNTIME_DIR,
        env: { PATH: process.env.PATH },
      },
      (error, _stdout, stderr) => {
        cleanupFile(filePath);

        if (error) {
          return reject(new ApiError(400, stderr.trim()));
        }

        resolve("No syntax errors found");
      }
    );
  });
};
