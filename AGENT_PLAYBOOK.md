# AGENT PLAYBOOK — "Prove It Works" Edition

## Global rules

- Work in small steps: Plan → Change → Test → Fix → Commit.
- Keep a JSON log at repo root: /PROJECT_STATE.json with current task, results, and issues.
- Never claim completion without a passing test.
- Secrets live in Replit Secrets only. No keys client-side.
- Template for /PROJECT_STATE.json updates:
  ```json
  { "current": "F2.3 Save generated image to library", "done": [], "issues": [] }
  ```

## F0. Repo sanity + test harness

**Intent:** Ensure consistent structure and a reliable test loop.

**Do:**
- Confirm folders exist: `client/`, `server/`, `shared/`, `config/`, `migrations/`, `scripts/`, `e2e/`, `docs/`.
- Install Playwright and its deps. Ensure `playwright.config.ts` is present.
- Add npm scripts (if missing) to package.json:
  ```json
  {
    "scripts": {
      "db:setup": "psql \"$DATABASE_URL\" -f migrations/0001_init.sql",
      "seed": "tsx scripts/seed.ts",
      "dev": "node server/index.js || tsx server/index.ts",
      "e2e:install": "npx playwright install --with-deps",
      "e2e": "playwright test --reporter=dot"
    }
  }
  ```

**Test:**
- `npm run e2e:install`
- `E2E_BASE_URL=http://localhost:5000 npm run e2e` (with server running)

**Exit:**
- Test runner executes, even if tests fail. Failures are allowed here; existence of harness is the pass.

## F1. Approval queue model + routes

**Intent:** Make the approval flow obvious and reliable.

**Domain model:**
- `campaigns(id, user_id, name, start_date, status)`
- `posts(id, campaign_id, user_id, kind, content_ref, caption, scheduled_at, status)`
- `post_status` ENUM: `draft → pending_approval → approved → scheduled → posted → failed` (allow `rejected` from `pending_approval`)

**Do:**
1. DB migration (if fields missing):
   - Ensure `posts.status` ENUM has values above.
   - Ensure `posts.content_ref` can point to `content_library.id` (nullable for text).

2. Routes (Express examples):
   - `POST /api/posts/submit`: `draft → pending_approval`
   - `POST /api/posts/approve`: `pending_approval → approved`
   - `POST /api/posts/reject`: `pending_approval → rejected` (requires reason)
   - `POST /api/posts/schedule`: `approved → scheduled` (requires `scheduled_at`)
   - Handlers must validate ownership, status transitions, and timestamps with Zod.

**Test (Playwright + API):**
- Create draft → submit → approve → schedule → verify persisted statuses.
- Rejection path: draft → submit → reject (reason mandatory).

**Exit:**
- All state transitions enforced by server (no client-side only logic).
- Tests pass for happy paths and for illegal transitions (should 422).

## F2. Content library auto-save (images/videos only)

**Intent:** Every generated image/video is saved automatically to the user's library. Text is excluded.

**Do:**
1. Create `server/library.ts`:
   ```typescript
   export async function saveToLibrary(storage, {userId, kind, bytes, mime, prompt, meta}) {
     // Persist file (local persistent or S3-style); return { assetUrl, size, hash }
     const { assetUrl } = await persistFile(bytes, mime); // implement
     return storage.createContent({
       userId, kind, assetUrl, mime, prompt, meta, source: "ai_generate"
     });
   }
   ```

2. In AI routes:
   - After successful image generation:
     ```typescript
     if (result.imageBytes) await saveToLibrary(storage, { userId, kind: "image", bytes: result.imageBytes, mime: "image/png", prompt, meta });
     ```
   - After successful video finalization:
     ```typescript
     if (result.videoBytes) await saveToLibrary(storage, { userId, kind: "video", bytes: result.videoBytes, mime: "video/mp4", prompt, meta });
     ```
   - Do not save text responses to library; return the text only.

3. Add a `GET /api/library` route with filters: type, time, campaign; and `DELETE /api/library/:id` for clean-up.

**Test:**
- Image gen: returns 200, credits deducted, library count +1; response includes `libraryItemId`.
- Video gen: on completion, library count +1.
- Text gen: no change in library.

**Exit:**
- Library auto-save verified; text excluded.

## F3. Campaign builder (14 posts, 2/day × 7 days)

**Intent:** The core "money path" is correct and repeatable.

