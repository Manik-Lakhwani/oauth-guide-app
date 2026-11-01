# Verification of sampled guidance

**Date checked:** 2 November 2026. **Guides checked:** all five library guides (GitHub, Slack, Shopify, Workday, LinkedIn Ads), 39 claims in total.

## Method

1. From each guide I picked 7 to 9 claims, favouring the kinds an agent is most likely to overstate: approval waits, whether a scope triggers review, required account types, "tested" results, and effort estimates.
2. Two kinds of check:
   - **External:** I searched for the provider's own documentation (or, where the official page was not retrievable, documentation from vendors that integrate with it) and compared it with the claim.
   - **Internal:** I checked whether the guide's own evidence actually supports the claim it is attached to (right source, right evidence tag, test result matches what was observed).
3. Results: **Confirmed** (source supports the claim), **Corrected** (claim wrong, overstated, or missing a material caveat), **Could not verify** (no source found, or it needs a login I do not have).

**Limits of this check.** I could not re-run the agent's probes: some providers block automated fetches (Slack's authorize endpoint returned a robots.txt refusal). Workday's official docs are behind a login, so for Workday and some Shopify points I relied on third-party integration docs (Nango, Alteryx, Unified.to, Workato). Those are weaker than official sources and are marked as such. This is a sample; provider docs change.

## Results

### GitHub (easy)

| # | Claim in the guide | Check | Result | Finding | Fix |
|---|---|---|---|---|---|
| G1 | No approval gate; blockers list is empty | External | **Corrected** | GitHub's docs say that when an organization application policy is active, only an organization owner can authorize an OAuth app for that organization. Registration is self-serve, but using the app on org data can need owner approval. | Add blocker "Organization owner approval may be required" (slows you down). |
| G2 | (omitted) GitHub Apps vs OAuth apps | External | **Corrected** | GitHub states that GitHub Apps are generally preferred: fine-grained permissions, short-lived tokens, rate limits that scale. OAuth apps use scopes and the user's 5,000 requests/hour. A developer choosing GitHub needs to see this decision. | Add a note and a "which to use" line at the top. |
| G3 | "Free to create up to 100 OAuth apps" (cited to E1) | External | **Could not verify** | E1 does not state it and my search did not find the limit. | Remove the number or move it to unknowns. |
| G4 | Setup effort "10-15 minutes", basis `official` | Internal | **Corrected** | No evidence is attached and no source gives a duration. | Basis to `inferred`. |
| G5 | `repo` scope recommended for common use | External | **Corrected** (judgement) | GitHub confirms OAuth apps need `repo` to reach issues, pull requests, or anything repository-owned, so it is broad access. Recommending it by default contradicts least privilege. | Set `recommended_for_common_use` to false and describe it as broad. |
| G6 | T2: fake-client authorize probe `confirmed_docs` (302 to login) | Internal | **Corrected** | A redirect to the login page happens whatever the client id is, so the probe confirms nothing about documented behaviour. | Result to `inconclusive`. |
| G7 | Confidence "high", no blockers, no unknowns | Internal | **Corrected** | G1 to G3 show real caveats were missed. | Confidence to `medium`. |

### Slack (moderate)

| # | Claim | Check | Result | Finding | Fix |
|---|---|---|---|---|---|
| S1 | (omitted) limits on apps outside the Marketplace | External | **Corrected** | Slack's changelog says apps not approved for the Marketplace get much lower limits on `conversations.history` and `conversations.replies`: 1 request per minute and a maximum of 15 objects per request (new apps from 29 May 2025; later applied to existing unlisted installs). Material for agents that read channel history. | Add as a blocker (slows you down) and a scope note. |
| S2 | Review duration for the public directory is unknown | External | **Could not verify** | I found no published turnaround. Consistent with the guide's own unknown. | None. |
| S3 | (omitted) Marketplace entry requirement | External | **Corrected** | Slack's changelog describes a minimum number of active-workspace installs before Marketplace submission (10, later reduced to 5; I did not confirm the current number). | Add to blockers; mark the number unverified. |
| S4 | Approval wait basis `official`, cited to E2 | Internal | **Corrected** | E2 only says login is required. | Basis to `unknown`/`inferred`. |
| S5 | Setup effort "30-45 minutes", basis `community`, no evidence | Internal | **Corrected** | Breaks the guide's own rule that community claims need a link. | Basis to `inferred`. |
| S6 | E3 `tested`: authorize endpoint "accepts" client_id and scope (200 OK, fake client id) | Internal | **Could not verify** | A 200 for a fake id cannot show parameters were accepted; it may be an error page rendered with 200. I could not re-run it (robots.txt refusal). | Downgrade to `inferred`; reword. |
| S7 | `channels:read` evidence is E3 (the authorize probe) | Internal | **Corrected** | Wrong source for a scope claim. | Cite the scopes reference. |
| S8 | "Login required" is a `blocking` blocker | Internal | **Corrected** | It is a precondition, not an obstacle. | Severity to `minor`. |

