export const CEFR_LEVELS = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"] as const;

export type CefrLevel = (typeof CEFR_LEVELS)[number];

export const CEFR_LEVEL_DETAILS: Record<
  CefrLevel,
  { name: string; description: string }
> = {
  A0: {
    name: "Absolute zero",
    description:
      "A0 is the absolute beginner stage before regular CEFR skills are in place. You are building the first sounds, letters, survival phrases, and confidence to recognize very simple language. At this stage, short daily practice and pronunciation habits matter more than complex explanations.",
  },
  A1: {
    name: "Beginner",
    description:
      "A1 is the beginner level for understanding and using very familiar everyday expressions. You can introduce yourself, ask simple questions, and handle basic needs when people speak slowly and clearly. Your main goal is to build a small practical vocabulary and simple sentence patterns.",
  },
  A2: {
    name: "Elementary",
    description:
      "A2 is the elementary level for communicating about routine, predictable situations. You can describe your background, daily life, shopping, travel, and immediate needs with simple language. Your main goal is to connect basic grammar with enough vocabulary to speak and understand more comfortably.",
  },
  B1: {
    name: "Intermediate",
    description:
      "B1 is the intermediate level for handling the main points of familiar work, study, travel, and leisure topics. You can produce connected speech, describe experiences, and explain opinions with some detail. Your main goal is to become consistent across listening, reading, and spontaneous speaking.",
  },
  B2: {
    name: "Upper-intermediate",
    description:
      "B2 is the upper-intermediate level for understanding the main ideas of complex texts and discussions. You can interact with enough fluency and spontaneity to communicate comfortably with proficient speakers. Your main goal is to expand range, precision, and confidence with authentic content.",
  },
  C1: {
    name: "Advanced",
    description:
      "C1 is the advanced level for understanding demanding texts, implicit meaning, and extended speech. You can express ideas fluently, flexibly, and effectively in social, academic, and professional situations. Your main goal is to refine nuance, style, accuracy, and topic breadth.",
  },
  C2: {
    name: "Proficient",
    description:
      "C2 is the proficient level for understanding almost everything heard or read with ease. You can summarize information from different sources and express yourself very fluently, precisely, and naturally. Your main goal is ongoing maintenance, specialization, and near-native control of tone and nuance.",
  },
};

export function isCefrLevel(value: unknown): value is CefrLevel {
  return (
    typeof value === "string" &&
    CEFR_LEVELS.includes(value as (typeof CEFR_LEVELS)[number])
  );
}
