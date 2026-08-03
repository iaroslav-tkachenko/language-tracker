"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  cefrLevelEventCreateSchema,
  cefrLevelEventUpdateSchema,
  resourceIdSchema,
  resourceNameSchema,
  studyEntryBatchSchema,
  studyEntrySchema,
  studyEntryUpdateSchema,
  vocabularyDailyTotalSchema,
  vocabularyTotalBatchSchema,
} from "@/lib/resources/validation";
import { createClient } from "@/lib/supabase/server";

export type ResourceActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  resourceId?: string;
  resourceName?: string;
  insertedCount?: number;
  preservedCount?: number;
};

function cefrMutationMessage(error: { code?: string; message: string }) {
  if (error.code === "23505") {
    return "A level update already exists for this date.";
  }

  if (error.code === "23514") {
    return error.message;
  }

  if (error.code === "P0002") {
    return "The level update could not be found.";
  }

  console.error("Supabase CEFR level mutation failed", {
    code: error.code,
    message: error.message,
  });
  return "The level update could not be saved. Please try again.";
}

function parseName(formData: FormData) {
  return resourceNameSchema.safeParse(formData.get("name"));
}

function providerMessage(
  resource: "board" | "activity",
  error: { code?: string; message: string },
) {
  if (error.code === "23505") {
    return `An active ${resource} with this name already exists.`;
  }

  if (error.code === "23514" && error.message.includes("limit")) {
    return resource === "board"
      ? "You can have at most 6 active language boards."
      : "You can have at most 30 active activities.";
  }

  console.error(`Supabase ${resource} mutation failed`, {
    code: error.code,
    message: error.message,
  });
  return `The ${resource} could not be saved. Please try again.`;
}

async function verifiedClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) return null;
  return supabase;
}

export async function createFirstLanguageBoard(
  _state: ResourceActionState,
  formData: FormData,
): Promise<ResourceActionState> {
  const parsed = parseName(formData);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }

  const supabase = await verifiedClient();
  if (!supabase) return { status: "error", message: "Please sign in again." };

  const { data, error } = await supabase.rpc(
    "create_or_restore_language_board",
    { p_name: parsed.data },
  );

  if (error) {
    return { status: "error", message: providerMessage("board", error) };
  }

  revalidatePath("/dashboard");
  redirect(`/dashboard?board=${data.id}`);
}

export async function createLanguageBoard(
  _state: ResourceActionState,
  formData: FormData,
): Promise<ResourceActionState> {
  const parsed = parseName(formData);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }

  const supabase = await verifiedClient();
  if (!supabase) return { status: "error", message: "Please sign in again." };

  const { error } = await supabase.rpc("create_or_restore_language_board", {
    p_name: parsed.data,
  });

  if (error) {
    return { status: "error", message: providerMessage("board", error) };
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return { status: "success", message: `${parsed.data} is ready.` };
}

export async function createActivityType(
  _state: ResourceActionState,
  formData: FormData,
): Promise<ResourceActionState> {
  const parsed = parseName(formData);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }

  const supabase = await verifiedClient();
  if (!supabase) return { status: "error", message: "Please sign in again." };

  const { data, error } = await supabase.rpc(
    "create_or_restore_activity_type",
    {
      p_name: parsed.data,
    },
  );

  if (error) {
    return { status: "error", message: providerMessage("activity", error) };
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return {
    status: "success",
    message: `${parsed.data} is available.`,
    resourceId: data.id,
    resourceName: data.name,
  };
}

