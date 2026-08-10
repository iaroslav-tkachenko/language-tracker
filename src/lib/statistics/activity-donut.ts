export type ActivityDonutSource = {
  id: string;
  name: string;
  minutes: number;
  systemKey: string | null;
};

export type ActivityDonutRow = ActivityDonutSource & {
  items?: ActivityDonutSource[];
};

const OTHER_ID = "__other__";
const MAX_UNGROUPED_ACTIVITIES = 6;
const VISIBLE_ACTIVITIES_WITH_OTHER = 5;

function createOtherRow(items: ActivityDonutSource[]): ActivityDonutRow {
  return {
    id: OTHER_ID,
    name: "Other",
    minutes: items.reduce((total, item) => total + item.minutes, 0),
    systemKey: null,
    items,
  };
}

export function groupActivityDonutRows(
  sourceRows: ActivityDonutSource[],
): ActivityDonutRow[] {
  const rows = sourceRows
    .filter((row) => row.minutes > 0)
    .sort((left, right) => right.minutes - left.minutes);

  if (rows.length <= MAX_UNGROUPED_ACTIVITIES) return rows;

  return [
    ...rows.slice(0, VISIBLE_ACTIVITIES_WITH_OTHER),
    createOtherRow(rows.slice(VISIBLE_ACTIVITIES_WITH_OTHER)),
  ];
}
