# OAuth app setup guides

Look up an app, or submit any app name or website, and an agent investigates what it takes to create a provider OAuth app and get it approved. Output is a shareable, evidence-tagged guide: difficulty, setup effort, approval wait, blockers, steps (agent vs. you), scopes, a provider message template, what was tested, and what is unknown.

## Run locally
1. `npm install`
2. `cp .env.example .env` and set `GEMINI_API_KEY`
3. `npm run dev`, open http://localhost:3000
4. Build the library: `npm run seed -- GitHub Slack Shopify "LinkedIn Ads" Workday`, then **read and correct each file in `data/library/`** before committing.

## Deploy (Vercel)
Import the repo, set `GEMINI_API_KEY`, and for persistent share links add a free Upstash Redis (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`). Live generation can take 1-4 minutes; the route sets `maxDuration = 300`, so use a plan that allows it.

## Key decisions
- One fixed guide format (spec/guide_schema.json) so guides are comparable and shareable.
- Every claim cites evidence tagged tested / official / community / inferred / unknown; unknowns are listed, never hidden.
- Setup effort and approval wait are separate fields; no invented wait times.
- The agent only makes public GET/HEAD probes. It never logs in or submits anything; those steps are marked "you".
- Output is schema-validated, with one repair attempt.

## Limitations
- No provider approvals were attempted; probes cannot see behind logins.
- Docs change; guides carry a generated date.
- The difficulty score is a transparent heuristic, not ground truth.
- Rate limiting is per server instance (best effort). Probe SSRF protection checks DNS before fetching and does not defend against DNS rebinding.
- See VERIFICATION.md (add yours) for what was checked against real sources.

## Model notes
Runs on the Gemini API (`@google/genai`). Set `GEMINI_MODEL` to a model your free key can use. Free-tier rate limits are low, so a live generation may pause and retry on 429 errors. Google Search runs in a separate call from function calling, so it works on any model that supports both. Free-tier prompts may be used by Google to improve its products, so only investigate public information.