### Shopify (moderate)

| # | Claim | Check | Result | Finding | Fix |
|---|---|---|---|---|---|
| H1 | "All app development requires a Partner account" (blocking) | External | **Corrected** | A Shopify staff reply in the developer community distinguishes custom apps created from a Partner account and from a merchant account. Partner accounts are needed for apps distributed to other merchants; third-party docs (Workato) say the same. | Reword: Partner account needed to distribute; merchants can create custom apps for their own store. |
| H2 | `write_orders` triggers no extra review | External | **Corrected** | Shopify's docs say apps get only the last 60 days of orders by default, `read_all_orders` must be requested in the Partner Dashboard, and protected customer data is not returned from non-development stores until the app is approved. Orders contain customer data. | Mark order scopes `yes`; add `read_all_orders` and a protected-customer-data blocker. |
| H3 | Approval wait "None for private apps; variable for App Store" (official, E1) | External | **Could not verify** | E1 is the docs landing page. I found no official App Store review time. Workato's docs report two to four weeks for `read_all_orders` approval (third-party only). | Basis to `unknown` for App Store; note the scope-approval estimate as community. |
| H4 | Type `self_serve` | Internal | **Corrected** | Public apps need formal review. The guide's own rule says to pick the harder type. | Type to `review_gated`, with a note on the self-serve stage. |
| H5 | Setup effort "60-120 minutes", basis `official` | Internal | **Corrected** | No source states it. | Basis to `inferred`. |
| H6 | One evidence entry (E1) supports most claims | Internal | **Corrected** | A landing page cannot support scope, review, and wait claims. | Re-run with separate sources; until then lower confidence. |
| H7 | Agent "confirmed Shopify uses OAuth 2.0" | Internal | **Could not verify** | Test T1 only shows the docs page loads. | Reword the `agent_did` line. |

### Workday (gated)

| # | Claim | Check | Result | Finding | Fix |
|---|---|---|---|---|---|
| W1 | OAuth apps are built in the Developer Console / App Hub / Orchestrate | External | **Corrected** (material) | Third-party integration docs (Nango, Alteryx) and Unified.to's notes (which quote Workday's own documentation) show each customer's tenant administrator registers an API client with the "Register API Client" task, producing a client id and secret. The guide describes the integration-app lifecycle, not OAuth client registration. | Rewrite steps around tenant admin registration. |
| W2 | Scopes list is empty; scope names unknown | External | **Corrected** | Nango's Workday docs say scopes are functional areas (for example Human Resources, Staffing, System) and that the account also needs matching domain security policies. | Populate scopes; keep exact names as unverified. |
| W3 | Registration "requires a Workday Developer account" | External | **Corrected** | For OAuth, the gate described by every source is administrator access in a tenant, not a developer account. | Replace the step. |
| W4 | Approval wait "Unknown" | External | **Corrected** | There appears to be no provider approval. The wait is the customer's administrator and security setup. | Reframe as "depends on the customer's admin". |
| W5 | Setup effort "multiple days", basis `official` | Internal | **Corrected** | E3 describes release levels and gives no duration. | Basis to `inferred`. |
| W6 | Review factor scored 2 from release promotion levels | Internal | **Corrected** | Promotion between Implementation, Sandbox and Production is not an approval by Workday. | Rescore. |
| W7 | E2 URL contains the literal text "HYPHEN" | Internal | **Could not verify** | The URL looks malformed and I could not retrieve it. | Check or drop E2. |
| W8 | Confidence "high" with unknown scopes | Internal | **Corrected** | W1 to W3 show the central steps were off. | Confidence to `low`. |

### LinkedIn Ads (hard)

