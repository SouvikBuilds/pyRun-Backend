import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import codeRouter from "./routes/code.route.js";
import { handleError } from "./middleware/error.middleware.js";

const app = express();
app.use(
  cors({
    origin: process.env.ORIGIN || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    optionsSuccessStatus: 204,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.get("/", (req, res) => {
  res.send("<h1> Hello Souvik !! Welcome to NodeJS World </h1>");
});
app.use(handleError);
app.use("/api/v1/code", codeRouter);

export default app;
