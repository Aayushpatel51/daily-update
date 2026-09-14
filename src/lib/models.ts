import { z } from "zod";
export const topics = [
  {
    key: "ai",
    name: "AI",
    description: "Models, research and the ways we use them.",
  },
  {
    key: "coding",
    name: "Coding & Developer Tools",
    description: "Languages, frameworks and better ways to build.",
  },
  {
    key: "it-security",
    name: "Cybersecurity & IT",
    description: "Security, cloud and the systems behind our work.",
  },
  {
    key: "consumer-tech",
    name: "Consumer Technology",
    description: "Devices, apps and everyday technology.",
  },
  {
    key: "tech-business",
    name: "Tech Business",
    description: "The companies and decisions shaping technology.",
  },
] as const;
export const topicKeys = topics.map((t) => t.key);
export const topicSchema = z
  .array(
    z.enum(["ai", "coding", "it-security", "consumer-tech", "tech-business"]),
  )
  .min(1)
  .max(5)
  .transform((a) => [...new Set(a)]);
export const articleSchema = z.object({
  changed: z.string().max(16000).default(""),
  audience: z.string().max(4000).default(""),
  matters: z.string().max(6000).default(""),
  unknowns: z.string().max(6000).default(""),
});
export const evidenceSchema = z
  .array(
    z.object({
      url: z
        .url()
        .max(1000)
        .refine((s) => {
          const u = new URL(s);
          return u.protocol === "https:" && !u.username && !u.password;
        }, "Use an HTTPS source URL"),
      note: z.string().min(10).max(4000),
      publishedAt: z.string().max(80).default(""),
    }),
  )
  .min(1)
  .max(12);
export const storyInput = z.object({
  title: z.string().trim().min(8).max(180),
  topics: topicSchema,
  brief: z.string().max(1800).default(""),
  article: articleSchema,
  evidence: evidenceSchema,
  evidence_label: z
    .string()
    .trim()
    .min(3)
    .max(100)
    .default("Awaiting verification"),
  major: z.boolean().default(false),
  synthetic: z.boolean().default(false),
});
export type StoryInput = z.infer<typeof storyInput>;
export interface Story extends StoryInput {
  id: string;
  slug: string;
  state: string;
  revision: number;
  created_at: Date;
  updated_at: Date;
  released_at: Date | null;
  published_at: Date | null;
  correction: string;
  merged_into: string | null;
  source_key: string | null;
}
export interface Subscriber {
  id: string;
  email: string | null;
  email_state: string;
  chat_id: string | null;
  telegram_state: string;
  topics: string[];
  topic_since: Record<string, string>;
  timezone: string;
  major_only: boolean;
  quiet_start: string;
  quiet_end: string;
  created_at: Date;
  email_since: Date | null;
}
export interface Delivery {
  id: string;
  key: string;
  subscriber_id: string | null;
  story_id: string | null;
  digest_id: string | null;
  channel: string;
  purpose: string;
  payload: Record<string, unknown>;
  status: string;
  attempts: number;
  available_at: Date;
  provider_id: string | null;
  error: string | null;
  created_at: Date;
  finished_at: Date | null;
}
export const topicName = (key: string) =>
  topics.find((t) => t.key === key)?.name ?? key;
