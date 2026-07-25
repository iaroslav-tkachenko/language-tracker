import {
  BookOpen,
  Clapperboard,
  Headphones,
  Layers3,
  MessagesSquare,
  PenLine,
  Shapes,
  SpellCheck2,
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
