"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import type { FormEvent } from "react";

import {
  archiveActivityType,
  archiveLanguageBoard,
} from "@/app/dashboard/actions";
import { ActivityIcon } from "@/components/activities/activity-icon";

type BoardItem = { id: string; name: string };
type ActivityItem = { id: string; name: string; systemKey: string | null };

function confirmSubmission(message: string) {
  return (event: FormEvent<HTMLFormElement>) => {
    if (!window.confirm(message)) event.preventDefault();
  };
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
    <ul className="space-y-2">
      {boards.map((board) => (
        <li
          key={board.id}
          className="flex min-h-12 items-center gap-2 rounded-xl bg-slate-50 p-1"
        >
          <Link
            href={`/dashboard?board=${board.id}`}
            className="flex min-h-10 min-w-0 flex-1 items-center rounded-lg px-3 font-medium text-slate-800 hover:bg-blue-50 hover:text-blue-700"
          >
            {board.name}
          </Link>
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
              className="flex size-10 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 aria-hidden="true" className="size-4.5" />
            </button>
          </form>
        </li>
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
    <ul className="flex flex-wrap gap-2">
      {activities.map((activity) => (
        <li
          key={activity.id}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pr-1 pl-3 text-sm font-medium text-slate-700"
        >
          <ActivityIcon
            systemKey={activity.systemKey}
            aria-hidden="true"
            className="size-4 text-slate-500"
          />
          {activity.name}
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
              className="flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 aria-hidden="true" className="size-4" />
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
