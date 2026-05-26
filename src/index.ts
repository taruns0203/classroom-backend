import express from "express";
import subjectsRouter from "./routes/subjects";
import cors from "cors";
import securityMiddleware from "./middleware/security";

const app = express();
const PORT = process.env.PORT || 8080;

if (!process.env.FRONTEND_URL) {
  console.warn(
    "FRONTEND_URL is not set. CORS will not be configured properly.",
  );
}

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

app.use(express.json());
app.use(securityMiddleware);
app.use("/api/subjects", subjectsRouter);

app.get("/", (req, res) => {
  res.send("Welcome to the Classroom API");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
