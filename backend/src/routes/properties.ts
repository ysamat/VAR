import { Router, Request, Response } from "express";
import { getAggregated, getReviews } from "../services/database";
import { weightReviews } from "../services/halflife";
import { generateInsights } from "../services/insights";
import { generateQuestions } from "../services/questions";

const router = Router();

/**
 * GET /api/properties/:id/insights
 *
 * Returns half-life-weighted insights (pros, cons, details, summary)
 * for a property based on all its reviews and aggregated ratings.
 */
router.get("/:id/insights", async (req: Request, res: Response) => {
  try {
    const propertyId = req.params.id;

    const [aggregated, reviews] = await Promise.all([
      getAggregated(propertyId),
      getReviews(propertyId),
    ]);

    if (!aggregated) {
      return res.status(404).json({ error: "Property not found" });
    }

    const weighted = weightReviews(reviews);
    const insights = await generateInsights(aggregated, weighted);

    return res.json(insights);
  } catch (err: any) {
    console.error("Error generating insights:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/properties/:id/questions
 *
 * Generates 2 targeted questions for a guest who just stayed:
 * 1. A gap question (what info is missing)
 * 2. A verification question (confirm/deny a prior positive or negative review)
 */
router.get("/:id/questions", async (req: Request, res: Response) => {
  try {
    const propertyId = req.params.id;

    const [aggregated, reviews] = await Promise.all([
      getAggregated(propertyId),
      getReviews(propertyId),
    ]);

    if (!aggregated) {
      return res.status(404).json({ error: "Property not found" });
    }

    const weighted = weightReviews(reviews);
    const insights = await generateInsights(aggregated, weighted);
    const questions = await generateQuestions(insights, weighted);

    return res.json(questions);
  } catch (err: any) {
    console.error("Error generating questions:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/properties/:id/reviews
 *
 * Returns all reviews for a property with half-life weights attached.
 */
router.get("/:id/reviews", async (req: Request, res: Response) => {
  try {
    const propertyId = req.params.id;
    const reviews = await getReviews(propertyId);
    const weighted = weightReviews(reviews);
    return res.json(weighted);
  } catch (err: any) {
    console.error("Error fetching reviews:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
