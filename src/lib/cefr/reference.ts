export const CEFR_LEVELS = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"] as const;

export type CefrLevel = (typeof CEFR_LEVELS)[number];

export const CEFR_LEVEL_DETAILS: Record<
  CefrLevel,
  { name: string; description: string }
> = {
  A0: {
    name: "Absolute zero",
    description:
      "A0 is the starting point for complete beginners. You may recognize a few words, but you are still learning basic sounds, greetings, and useful everyday phrases. Short, regular practice will help you build confidence and a strong foundation.",
  },
  A1: {
    name: "Beginner",
    description:
      "You can understand and use familiar everyday phrases. You can introduce yourself, ask and answer simple questions, and handle basic needs when people speak slowly and clearly.",
  },
  A2: {
    name: "Elementary",
    description:
      "You can communicate in simple, routine situations. You can talk about daily life, family, shopping, travel, and other familiar topics using common words and sentence patterns.",
  },
  B1: {
    name: "Intermediate",
    description:
      "You can handle most everyday situations and understand the main points of clear content on familiar topics. You can describe experiences, explain plans, and give reasons for your opinions.",
  },
  B2: {
    name: "Upper-intermediate",
    description:
      "You can understand detailed content and discuss a wide range of topics. You can speak with growing fluency, explain your viewpoint, and communicate comfortably without relying on prepared phrases.",
  },
  C1: {
    name: "Advanced",
    description:
      "You can understand demanding content, including implied meaning, and express yourself fluently. You can adapt your language confidently for social, academic, and professional situations.",
  },
  C2: {
    name: "Proficient",
    description:
      "You can understand almost everything you hear or read and express precise ideas naturally. You can handle subtle meaning, complex topics, and different tones with ease.",
  },
};

export function isCefrLevel(value: unknown): value is CefrLevel {
  return (
    typeof value === "string" &&
    CEFR_LEVELS.includes(value as (typeof CEFR_LEVELS)[number])
  );
}
