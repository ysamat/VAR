import { Router, Request, Response } from "express";
import { analyzeTyping } from "../services/typing-analysis";
import { synthesizeReview } from "../services/review-synthesis";
import { insertReview, updateAggregated } from "../services/database";
import { SubmitReviewRequest, AnalyzeTypingRequest } from "../types";

const router = Router();

/**
 * POST /api/reviews/analyze-typing
 *
 * Called on debounce while the user types their answer.
 * Returns whether the answer is sufficient and an optional
 * suggestion to expand on a specific point.
 *
 * Body: { partial_text, question, question_type }
 */
router.post("/analyze-typing", async (req: Request, res: Response) => {
  try {
    const { partial_text, question, question_type } = req.body as AnalyzeTypingRequest;

    if (!partial_text || !question) {
      return res.status(400).json({ error: "partial_text and question are required" });
    }

    const analysis = await analyzeTyping(
      partial_text,
      question,
      question_type ?? "gap"
    );

    return res.json(analysis);
  } catch (err: any) {
    console.error("Error analyzing typing:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/reviews/submit
 *
 * The main submission endpoint. Takes the user's answers to both questions,
 * synthesizes them into a comprehensive review, infers numerical ratings
 * from sentiment, inserts the review into the database, and updates
 * aggregated statistics.
 *
 * This completes the cycle: DB → insights → questions → answers → review → DB
 *
 * Body: {
 *   eg_property_id,
 *   gap_answer,
 *   verification_answer,
 *   gap_question,
 *   verification_question,
 *   verification_type
 * }
 */
router.post("/submit", async (req: Request, res: Response) => {
  try {
    const {
      eg_property_id,
      gap_answer,
      verification_answer,
      gap_question,
      verification_question,
      verification_type,
    } = req.body as SubmitReviewRequest;

    // Validate
    if (!eg_property_id || !gap_answer || !verification_answer) {
      return res.status(400).json({
        error: "eg_property_id, gap_answer, and verification_answer are required",
      });
    }

    // 1. Synthesize the two answers into a comprehensive review + inferred ratings
    const synthesized = await synthesizeReview(
      gap_question,
      gap_answer,
      verification_question,
      verification_answer,
      verification_type ?? "negative"
    );

    // 2. Insert the review into property_reviews
    const newReview = await insertReview(
      eg_property_id,
      synthesized.review_title,
      synthesized.review_body
    );

    // 3. Update properties_aggregated with inferred numerical ratings
    await updateAggregated(eg_property_id, synthesized.inferred_ratings);

    // Return the synthesized review and the DB record
    return res.json({
      review: newReview,
      synthesized,
      message: "Review submitted and aggregates updated. The cycle continues.",
    });
  } catch (err: any) {
    console.error("Error submitting review:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
