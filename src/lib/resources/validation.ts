import { z } from "zod";

export const resourceIdSchema = z.string().uuid();

export const resourceNameSchema = z
  .string()
  .trim()
  .min(1, "Enter a name.")
  .max(50, "Use 50 characters or fewer.");

export const studyEntrySchema = z.object({
  boardId: z.string().uuid(),
  activityTypeId: z.string().uuid(),
  studyDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid study date."),
  durationMinutes: z.coerce
    .number()
    .int()
    .min(1, "Enter at least 1 minute.")
    .max(1440, "Enter no more than 1,440 minutes."),
});

export const studyEntryUpdateSchema = z.object({
  entryId: z.string().uuid(),
  activityTypeId: z.string().uuid(),
  durationMinutes: z.coerce
    .number()
    .int()
    .min(1, "Enter at least 1 minute.")
    .max(1440, "Enter no more than 1,440 minutes."),
});
