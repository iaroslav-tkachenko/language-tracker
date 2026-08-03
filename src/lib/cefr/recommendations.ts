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
        title: "Build pronunciation early.",
        body: "Study phonetics and get used to accurate pronunciation from the start.",
      },
      {
        title: "Use beginner videos and shadowing.",
        body: "Watch level-appropriate YouTube videos and repeat after the speaker to build pronunciation habits.",
      },
      {
        title: "Learn basic sentence structure.",
        body: "Focus on word order, present-tense word changes, and especially common verb forms.",
      },
      {
        title: "Notice grammar without getting stuck.",
        body: "Learn to recognize cases and articles, but do not let them slow down daily practice.",
      },
      {
        title: "Learn full sentences.",
        body: "Study words inside useful sentences rather than memorizing isolated vocabulary.",
      },
      {
        title: "Use spaced repetition.",
        body: "Use Anki or a similar system, create cards for common present-tense verbs, and aim for at least 10 new cards per day.",
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
        title: "Keep practicing pronunciation.",
        body: "Watch level-appropriate YouTube videos and repeat after the speaker with shadowing.",
      },
      {
        title: "Learn the main verb tenses.",
        body: "Build a practical foundation in the grammar of the most common tenses.",
      },
      {
        title: "Learn language in context.",
        body: "Study complete sentences instead of isolated words.",
      },
      {
        title: "Use spaced repetition.",
        body: "Use Anki or a similar system to review material consistently.",
      },
      {
        title: "Create verb cards.",
        body: "Make cards for common verbs in different tense forms.",
      },
      {
        title: "Keep a daily target.",
        body: "Aim to add at least 10 new cards each day.",
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
        body: "Practice with native speakers, AI, or at least by speaking aloud to yourself.",
      },
      {
        title: "Increase listening volume.",
        body: "Add more level-appropriate podcasts and YouTube videos to your routine.",
      },
      {
        title: "Capture useful new words.",
        body: "Write down important vocabulary, turn it into cards, and review it consistently.",
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
        title: "Increase speaking practice.",
        body: "Talk more with native speakers, AI, or aloud to yourself on varied everyday topics.",
      },
      {
        title: "Move toward native content.",
        body: "Start with cartoons or series you already know well in your own language.",
      },
      {
        title: "Read approachable material.",
        body: "Try comics, accessible fiction, or news articles simplified with AI for your level.",
      },
      {
        title: "Keep reviewing vocabulary.",
        body: "Continue collecting useful new words, creating cards, and reviewing them consistently.",
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
        title: "Consume more native content.",
        body: "At this stage, progress depends heavily on the amount of real, non-adapted content you consume.",
      },
      {
        title: "Speak on varied topics.",
        body: "Talk as much as possible with native speakers about different subjects.",
      },
      {
        title: "Change your environment.",
        body: "Switch your devices, apps, and interfaces to the language you are learning.",
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
        title: "Consume more native content.",
        body: "At this stage, progress depends heavily on the amount of real, non-adapted content you consume.",
      },
      {
        title: "Speak on varied topics.",
        body: "Talk as much as possible with native speakers about different subjects.",
      },
      {
        title: "Change your environment.",
        body: "Switch your devices, apps, and interfaces to the language you are learning.",
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
