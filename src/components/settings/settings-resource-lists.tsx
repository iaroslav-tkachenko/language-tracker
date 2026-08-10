"use client";

import { Check, Pencil, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useActionState, useState, type FormEvent } from "react";

import {
  archiveActivityType,
  archiveLanguageBoard,
  renameActivityType,
  renameLanguageBoard,
  type ResourceActionState,
} from "@/app/dashboard/actions";
import { ActivityIcon } from "@/components/activities/activity-icon";

type BoardItem = { id: string; name: string };
type ActivityItem = { id: string; name: string; systemKey: string | null };
const initialActionState: ResourceActionState = { status: "idle" };

function confirmSubmission(message: string) {
  return (event: FormEvent<HTMLFormElement>) => {
    if (!window.confirm(message)) event.preventDefault();
  };
}

function BoardSettingsItem({ board }: { board: BoardItem }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(
    renameLanguageBoard,
    initialActionState,
  );

  const isEditing = editing && state.status !== "success";

  return (
    <li className="rounded-lg bg-slate-50 p-0.5">
      {isEditing ? (
        <form action={formAction} className="flex items-center gap-1">
          <input type="hidden" name="boardId" value={board.id} />
          <input
            name="name"
            required
            maxLength={50}
            autoComplete="off"
            defaultValue={board.name}
            aria-label="Language name"
            className="min-h-8 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-950"
          />
          <button
            type="submit"
            disabled={pending}
            aria-label={`Save ${board.name}`}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-emerald-700 hover:bg-emerald-50 disabled:cursor-wait"
          >
            <Check aria-hidden="true" className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            aria-label="Cancel rename"
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </form>
      ) : (
        <div className="flex min-h-8 items-center gap-1">
          <Link
            href={`/dashboard?board=${board.id}`}
            className="flex min-h-8 min-w-0 flex-1 items-center rounded-md px-2 text-sm font-medium text-slate-800 hover:bg-blue-50 hover:text-blue-700"
          >
            {board.name}
          </Link>
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label={`Rename ${board.name}`}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          >
            <Pencil aria-hidden="true" className="size-3.5" />
          </button>
          <form
            action={archiveLanguageBoard}
            onSubmit={confirmSubmission(
              `Remove ${board.name}? Its study history will be hidden but preserved.`,
            )}
          >
            <input type="hidden" name="boardId" value={board.id} />
            <button
              type="submit"
              aria-label={`Remove ${board.name}`}
              className="flex size-8 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 aria-hidden="true" className="size-3.5" />
            </button>
          </form>
        </div>
      )}
      {state.message && isEditing && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className="px-2 py-1 text-xs text-red-700"
        >
          {state.message}
        </p>
      )}
    </li>
  );
}

export function BoardSettingsList({ boards }: { boards: BoardItem[] }) {
  if (boards.length === 0) {
    return (
      <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
        No language boards yet.
      </p>
    );
  }

  return (
    <ul className="space-y-1">
      {boards.map((board) => (
        <BoardSettingsItem key={board.id} board={board} />
      ))}
    </ul>
  );
}

export function ActivitySettingsList({
  activities,
}: {
  activities: ActivityItem[];
}) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {activities.map((activity) => (
        <ActivitySettingsItem key={activity.id} activity={activity} />
      ))}
    </ul>
  );
}

function ActivitySettingsItem({ activity }: { activity: ActivityItem }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(
    renameActivityType,
    initialActionState,
  );
  const isCustom = activity.systemKey === null;
  const isEditing = isCustom && editing && state.status !== "success";

  if (isEditing) {
    return (
      <li className="rounded-lg border border-slate-200 bg-slate-50 p-0.5">
        <form action={formAction} className="flex items-center gap-1">
          <input type="hidden" name="activityTypeId" value={activity.id} />
          <input
            name="name"
            required
            maxLength={50}
            autoComplete="off"
            defaultValue={activity.name}
            aria-label="Activity name"
            className="min-h-7 w-32 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-950"
          />
          <button
            type="submit"
            disabled={pending}
            aria-label={`Save ${activity.name}`}
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-emerald-700 hover:bg-emerald-50 disabled:cursor-wait"
          >
            <Check aria-hidden="true" className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            aria-label="Cancel rename"
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200"
          >
            <X aria-hidden="true" className="size-3.5" />
          </button>
        </form>
        {state.message && (
          <p
            role={state.status === "error" ? "alert" : "status"}
            className="max-w-52 px-2 py-1 text-xs text-red-700"
          >
            {state.message}
          </p>
        )}
      </li>
    );
  }

  return (
    <li className="inline-flex items-center gap-0.5 text-xs font-medium text-slate-700">
      <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5">
        <ActivityIcon
          systemKey={activity.systemKey}
          aria-hidden="true"
          className="size-3.5 text-slate-500"
        />
        <span className="max-w-40 truncate">{activity.name}</span>
      </span>
      {isCustom && (
        <>
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label={`Rename ${activity.name}`}
            className="flex size-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          >
            <Pencil aria-hidden="true" className="size-3.5" />
          </button>
          <form
            action={archiveActivityType}
            onSubmit={confirmSubmission(
              `Remove ${activity.name}? Existing study sessions will keep their history.`,
            )}
          >
            <input type="hidden" name="activityTypeId" value={activity.id} />
            <button
              type="submit"
              aria-label={`Remove ${activity.name}`}
              className="flex size-7 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 aria-hidden="true" className="size-3.5" />
            </button>
          </form>
        </>
      )}
    </li>
  );
}