export async function createStudyEntry(
  _state: ResourceActionState,
  formData: FormData,
): Promise<ResourceActionState> {
  const parsed = studyEntrySchema.safeParse({
    boardId: formData.get("boardId"),
    activityTypeId: formData.get("activityTypeId"),
    studyDate: formData.get("studyDate"),
    durationMinutes: formData.get("durationMinutes"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) {
    return { status: "error", message: "Please sign in again." };
  }

  const { error } = await supabase.from("study_entries").insert({
    user_id: userId,
    board_id: parsed.data.boardId,
    activity_type_id: parsed.data.activityTypeId,
    study_date: parsed.data.studyDate,
    duration_minutes: parsed.data.durationMinutes,
  });

  if (error) {
    console.error("Supabase study entry creation failed", {
      code: error.code,
      message: error.message,
    });
    return {
      status: "error",
      message: "The study session could not be saved. Please try again.",
    };
  }

  revalidatePath("/dashboard");
  return { status: "success", message: "Study session saved." };
}

export async function createStudyEntryBatch(
  _state: ResourceActionState,
  formData: FormData,
): Promise<ResourceActionState> {
  const parsed = studyEntryBatchSchema.safeParse({
    operationId: formData.get("operationId"),
    boardId: formData.get("boardId"),
    activityTypeId: formData.get("activityTypeId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    durationMinutes: formData.get("durationMinutes"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }

  const supabase = await verifiedClient();
  if (!supabase) return { status: "error", message: "Please sign in again." };

  const { error } = await supabase.rpc("create_study_entry_batch", {
    p_operation_id: parsed.data.operationId,
    p_board_id: parsed.data.boardId,
    p_activity_type_id: parsed.data.activityTypeId,
    p_start_date: parsed.data.startDate,
    p_end_date: parsed.data.endDate,
    p_duration_minutes: parsed.data.durationMinutes,
  });

  if (error) {
    console.error("Supabase study entry batch creation failed", {
      code: error.code,
      message: error.message,
    });
    return {
      status: "error",
      message:
        error.code === "23514"
          ? error.message
          : "The date-range sessions could not be saved. Please try again.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/statistics");
  return { status: "success", message: "Date-range sessions saved." };
}

export async function updateStudyEntry(
  _state: ResourceActionState,
  formData: FormData,
): Promise<ResourceActionState> {
  const parsed = studyEntryUpdateSchema.safeParse({
    entryId: formData.get("entryId"),
    activityTypeId: formData.get("activityTypeId"),
    durationMinutes: formData.get("durationMinutes"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }

  const supabase = await verifiedClient();
  if (!supabase) return { status: "error", message: "Please sign in again." };

  const { data, error } = await supabase
    .from("study_entries")
    .update({
      activity_type_id: parsed.data.activityTypeId,
      duration_minutes: parsed.data.durationMinutes,
    })
    .eq("id", parsed.data.entryId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error("Supabase study entry update failed", {
        code: error.code,
        message: error.message,
      });
    }
    return {
      status: "error",
      message: "The study session could not be updated. Please try again.",
    };
  }

  revalidatePath("/dashboard");
  return { status: "success", message: "Study session updated." };
}

export async function deleteStudyEntry(formData: FormData) {
  const parsed = resourceIdSchema.safeParse(formData.get("entryId"));
  if (!parsed.success) throw new Error("Invalid study session.");

  const supabase = await verifiedClient();
  if (!supabase) redirect("/sign-in");

  const { data, error } = await supabase
    .from("study_entries")
    .delete()
    .eq("id", parsed.data)
    .select("id")
    .maybeSingle();

  if (error || !data)
    throw new Error("The study session could not be deleted.");
  revalidatePath("/dashboard");
}

export async function saveVocabularyDailyTotal(
  _state: ResourceActionState,
  formData: FormData,
): Promise<ResourceActionState> {
  const parsed = vocabularyDailyTotalSchema.safeParse({
    boardId: formData.get("boardId"),
    studyDate: formData.get("studyDate"),
    wordsLearned: formData.get("wordsLearned"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }

  const supabase = await verifiedClient();
  if (!supabase) return { status: "error", message: "Please sign in again." };

  const { error } = await supabase.rpc("upsert_vocabulary_daily_total", {
    p_board_id: parsed.data.boardId,
    p_study_date: parsed.data.studyDate,
    p_words_learned: parsed.data.wordsLearned,
  });

  if (error) {
    console.error("Supabase vocabulary total save failed", {
      code: error.code,
      message: error.message,
    });
    return {
      status: "error",
      message: "The vocabulary total could not be saved. Please try again.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/statistics");
  return { status: "success", message: "Vocabulary total saved." };
}

export async function createVocabularyTotalBatch(
  _state: ResourceActionState,
  formData: FormData,
): Promise<ResourceActionState> {
  const parsed = vocabularyTotalBatchSchema.safeParse({
    operationId: formData.get("operationId"),
    boardId: formData.get("boardId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    wordsLearned: formData.get("wordsLearned"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }

  const supabase = await verifiedClient();
  if (!supabase) return { status: "error", message: "Please sign in again." };

  const { data, error } = await supabase.rpc("create_vocabulary_total_batch", {
    p_operation_id: parsed.data.operationId,
    p_board_id: parsed.data.boardId,
    p_start_date: parsed.data.startDate,
    p_end_date: parsed.data.endDate,
    p_words_learned: parsed.data.wordsLearned,
  });

  if (error) {
    console.error("Supabase vocabulary batch creation failed", {
      code: error.code,
      message: error.message,
    });
    return {
      status: "error",
      message:
        error.code === "23514"
          ? error.message
          : "The vocabulary date range could not be saved. Please try again.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/statistics");
  return {
    status: "success",
    message: "Vocabulary date range saved.",
    insertedCount: data.inserted_count,
    preservedCount: data.preserved_count,
  };
}

export async function deleteVocabularyDailyTotal(formData: FormData) {
  const parsed = resourceIdSchema.safeParse(formData.get("vocabularyTotalId"));
  if (!parsed.success) throw new Error("Invalid vocabulary total.");

  const supabase = await verifiedClient();
  if (!supabase) redirect("/sign-in");

  const { data, error } = await supabase
    .from("vocabulary_daily_totals")
    .delete()
    .eq("id", parsed.data)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    throw new Error("The vocabulary total could not be deleted.");
  }
  revalidatePath("/dashboard");
  revalidatePath("/statistics");
}

export async function createCefrLevelEvent(
  _state: ResourceActionState,
  formData: FormData,
): Promise<ResourceActionState> {
  const parsed = cefrLevelEventCreateSchema.safeParse({
    boardId: formData.get("boardId"),
    level: formData.get("level"),
    effectiveDate: formData.get("effectiveDate"),
    localToday: formData.get("localToday"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }

  const supabase = await verifiedClient();
  if (!supabase) return { status: "error", message: "Please sign in again." };

  const { error } = await supabase.rpc("create_cefr_level_event", {
    p_board_id: parsed.data.boardId,
    p_level: parsed.data.level,
    p_effective_date: parsed.data.effectiveDate,
    p_local_today: parsed.data.localToday,
  });

  if (error) {
    return { status: "error", message: cefrMutationMessage(error) };
  }

  revalidatePath("/dashboard");
  revalidatePath("/statistics");
  return { status: "success", message: "Level update saved." };
}

export async function updateCefrLevelEvent(
  _state: ResourceActionState,
  formData: FormData,
): Promise<ResourceActionState> {
  const parsed = cefrLevelEventUpdateSchema.safeParse({
    eventId: formData.get("eventId"),
    level: formData.get("level"),
    effectiveDate: formData.get("effectiveDate"),
    localToday: formData.get("localToday"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }

  const supabase = await verifiedClient();
  if (!supabase) return { status: "error", message: "Please sign in again." };

  const { error } = await supabase.rpc("update_cefr_level_event", {
    p_event_id: parsed.data.eventId,
    p_level: parsed.data.level,
    p_effective_date: parsed.data.effectiveDate,
    p_local_today: parsed.data.localToday,
  });

  if (error) {
    return { status: "error", message: cefrMutationMessage(error) };
  }

  revalidatePath("/dashboard");
  revalidatePath("/statistics");
  return { status: "success", message: "Level update saved." };
}

export async function deleteCefrLevelEvent(formData: FormData) {
  const parsed = resourceIdSchema.safeParse(formData.get("eventId"));
  if (!parsed.success) throw new Error("Invalid level update.");

  const supabase = await verifiedClient();
  if (!supabase) redirect("/sign-in");

  const { error } = await supabase.rpc("delete_cefr_level_event", {
    p_event_id: parsed.data,
  });

  if (error) {
    throw new Error(cefrMutationMessage(error));
  }

  revalidatePath("/dashboard");
  revalidatePath("/statistics");
}

export async function archiveLanguageBoard(formData: FormData) {
  const parsed = resourceIdSchema.safeParse(formData.get("boardId"));
  if (!parsed.success) throw new Error("Invalid language board.");

  const supabase = await verifiedClient();
  if (!supabase) redirect("/sign-in");

  const { data, error } = await supabase
    .from("language_boards")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", parsed.data)
    .select("id")
    .maybeSingle();

  if (error || !data)
    throw new Error("The language board could not be removed.");
  revalidatePath("/dashboard");
  revalidatePath("/settings");
}

export async function archiveActivityType(formData: FormData) {
  const parsed = resourceIdSchema.safeParse(formData.get("activityTypeId"));
  if (!parsed.success) throw new Error("Invalid activity.");

  const supabase = await verifiedClient();
  if (!supabase) redirect("/sign-in");

  const { data, error } = await supabase
    .from("activity_types")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", parsed.data)
    .select("id")
    .maybeSingle();

  if (error || !data) throw new Error("The activity could not be removed.");
  revalidatePath("/dashboard");
  revalidatePath("/settings");
}
