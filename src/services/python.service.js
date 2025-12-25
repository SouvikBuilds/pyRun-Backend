import fs from "fs";
import crypto from "crypto";
import path from "path";
import { exec } from "child_process";

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

export const runPython = (code) => {
  return new Promise((resolve, reject) => {
    const filePath = createTempFile(code);

    exec(
      `python3 "${filePath}"`,
      {
        cwd: RUNTIME_DIR,
        timeout: 3000,
        maxBuffer: 1024 * 100,
        env: { PATH: process.env.PATH },
      },
      (error, stdout, stderr) => {
        cleanupFile(filePath);

        if (error && error.killed) {
          return reject(new ApiError(408, "Time Limit Exceeded"));
        }

        if (error && error.message?.includes("maxBuffer")) {
          return reject(
            new ApiError(
              408,
              "Output limit exceeded. Program terminated to prevent infinite execution."
            )
          );
        }

        if (stderr) {
          return reject(new ApiError(400, stderr));
        }
        if (error) {
          return reject(new ApiError(500, error.message || "Execution failed"));
        }

        resolve(stdout);
      }
    );
  });
};

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
