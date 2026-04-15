// ── Supabase row shapes ──

export interface RatingField {
  avg: number | null;
  count: number;
}

export interface PropertiesAggregated {
  eg_property_id: string;
  overall: RatingField;
  roomcleanliness: RatingField;
  service: RatingField;
  roomcomfort: RatingField;
  hotelcondition: RatingField;
  roomquality: RatingField;
  convenienceoflocation: RatingField;
  neighborhoodsatisfaction: RatingField;
  valueformoney: RatingField;
  roomamenitiesscore: RatingField;
  communication: RatingField;
  ecofriendliness: RatingField;
  checkin: RatingField;
  onlinelisting: RatingField;
  location: RatingField;
  review_dates: string[]; // ISO date strings
}

export const RATING_CATEGORIES = [
  "overall",
  "roomcleanliness",
  "service",
  "roomcomfort",
  "hotelcondition",
  "roomquality",
  "convenienceoflocation",
  "neighborhoodsatisfaction",
  "valueformoney",
  "roomamenitiesscore",
  "communication",
  "ecofriendliness",
  "checkin",
  "onlinelisting",
  "location",
] as const;

export type RatingCategory = (typeof RATING_CATEGORIES)[number];

export interface PropertyReview {
  id: number;
  eg_property_id: string;
  acquisition_date: string; // YYYY-MM-DD
  review_title: string | null;
  review_body: string | null;
}

// ── Half-life weighted review ──

export interface WeightedReview extends PropertyReview {
  weight: number; // 0..1 based on half-life decay
}

// ── Sentiment analysis ──

export interface SentimentResult {
  sentiment: "positive" | "negative" | "neutral";
  severity: number; // 0..1, how strongly positive or negative
  topics: SentimentTopic[];
}

export interface SentimentTopic {
  topic: string; // e.g. "pool", "breakfast", "staff"
  sentiment: "positive" | "negative" | "neutral";
  severity: number;
  excerpt: string; // relevant snippet from the review
}

// ── Insights ──

export interface PropertyInsights {
  eg_property_id: string;
  pros: string[];
  cons: string[];
  details: string[]; // useful booking info (e.g. "close to metro", "noisy at night")
  summary: string;
  rating_snapshot: Record<RatingCategory, RatingField>;
  generated_at: string;
}

// ── Gap analysis ──

export interface InformationGap {
  category: string;
  description: string; // what info is missing
  priority: number; // 0..1
}

// ── Question generation ──

export interface GeneratedQuestions {
  gap_question: {
    question: string;
    target_gap: string;
  };
  verification_question: {
    question: string;
    type: "positive" | "negative";
    source_topic: string;
    source_excerpt: string;
  };
}

// ── Typing analysis ──

export interface TypingAnalysis {
  sufficient: boolean;
  suggestion: string | null; // prompt to expand, or null if input is fine
}

// ── Review synthesis ──

export interface SynthesizedReview {
  review_title: string;
  review_body: string;
  inferred_ratings: Partial<Record<RatingCategory, number>>; // 1-10 scale
}

// ── API request/response shapes ──

export interface SubmitReviewRequest {
  eg_property_id: string;
  gap_answer: string;
  verification_answer: string;
  gap_question: string;
  verification_question: string;
  verification_type: "positive" | "negative";
}

export interface AnalyzeTypingRequest {
  partial_text: string;
  question: string;
  question_type: "gap" | "verification";
}
