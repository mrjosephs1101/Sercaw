---
name: Live web search from a Replit app backend
description: Why scraping search engines from a Replit server fails and what to use instead
---

Scraping public search engine HTML endpoints (DuckDuckGo `html.duckduckgo.com`/`lite.duckduckgo.com`, Startpage, Mojeek, etc.) from a Replit-hosted backend gets blocked — they return bot-detection/"anomaly" challenge pages or 403s, not real results, regardless of User-Agent spoofing. This is an IP-reputation block on Replit's egress ranges, not a code bug.

**Why:** These engines actively fingerprint and block cloud/datacenter IP ranges, which Replit's servers fall under.

**How to apply:** For any feature needing real, live web search results from server-side code (not the CodeExecution sandbox), don't attempt HTML scraping — go straight to a real search API with its own key (e.g. Serper.dev, Brave Search API). Request the key from the user via `requestSecrets` and call the API directly over HTTPS from the app backend.
