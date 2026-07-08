---
name: OpenRouter free-model reliability
description: Behavior of OpenRouter's ":free" model tier under load and how to work around it
---

Some `:free`-suffixed OpenRouter models (e.g. `openai/gpt-oss-120b:free`, `meta-llama/llama-3.3-70b-instruct:free`, `qwen/qwen3-next-80b-a3b-instruct:free`) are shared across all OpenRouter users with no per-app quota, and can be persistently 429 rate-limited for extended periods — not just brief transient spikes. A single retry with backoff is often not enough.

Other free models in the same family are much less congested at any given time (observed: `openai/gpt-oss-20b:free`, `nvidia/nemotron-nano-9b-v2:free` were reliably available while the 120b/70b/qwen3-next ones were saturated).

**Why:** OpenRouter free tier has no dedicated capacity; popular/large flagship free models get hammered by the whole userbase and can be down for a while.

**How to apply:** When wiring an OpenRouter free-tier model for an app feature, define a small ordered list of candidate free models (mix of providers/sizes) and fall through the list on failure, rather than hard-coding one model with just a retry. Spot-check current availability with a quick test call before committing to a specific model id, since which ones are congested changes over time.
