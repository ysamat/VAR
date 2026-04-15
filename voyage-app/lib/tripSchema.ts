import { z } from "zod";

export const latLngPlaceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const stopCameraSchema = z
  .object({
    zoom: z.number().optional(),
    pitch: z.number().optional(),
    bearing: z.number().optional(),
    durationMs: z.number().int().positive().optional(),
  })
  .strict()
  .optional();

export const tripStopSchema = z.object({
  id: z.string().min(1, "Stop id is required"),
  name: z.string().min(1, "Stop name is required"),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  type: z.string().min(1, "Stop type is required"),
  questions: z
    .array(z.string().min(1, "Question cannot be empty"))
    .min(1, "Each stop must have at least 1 question")
    .max(3, "Each stop can have at most 3 questions"),
  camera: stopCameraSchema,
  // Optional: maps this stop to a Supabase property for AI-powered reviews.
  // When set, the backend generates targeted questions and submits reviews.
  eg_property_id: z.string().optional(),
});

export const tripConfigSchema = z
  .object({
    flight: z.object({
      origin: latLngPlaceSchema,
      destination: latLngPlaceSchema,
    }),
    stops: z.array(tripStopSchema).min(1, "Add at least one stop"),
  })
  .superRefine((data, ctx) => {
    const ids = data.stops.map((s) => s.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: "custom",
        message: "Each stop must have a unique id",
        path: ["stops"],
      });
    }
  });

export type TripConfig = z.infer<typeof tripConfigSchema>;
export type TripStopConfig = z.infer<typeof tripStopSchema>;
