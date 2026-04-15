import { PropertyReview, WeightedReview } from "../types";

// Half-life of 1 year (365.25 days in ms)
const HALF_LIFE_MS = 365.25 * 24 * 60 * 60 * 1000;

/**
 * Exponential decay weight based on review age.
 *   weight = 0.5 ^ (age / half_life)
 *
 * A review from today      → weight ≈ 1.0
 * A review from 1 year ago → weight = 0.5
 * A review from 2 years ago → weight = 0.25
 */
export function computeWeight(reviewDate: string, now: Date = new Date()): number {
  const reviewTime = new Date(reviewDate).getTime();
  const ageMs = now.getTime() - reviewTime;
  if (ageMs <= 0) return 1;
  return Math.pow(0.5, ageMs / HALF_LIFE_MS);
}

/**
 * Attach half-life weights to a list of reviews.
 */
export function weightReviews(reviews: PropertyReview[], now?: Date): WeightedReview[] {
  const ref = now ?? new Date();
  return reviews.map((r) => ({
    ...r,
    weight: computeWeight(r.acquisition_date, ref),
  }));
}

/**
 * Compute a weighted average for a numeric array with corresponding weights.
 * Returns null if no valid entries.
 */
export function weightedAverage(values: number[], weights: number[]): number | null {
  let sumWeighted = 0;
  let sumWeights = 0;
  for (let i = 0; i < values.length; i++) {
    if (values[i] != null && weights[i] != null) {
      sumWeighted += values[i] * weights[i];
      sumWeights += weights[i];
    }
  }
  return sumWeights > 0 ? sumWeighted / sumWeights : null;
}