**Do:**
1. Implement `POST /api/campaigns/generate`:
   - Inputs: `prompt/theme`, `start_date`, `cadence="2_per_day_7_days"`
   - Generate 14 post records as `draft` tied to a campaign; fill `scheduled_at` slots (e.g., 10:00 & 16:00 local).
   - Ensure each image/video post references a `content_library` item (either pick from existing or queue a generation step).

2. Add `PUT /api/campaigns/:id/apply-schedule` to set/adjust times safely; validate no overlaps unless allowed.

**Test:**
- Create campaign from prompt → 14 draft posts created with correct schedule distribution.
- Approval path works on these posts.
- Attempt to overschedule returns 422.

**Exit:**
- E2E validates counts, timestamps, and statuses.

## F4. Scheduler + mock publisher

**Intent:** Scheduled posts actually move to `posted` or `failed` with retries.

**Do:**
1. Add a lightweight in-process scheduler:
   - Every 30–60s, fetch posts where `status='scheduled'` and `scheduled_at <= now()`, lock rows, attempt publish.
   - On success: `posted`. On failure: increment attempt count, backoff, update `failed_reason` when exhausted.

2. Create poster interface and a mock poster as default until real APIs are approved:
   ```typescript
   interface Poster { postText(...); postImage(...); postVideo(...); }
   export const poster = process.env.X_API_KEY ? realPoster : mockPoster;
   ```

3. Ensure idempotency: if the scheduler restarts, it won't double-post (use a `publish_token` or transactional update).

**Test:**
- Schedule 2 mock posts in the near future; wait for scheduler tick → statuses become `posted`.
- Introduce a forced failure → retries happen → eventually `failed` with reason.

**Exit:**
- Deterministic, observable transitions. Logs show request IDs per publish.

## F5. Credit gating & refunds

**Intent:** Cost is enforced before calling AI; refunds on failure.

**Do:**
1. Wrap AI routes with `requireCredits('text'|'image'|'video')`.
2. On success, `await deductCredits(res)`. On thrown error, no deduction.
3. Keep prices central in `config/credits.ts`: text=1, image=5, video=20. Enforce <=8s for non-Enterprise; use Veo "fast".

**Test:**
- Starter user: 1 image → credits -5. 12s video → 422. 8s video → -20.
- Enterprise user bypasses 8s cap.

**Exit:**
- E2E `plan-gates.spec.ts` green.

## F6. Payments (Stripe) → ledger

**Intent:** Buying credits actually credits the account idempotently.

**Do:**
1. `POST /api/billing/checkout`: create Checkout Session in test mode; include `{ userId, purchaseId }` metadata.
2. `POST /api/billing/webhook`: verify signature; idempotently insert a ledger row and adjust balance in a DB transaction.

**Test:**
- With Stripe CLI, fire a `checkout.session.completed` → balance increases exactly once on retries.

**Exit:**
- Webhook is idempotent; purchase history renders in UI.

## F7. Security hardening

**Intent:** No foot-guns in production.

**Do:**
1. `helmet` with strict CSP (no `unsafe-eval` in prod).
2. CORS allowlist from `CORS_ORIGINS`.
3. Zod validate every request body and query; clean error objects.
4. Rate limit auth and billing routes.

**Test:**
- Invalid payloads return 422, never 500.
- CSP violation script gets blocked.
- CORS blocks unknown origins.

**Exit:**
- Security checks pass locally and on the deployed URL.

## F8. Observability

**Intent:** Make failures diagnosable in minutes, not hours.

**Do:**
1. Pino JSON logging; attach `reqId` to every request.
2. `/health` always 200; `/ready` only when DB OK.
3. Optional Sentry hook (env-guarded).
4. `/metrics` basic counters (posts processed, publish failures, AI errors).

**Test:**
- Logs show request IDs; `/ready` flips to 200 after DB connects; metrics endpoint returns JSON.

**Exit:**
- Operability verified.

## F9. Social platforms — prepare for approval, not live posting

**Intent:** Be approval-ready for each network even without keys.

**Do:**
1. Keep mock posters as default.
2. Build "Connect <Platform>" flows that create a connection record with `status: 'pending_approval'`.
3. Generate docs in `docs/platforms/<platform>.md`:
   - App purpose, data usage, minimum scopes, callback URLs, screenshots, privacy/terms links.
4. Add admin toggles to enable a platform once keys are issued later.

