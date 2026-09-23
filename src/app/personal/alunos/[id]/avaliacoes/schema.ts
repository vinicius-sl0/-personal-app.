import { z } from "zod";

// Um valor lançado: número (maioria das métricas) ou texto (métricas do tipo texto).
export const valueItemSchema = z
  .object({
    metric_id: z.uuid(),
    value_numeric: z.number().finite().nullable(),
    value_text: z.string().trim().max(500).nullable(),
  })
  .refine((v) => v.value_numeric !== null || !!v.value_text, {
    message: "Valor vazio.",
  });

export const assessmentSchema = z.object({
  assessed_at: z.iso.date("Informe a data da avaliação."),
  protocol_id: z.uuid().nullable(),
  method: z.string().trim().max(100).nullable(),
  device: z.string().trim().max(100).nullable(),
  notes: z.string().trim().max(2000).nullable(),
  values: z.array(valueItemSchema).min(1, "Preencha ao menos uma medida.").max(200),
});

export type AssessmentInput = z.infer<typeof assessmentSchema>;
