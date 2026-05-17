import express, { Request, Response } from "express";

const app = express();
const PORT = 8000;

// Middleware to parse JSON bodies
app.use(express.json());

// Root route
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Welcome to the Express.js server!" });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
