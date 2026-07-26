import { notFound } from "next/navigation";

import { VocabularyWorkspace } from "@/components/vocabulary/vocabulary-workspace";

export default function VocabularyPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <VocabularyWorkspace
      boards={[
        { id: "51000000-0000-4000-8000-000000000001", name: "German" },
        { id: "51000000-0000-4000-8000-000000000002", name: "Italian" },
      ]}
      selectedBoard={{
        id: "51000000-0000-4000-8000-000000000001",
        name: "German",
      }}
      totals={[
        {
          id: "52000000-0000-4000-8000-000000000001",
          studyDate: "2026-01-06",
          wordsLearned: 1,
        },
        {
          id: "52000000-0000-4000-8000-000000000002",
          studyDate: "2026-02-12",
          wordsLearned: 3,
        },
        {
          id: "52000000-0000-4000-8000-000000000003",
          studyDate: "2026-03-18",
          wordsLearned: 7,
        },
        {
          id: "52000000-0000-4000-8000-000000000004",
          studyDate: "2026-04-22",
          wordsLearned: 12,
        },
        {
          id: "52000000-0000-4000-8000-000000000005",
          studyDate: "2026-05-14",
          wordsLearned: 17,
        },
        {
          id: "52000000-0000-4000-8000-000000000006",
          studyDate: "2026-06-09",
          wordsLearned: 28,
        },
        {
          id: "52000000-0000-4000-8000-000000000007",
          studyDate: "2026-07-23",
          wordsLearned: 42,
        },
        {
          id: "52000000-0000-4000-8000-000000000008",
          studyDate: "2026-07-24",
          wordsLearned: 8,
        },
        {
          id: "52000000-0000-4000-8000-000000000009",
          studyDate: "2026-07-25",
          wordsLearned: 15,
        },
        {
          id: "52000000-0000-4000-8000-000000000010",
          studyDate: "2026-07-26",
          wordsLearned: 18,
        },
        {
          id: "52000000-0000-4000-8000-000000000011",
          studyDate: "2026-08-03",
          wordsLearned: 40,
        },
      ]}
      selectedDate="2026-07-26"
      year={2026}
      todayKey="2026-07-26"
      reviewMode
    />
  );
}