| # | Claim | Check | Result | Finding | Fix |
|---|---|---|---|---|---|
| L1 | Standard tier needs a video showing campaigns being created, edited or optimized | External | **Confirmed** | Microsoft Learn's quick start and access-tier pages say so. | None. |
| L2 | Development tier access is immediate once the product is requested | External | **Corrected** | The Advertising API is described as a vetted product open to approved developers, and LinkedIn reserves the right to review applications at its discretion. Even Development access involves an application. | Wait for Development tier to `unknown`; step 4 becomes an application. |
| L3 | Development tier only reaches mapped ad accounts | External | **Corrected** | The docs say reads are unlimited for accounts you administer and edits cover up to five ad accounts. | Replace with the read/edit limits. |
| L4 | Standard tier lets "any LinkedIn user connect their ad accounts" | External | **Corrected** | LinkedIn's FAQ says Standard is not needed unless you build campaign management for multiple ad accounts. | Reword headline and blocker. |
| L5 | Standard upgrade is submitted "in the Developer Portal" | External | **Corrected** | The docs route it through a link to email with the subject "Standard API Access", or a ticket on the Developer Support Portal. | Update step 7 and the message template subject. |
| L6 | Standard review time unpublished | External | **Confirmed** | I found no published timeline; the docs add that LinkedIn may decline even qualified applicants. | Add the discretion caveat. |
| L7 | Scopes granted by the Advertising API product | External | **Confirmed** | The Increasing Access page lists `r_ads`, `rw_ads`, `r_ads_reporting`, `r_organization_admin`, `rw_organization_admin`. | None. |
| L8 | Per-scope flags (`rw_ads` yes, `r_ads` no) | External | **Could not verify** | The docs tie review to the access tier, not to individual scopes. | Mark `unknown`. |
| L9 | A Company Page is required to register | External | **Could not verify** | Not checked in this pass. | Verify before submitting. |

## Sources used

- GitHub: docs.github.com, "Differences between GitHub Apps and OAuth apps"
- Slack: docs.slack.dev changelog (rate limit changes for non-Marketplace apps, 29 May 2025); docs.slack.dev rate limits page; api.slack.com changelog entries on Marketplace entry requirements
- Shopify: shopify.dev access scopes reference; Shopify developer community thread on protected customer data; Workato's Shopify connector docs (third-party)
- Workday: Nango, Alteryx and Unified.to documentation on registering Workday OAuth clients (third-party); Workday's own docs not retrievable
- LinkedIn: Microsoft Learn LinkedIn Marketing docs (quick start, increasing access, access tiers, FAQ)

## Summary

- **Claims checked:** 39. **Confirmed 3, Corrected 28, Could not verify 8.**
- **Material external corrections (13):** G1, G2, S1, S3, H1, H2, W1, W2, W3, L2, L3, L4, L5. The other corrections are internal: evidence tags or sources that do not support the claim they carry.
- **What the agent got right:** registration URLs and tier structure for LinkedIn, the self-serve basics for GitHub, correctly leaving LinkedIn's and Slack's review times as unknown, and keeping a visible unknowns section.
- **Patterns in the errors:**
  1. **Confident effort estimates with borrowed evidence.** Setup times were tagged `official` or `community` without a source (G4, S5, H5, W5).
  2. **Probes that prove less than claimed.** "Confirmed docs" on redirects or error pages (G6, S6, H7).
  3. **Missing ecosystem caveats.** Rate limits (Slack), protected data (Shopify), org policies (GitHub), and tenant-level registration (Workday) were not found because the agent stopped at the docs landing and setup pages.
  4. **Over-high confidence** where evidence was thin (G7, H6, W8).
- **What this changes in the product:** a post-generation check that rejects `official`/`community` tags without a matching evidence link, caps confidence when one source supports many claims, and a prompt step that searches specifically for rate limits, restrictions, org policies and recent deprecations before drafting.

## Reproduce

Open the source named in each row and compare. Please spot-check at least W1 and S1 yourself before submitting, since I carried out this review rather than you.

## Fixes applied

Corrected versions of all five guides are in `data/library/` (originals kept in git history). Every corrected file validates against `spec/guide_schema.json`, every claim cites an existing evidence entry, and new sources are tagged `official` or `community` according to where they come from.

Judgement calls made while applying the fixes:

- **Workday** steps were rewritten around tenant-administrator registration. Because every source is third-party, evidence is tagged `community`, confidence is `low`, and difficulty moved from `gated` to `hard` because the guide's own scoring factors now sum to 8.
- **Slack and Shopify** types changed to `review_gated`, following the rule that the harder applicable type is primary.
- **Unverified items** (GitHub's "100 apps" limit, LinkedIn's Company Page requirement, Slack's current install minimum, Shopify App Store review time) were removed from the guide body and listed under unknowns.
- Where a probe could not show what a guide claimed (GitHub T2, Slack T4, LinkedIn T2), the test result was changed to `inconclusive`.