**Test:**
- "Connect" flow completes (mock), records appear; platform docs generated and linked from admin.

**Exit:**
- App is submission-ready; production stays safe until approvals.

## F10. CI gate + deployment verification

**Intent:** Do not ship red.

**Do:**
1. Ensure `npm run e2e` runs headless in CI.
2. Block deployment if any tests fail.
3. After Deployments, run smoke (`/health`, `/ready`) and one tiny AI call if keys exist; otherwise assert "feature unavailable" UX.

**Exit:**
- CI green; deployed URL passes smoke; approval queue & library flows confirmed on live.

## Required test additions (copy/paste skeletons)

### e2e/approval-queue.spec.ts
```typescript
import { test, expect } from '@playwright/test';

test('approval queue: draft → pending → approved → scheduled', async ({ request }) => {
  const base = process.env.E2E_BASE_URL!;
  // create draft
  let r = await request.post(`${base}/api/posts`, { data: { kind: 'image', caption: 'hello' }});
  expect(r.ok()).toBeTruthy();
  const post = await r.json();

  // submit
  r = await request.post(`${base}/api/posts/submit`, { data: { id: post.id }});
  expect(r.ok()).toBeTruthy();

  // approve
  r = await request.post(`${base}/api/posts/approve`, { data: { id: post.id }});
  expect(r.ok()).toBeTruthy();

  // schedule
  const inTwoMin = new Date(Date.now()+120000).toISOString();
  r = await request.post(`${base}/api/posts/schedule`, { data: { id: post.id, scheduled_at: inTwoMin }});
  expect(r.ok()).toBeTruthy();
});
```

### e2e/library-autosave.spec.ts
```typescript
import { test, expect } from '@playwright/test';

test('image gen auto-saves to library; text does not', async ({ request }) => {
  const base = process.env.E2E_BASE_URL!;

  const img = await request.post(`${base}/api/ai/image`, { data: { prompt: "red cube" }});
  expect(img.ok()).toBeTruthy();

  const lib = await request.get(`${base}/api/library?kind=image`);
  const items = await lib.json();
  expect(items.length).toBeGreaterThan(0);

  const txt = await request.post(`${base}/api/ai/text`, { data: { prompt: "tagline" }});
  expect(txt.ok()).toBeTruthy();

  const libText = await request.get(`${base}/api/library?kind=text`);
  const textItems = await libText.json();
  expect(textItems.length).toBe(0);
});
```

### e2e/campaign-generate.spec.ts
```typescript
import { test, expect } from '@playwright/test';

test('campaign generator creates 14 posts with correct schedule', async ({ request }) => {
  const base = process.env.E2E_BASE_URL!;
  const start = new Date(Date.now()+86400000).toISOString();

  const r = await request.post(`${base}/api/campaigns/generate`, {
    data: { prompt: "gym grand opening", start_date: start, cadence: "2_per_day_7_days" }
  });
  expect(r.ok()).toBeTruthy();
  const { campaignId, postCount } = await r.json();

  expect(postCount).toBe(14);

  const posts = await (await request.get(`${base}/api/campaigns/${campaignId}/posts`)).json();
  expect(posts.length).toBe(14);
  // Optional: validate two per day distribution
});
```

## Final acceptance (what "100% working" means)

1. Approval queue transitions enforced by server with proper validation and audit.
2. Auto-save to content library for image/video only; text excluded by design.
3. 14-post campaign generator creates correct schedule; posts tie to library assets.
4. Scheduler promotes scheduled posts to `posted` (or `failed`) with retries.
5. Credit gating and refunds are correct and atomic.
6. Stripe test purchase updates the ledger idempotently.
7. Security (CSP/CORS/validation/rate limits) is tight; no secrets leak to client.
8. Logs are structured; `/health` and `/ready` reflect real readiness; metrics available.
9. All E2E tests above + existing ones are green in CI and against the live URL.

## What to tell the Replit agent verbatim

> Use /AGENT_PLAYBOOK.md as your only source of truth. For each F-task:
> 1. Plan the change, 2) implement, 3) run the specific tests named in that section, 4) if any test fails, fix the code and rerun until green, 5) update /PROJECT_STATE.json, 6) commit.
> Do not skip tests. Do not mark tasks complete until the relevant E2E is passing locally and on the deployed URL.

This gives you a disciplined, repeatable path from "demo glue" to customer-ready—with the agent proving every claim in code and tests, not vibes.