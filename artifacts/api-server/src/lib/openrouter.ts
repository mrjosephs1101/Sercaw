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

/** Text model that writes the Featherpilot AI overview from search results. */
export const OVERVIEW_MODEL = "openai/gpt-oss-120b:free";

/** Vision-capable model used to turn an uploaded image into a search query. */
export const VISION_MODEL = "nvidia/nemotron-nano-12b-v2-vl:free";
