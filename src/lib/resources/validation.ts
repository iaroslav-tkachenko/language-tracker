import { z } from "zod";

export const resourceIdSchema = z.string().uuid();

export const resourceNameSchema = z
  .string()
  .trim()
  .min(1, "Enter a name.")
  .max(50, "Use 50 characters or fewer.");

const dateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid study date.")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, "Choose a valid study date.");

function dateOrdinal(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

export function getInclusiveDateCount(startDate: string, endDate: string) {
  return dateOrdinal(endDate) - dateOrdinal(startDate) + 1;
}

export const studyEntrySchema = z.object({
  boardId: z.string().uuid(),
  activityTypeId: z.string().uuid(),
  studyDate: dateKeySchema,
  durationMinutes: z.coerce
    .number()
    .int()
    .min(1, "Enter at least 1 minute.")
    .max(1440, "Enter no more than 1,440 minutes."),
});

export const studyEntryBatchSchema = z
  .object({
    operationId: z.string().uuid(),
    boardId: z.string().uuid(),
    activityTypeId: z.string().uuid(),
    startDate: dateKeySchema,
    endDate: dateKeySchema,
    durationMinutes: z.coerce
      .number()
      .int()
      .min(1, "Enter at least 1 minute.")
      .max(1440, "Enter no more than 1,440 minutes."),
  })
  .superRefine(({ startDate, endDate }, context) => {
    if (startDate > endDate) {
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date must be on or after the start date.",
      });
      return;
    }

    if (startDate.slice(0, 4) !== endDate.slice(0, 4)) {
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "The date range must stay within one calendar year.",
      });
      return;
    }

    if (getInclusiveDateCount(startDate, endDate) > 366) {
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "The date range can contain at most 366 days.",
      });
    }
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
