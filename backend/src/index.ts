import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import propertiesRouter from "./routes/properties";
import reviewsRouter from "./routes/reviews";

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/properties", propertiesRouter);
app.use("/api/reviews", reviewsRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log(`
Endpoints:
  GET  /api/health
  GET  /api/properties/:id/insights    — half-life-weighted property insights
  GET  /api/properties/:id/questions   — generate 2 targeted review questions
  GET  /api/properties/:id/reviews     — all reviews with decay weights
  POST /api/reviews/analyze-typing     — real-time typing feedback
  POST /api/reviews/submit             — synthesize + store review, update aggregates
  `);
});

export default app;
