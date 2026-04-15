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
  review_dates: string[];
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
  acquisition_date: string;
  review_title: string | null;
  review_body: string | null;
}

export interface WeightedReview extends PropertyReview {
  weight: number;
}

export interface SentimentResult {
  sentiment: "positive" | "negative" | "neutral";
  severity: number;
  topics: SentimentTopic[];
}

export interface SentimentTopic {
  topic: string;
  sentiment: "positive" | "negative" | "neutral";
  severity: number;
  excerpt: string;
}

export interface PropertyInsights {
  eg_property_id: string;
  pros: string[];
  cons: string[];
  details: string[];
  summary: string;
  rating_snapshot: Record<RatingCategory, RatingField>;
  generated_at: string;
}

export interface InformationGap {
  category: string;
  description: string;
  priority: number;
}

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

export interface TypingAnalysis {
  sufficient: boolean;
  suggestion: string | null;
}

export interface SynthesizedReview {
  review_title: string;
  review_body: string;
  inferred_ratings: Partial<Record<RatingCategory, number>>;
}
