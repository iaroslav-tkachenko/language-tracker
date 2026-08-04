import {
  BookOpen,
  Clapperboard,
  Headphones,
  Layers3,
  MessagesSquare,
  PenLine,
  Repeat2,
  Shapes,
  SpellCheck2,
  Youtube,
  type LucideProps,
} from "lucide-react";

const activityIcons = {
  reading: BookOpen,
  podcast: Headphones,
  speaking: MessagesSquare,
  writing: PenLine,
  anki: Layers3,
  grammar: SpellCheck2,
  tv_show_film: Clapperboard,
  youtube: Youtube,
  shadowing: Repeat2,
};

type ActivityIconProps = LucideProps & {
  systemKey: string | null;
};

export function ActivityIcon({ systemKey, ...iconProps }: ActivityIconProps) {
  const Icon = systemKey
    ? (activityIcons[systemKey as keyof typeof activityIcons] ?? Shapes)
    : Shapes;
  return <Icon {...iconProps} />;
}
