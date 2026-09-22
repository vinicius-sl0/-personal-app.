import { z } from "zod";

const techniqueEnum = z.enum(["normal", "dropset", "biset", "restpause"]);

// Um exercício dentro de um treino (Treino A, B, C...).
export const exerciseItemSchema = z
  .object({
    exercise_id: z.uuid(),
    sets: z.coerce.number().int().min(1).max(50),
    reps_min: z.coerce.number().int().min(1).max(1000).nullable(),
    reps_max: z.coerce.number().int().min(1).max(1000).nullable(),
    reps_text: z.string().trim().max(60).nullable(),
    target_load_kg: z.coerce.number().min(0).max(999).nullable(),
    rest_seconds: z.coerce.number().int().min(0).max(3600).nullable(),
    technique: techniqueEnum,
    technique_detail: z.string().trim().max(300).nullable(),
    notes: z.string().trim().max(500).nullable(),
  })
  .refine((v) => v.reps_min === null || v.reps_max === null || v.reps_max >= v.reps_min, {
    message: "A repetição máxima precisa ser maior ou igual à mínima.",
    path: ["reps_max"],
  })
  .refine((v) => v.technique === "normal" || !!v.technique_detail, {
    message: "Explique como aplicar a técnica escolhida (ex.: as cargas do drop set).",
    path: ["technique_detail"],
  });

// Um treino (ex.: "Treino A") com sua lista de exercícios.
export const workoutSchema = z.object({
  name: z.string().trim().min(1, "Dê um nome ao treino (ex.: Treino A).").max(100),
  notes: z.string().trim().max(1000).nullable(),
  exercises: z.array(exerciseItemSchema).min(1, "Adicione ao menos um exercício."),
});

// A ficha inteira (um ou mais treinos).
export const planSchema = z.object({
  name: z.string().trim().min(2, "Dê um nome à ficha.").max(150),
  objective: z.string().trim().max(300).nullable(),
  workouts: z.array(workoutSchema).min(1, "Adicione ao menos um treino."),
});

export type PlanInput = z.infer<typeof planSchema>;
export type WorkoutInput = z.infer<typeof workoutSchema>;
export type ExerciseItemInput = z.infer<typeof exerciseItemSchema>;
