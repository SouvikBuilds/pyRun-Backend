import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import { runPython, checkPythonSyntax } from "../services/python.service.js";

const runCode = asyncHandler(async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || code.trim() === "") {
      throw new ApiError(400, "Code is required");
    }
    const result = await runPython(code);
    return res
      .status(200)
      .json(new ApiResponse(200, result, "Code executed successfully"));
  } catch (error) {
    throw new ApiError(500, error?.message || "Something went wrong");
  }
});

const checkErrors = asyncHandler(async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || code.trim() === "") {
      throw new ApiError(400, "Code is required");
    }
    const result = await checkPythonSyntax(code);
    return res
      .status(200)
      .json(new ApiResponse(200, result, "Code executed successfully"));
  } catch (error) {
    throw new ApiError(500, error?.message || "Something went wrong");
  }
});
export { runCode, checkErrors };
