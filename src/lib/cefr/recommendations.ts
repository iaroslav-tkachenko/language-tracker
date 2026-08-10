import type { CefrLevel } from "@/lib/cefr/reference";

export const CEFR_RECOMMENDATION_MODEL_VERSION = "cefr-weekly-plan-v1";
export const WEEKLY_PLAN_HOURS = 10;

export type RecommendationActivity =
  | "Vocabulary"
  | "Grammar"
  | "Shadowing"
  | "Conversation"
  | "Listening"
  | "Reading";

export type WeeklyRecommendationSegment = {
  activity: RecommendationActivity;
  percent: number;
};

export type WeeklyRecommendationAdvice = {
  title: string;
  body: string;
};

export type WeeklyRecommendation = {
  currentLevel: Exclude<CefrLevel, "C2">;
  targetLevel: CefrLevel;
  segments: WeeklyRecommendationSegment[];
  advice: WeeklyRecommendationAdvice[];
  modelVersion: typeof CEFR_RECOMMENDATION_MODEL_VERSION;
};

export const WEEKLY_RECOMMENDATIONS = [
  {
    currentLevel: "A0",
    targetLevel: "A1",
    modelVersion: CEFR_RECOMMENDATION_MODEL_VERSION,
    segments: [
      { activity: "Vocabulary", percent: 70 },
      { activity: "Grammar", percent: 15 },
      { activity: "Shadowing", percent: 15 },
    ],
    advice: [
      {
        title: "Start with useful phrases.",
        body: "Learn greetings, introductions, numbers, and short phrases you can use right away.",
      },
      {
        title: "Listen and repeat.",
        body: "Use short beginner audio and repeat each phrase aloud to get comfortable with the language's sounds.",
      },
      {
        title: "Build simple sentences.",
        body: "Practice a few common sentence patterns and replace one word at a time to create new meanings.",
      },
      {
        title: "Review a little every day.",
        body: "Save new words inside short example sentences and review them regularly with cards or another simple system.",
      },
    ],
  },
  {
    currentLevel: "A1",
    targetLevel: "A2",
    modelVersion: CEFR_RECOMMENDATION_MODEL_VERSION,
    segments: [
      { activity: "Vocabulary", percent: 65 },
      { activity: "Grammar", percent: 15 },
      { activity: "Shadowing", percent: 20 },
    ],
    advice: [
      {
        title: "Turn phrases into conversations.",
        body: "Practice short exchanges about your day, family, interests, shopping, and travel.",
      },
      {
        title: "Learn grammar through examples.",
        body: "Focus on the most common tenses and sentence patterns, then use them in your own examples.",
      },
      {
        title: "Keep listening and repeating.",
        body: "Use clear, level-appropriate audio and shadow short sections until they feel natural.",
      },
      {
        title: "Review words in context.",
        body: "Save useful words with a complete sentence so you remember how to use them, not only what they mean.",
      },
    ],
  },
  {
    currentLevel: "A2",
    targetLevel: "B1",
    modelVersion: CEFR_RECOMMENDATION_MODEL_VERSION,
    segments: [
      { activity: "Vocabulary", percent: 50 },
      { activity: "Conversation", percent: 10 },
      { activity: "Listening", percent: 40 },
    ],
    advice: [
      {
        title: "Start speaking regularly.",
        body: "Have short conversations with a tutor, language partner, AI, or simply speak aloud about your day.",
      },
      {
        title: "Listen for the main idea.",
        body: "Use level-appropriate podcasts and videos, and focus on understanding the message before every word.",
      },
      {
        title: "Connect your ideas.",
        body: "Practice telling short stories and explaining opinions with linking words such as because, although, and however.",
      },
    ],
  },
  {
    currentLevel: "B1",
    targetLevel: "B2",
    modelVersion: CEFR_RECOMMENDATION_MODEL_VERSION,
    segments: [
      { activity: "Vocabulary", percent: 20 },
      { activity: "Reading", percent: 20 },
      { activity: "Conversation", percent: 20 },
      { activity: "Listening", percent: 40 },
    ],
    advice: [
      {
        title: "Explain and defend your ideas.",
        body: "Discuss a wider range of topics and practice giving clear reasons, examples, and comparisons.",
      },
      {
        title: "Move toward authentic content.",
        body: "Watch, listen to, and read content made for native speakers, starting with subjects you already know well.",
      },
      {
        title: "Read longer texts.",
        body: "Build stamina with articles, accessible fiction, and other material that keeps you reading beyond short exercises.",
      },
      {
        title: "Learn vocabulary in context.",
        body: "Save useful expressions and word combinations from real content, then reuse them in speech and writing.",
      },
    ],
  },
  {
    currentLevel: "B2",
    targetLevel: "C1",
    modelVersion: CEFR_RECOMMENDATION_MODEL_VERSION,
    segments: [
      { activity: "Reading", percent: 20 },
      { activity: "Conversation", percent: 40 },
      { activity: "Listening", percent: 40 },
    ],
    advice: [
      {
        title: "Choose demanding content.",
        body: "Use long-form native content on unfamiliar or complex topics to expand your range and comprehension.",
      },
      {
        title: "Refine accuracy through feedback.",
        body: "Ask tutors, language partners, or writing tools to identify recurring mistakes and awkward phrasing.",
      },
      {
        title: "Develop professional range.",
        body: "Practice explaining ideas, presenting arguments, and writing clearly about topics that matter to your work or studies.",
      },
    ],
  },
  {
    currentLevel: "C1",
    targetLevel: "C2",
    modelVersion: CEFR_RECOMMENDATION_MODEL_VERSION,
    segments: [
      { activity: "Reading", percent: 20 },
      { activity: "Conversation", percent: 40 },
      { activity: "Listening", percent: 40 },
    ],
    advice: [
      {
        title: "Focus on nuance and tone.",
        body: "Compare how skilled speakers express the same idea in formal, casual, persuasive, and humorous situations.",
      },
      {
        title: "Polish precision.",
        body: "Notice small differences between similar words and expressions, then practice choosing the most natural one.",
      },
      {
        title: "Stay challenged.",
        body: "Use demanding books, lectures, debates, and specialist material to keep expanding your range.",
      },
    ],
  },
] as const satisfies readonly WeeklyRecommendation[];

export function getWeeklyRecommendation(level: CefrLevel) {
  return (
    WEEKLY_RECOMMENDATIONS.find(
      (recommendation) => recommendation.currentLevel === level,
    ) ?? null
  );
}

export function getWeeklyHours(percent: number) {
  return (WEEKLY_PLAN_HOURS * percent) / 100;
}
