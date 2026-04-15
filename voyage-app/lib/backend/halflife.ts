import { PropertyReview, WeightedReview } from "./types";

// Half-life of 1 year (365.25 days in ms)
const HALF_LIFE_MS = 365.25 * 24 * 60 * 60 * 1000;

/**
 * Exponential decay weight based on review age.
 *   weight = 0.5 ^ (age / half_life)
 *
 * Today        → ~1.0
 * 1 year ago   → 0.5
 * 2 years ago  → 0.25
 */
export function computeWeight(reviewDate: string, now: Date = new Date()): number {
  const reviewTime = new Date(reviewDate).getTime();
  const ageMs = now.getTime() - reviewTime;
  if (ageMs <= 0) return 1;
  return Math.pow(0.5, ageMs / HALF_LIFE_MS);
}

export function weightReviews(reviews: PropertyReview[], now?: Date): WeightedReview[] {
  const ref = now ?? new Date();
  return reviews.map((r) => ({
    ...r,
    weight: computeWeight(r.acquisition_date, ref),
  }));
}

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
