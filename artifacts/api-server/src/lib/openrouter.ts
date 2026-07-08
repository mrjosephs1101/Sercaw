import OpenAI from "openai";

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error(
    "OPENROUTER_API_KEY must be set. Did you forget to add your OpenRouter API key?",
  );
}

export const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

/** Text models that write the Featherpilot AI overview from search results, tried in order. */
export const OVERVIEW_MODELS = [
  "openai/gpt-oss-20b:free",
  "nvidia/nemotron-nano-9b-v2:free",
] as const;

/** Vision-capable model used to turn an uploaded image into a search query. */
export const VISION_MODEL = "nvidia/nemotron-nano-12b-v2-vl:free";
