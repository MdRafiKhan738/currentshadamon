# Ad Serving Investigation — Repository A (prevshadamon)

Complete analysis of how advertisements are fetched, filtered, and rendered in the working frontend codebase. No code was modified during this investigation.

**Backend:** `https://prevsbackend.onrender.com`  
**Framework:** Next.js App Router (frontend only)  
**Database:** MongoDB (inferred from `_id` field shapes)

---

## 1. Project Architecture

Repository A is a **pure frontend** Next.js application using the App Router. There are **no backend API route handlers** in this repo — no `app/api/` or `pages/api/` directories exist. All ad data comes from a separate backend server over HTTP.

```
app/
  context/          ← SettingsContext.tsx, LanguageContext.tsx
  dashboard/        ← DashboardClient.tsx (main feed), DashboardLayoutClient.tsx
  info/             ← Static info pages
  payment/status/   ← Payment callbacks
components/         ← Reusable UI (AdDisplay, FilterModal, MerchantsModal…)
utils/
  apiConfig.ts      ← Single source of API_BASE_URL
  imageUrl.ts       ← Image path resolver
  labels.ts         ← Ad label helpers (highlight detection)
  timeAgo.ts        ← Relative time formatter
```

---

## 2. API Base URL

All HTTP requests use a single exported constant from `utils/apiConfig.ts`:

```typescript
// utils/apiConfig.ts
export const API_BASE_URL = 'https://prevsbackend.onrender.com';
```

> **⚠ Hard-coded URL — env vars ignored**  
> The `.env` file contains `NEXT_PUBLIC_API_URL=http://localhost:5000` but `apiConfig.ts` ignores it entirely. The URL is hard-coded. Any change to the backend domain must be made directly in this file.

One exception: `app/layout.tsx` uses a separate hard-coded constant `API_URL = 'https://api.shadamon.com'` only for server-side OG image metadata — it does not affect ad serving.

---

## 3. All Backend Endpoints

### Advertisement endpoints

| Method | Path | Auth | Used by |
|--------|------|------|---------|
| GET | `/api/ads/public/feed` | None | DashboardClient — main feed |
| GET | `/api/ads/public/all` | None | DashboardClient + DashboardLayoutClient |
| GET | `/api/ads/public/{adId}` | None | DashboardLayoutClient — single ad detail modal |
| GET | `/api/ads/public/ad-positions` | None | SettingsContext — banner/display ads |
| GET | `/api/ads/me` | Bearer token | LatestFreeAdPromo — user's own ad |

### Category & location endpoints

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/categories` | None |
| GET | `/api/categories/sub` | None |
| GET | `/api/locations` | None |
| GET | `/api/locations/sub` | None |

### User & settings endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/user/premium` | None | Popular Sellers sidebar |
| GET | `/api/user/me` | Bearer token | Following status on sellers |
| POST | `/api/user/follow/{userId}` | Bearer token | Follow / unfollow |
| POST | `/api/user/profile/{userId}/view` | None | Profile view counter |
| GET | `/api/settings/dashboard` | None | Site config + view limits |

---

## 4. Ad Data Model

Inferred from the TypeScript interface in `app/dashboard/DashboardClient.tsx`. The backend almost certainly stores ads in a MongoDB collection.

```typescript
interface ActiveAd {
  _id:               string;        // MongoDB ObjectId
  headline:          string;
  description:       string;
  images:            string[];      // relative paths → getImageUrl() resolves
  price?:            number;
  category:          string;        // category *name*, not ID
  subCategory?:      string;        // subcategory *name*
  location:          string;        // location *name*
  subLocation?:      string;
  user: {
    _id:         string;
    name:        string;
    storeName?:  string;
    photo?:      string;
    verifiedBy?: string;
    mVerified?:  boolean;           // merchant verified flag
    followers?:  any[];
  };
  deliveryCount:     number;
  createdAt:         string;        // ISO 8601
  adType:            "Free" | "Promoted";
  promoteTag?:       string;        // e.g. "New", "Offer", "Featured"
  promoteType?:      "call_msg" | "traffic";
  trafficLink?:      string;        // external URL for traffic-type promoted ads
  trafficButtonType?: string;       // CTA button label, default "Visit"
  labels?:           string[];      // ["highlight"] → orange border styling
}
```

> **Note:** Categories, locations, and subcategories are stored by **name string**, not ID. The backend filters by these name strings directly. If names are inconsistent between repos, filtering will silently return zero results.

---

## 5. `/api/ads/public/feed` — Full Behavior

### Query parameters

| Param | Type | Sent when |
|-------|------|-----------|
| `page` | number | Always (starts at 1) |
| `category` | string | When filter active |
| `subCategory` | string | When filter active |
| `location` | string | When filter active |
| `subLocation` | string | When filter active |
| `promoteTag` | string | Only when not "All" |
| `sort` | string | Always (default "newest") |
| `search` | string | When search query exists |

### Expected response shape

```json
{
  "success": true,
  "data": [ "...ActiveAd objects..." ],
  "hasMore": true,
  "feedCategories": [ "...optional, category rows between feed chunks..." ]
}
```

- If `success` is falsy, the frontend aborts immediately and shows nothing.
- `feedCategories` is optional — missing it suppresses category rows but does not break the feed.

### Auto-pagination loop

The frontend does **not** simply show one page. It loops up to **6 times** per scroll event:

1. Fetch `GET /api/ads/public/feed?...&page=N`
2. If `!adsRes.success` → break loop, show nothing
3. Filter out ads blocked by session view limits (only when not in filter mode)
4. Deduplicate by `_id`
5. If `collectAds.length > 0` OR no more pages → **break**
6. Otherwise increment page and repeat (up to 6 times)

> **⚠ Session limits can hide all ads**  
> If every ad the backend returns has already been seen `userRepeatAdViewTime` times, the loop fetches up to 6 pages and still shows nothing — silently. This is the most common cause of an empty feed with a healthy backend.

---

## 6. `/api/ads/public/all` — Usage

Returns the complete ad list (no pagination). Stored in `totalAds` state. Used **only** for display counts and category row cards — it does **not** drive the main feed.

```json
{ "success": true, "data": [ "...ActiveAd objects..." ] }
```

Used for:
- Sidebar category counts: `totalAds.filter(ad => ad.category === cat.name).length`
- Sidebar subcategory counts: `totalAds.filter(ad => ad.subCategory === sub.name).length`
- "Viewing X ads" header label (filtered by current active filters)
- Horizontal category row cards between feed chunks (up to 10 ads per category)

Also called with `?search=...&limit=5` for search typeahead suggestions in `DashboardLayoutClient`.

---

## 7. Session View Limit System

This is the most complex frontend-only mechanism. It runs entirely in the browser using `sessionStorage` and settings fetched from the backend.

### SessionStorage keys

| Key | Type | Purpose |
|-----|------|---------|
| `ad_session_views` | `Record<adId, count>` | How many times each ad was shown this session |
| `ad_session_view_tokens` | `Record<adId, pageToken>` | Prevents double-counting on re-renders |
| `ad_session_reshow_at` | `Record<adId, epochMs>` | Absolute timestamp when blocked ad re-appears (0 = never) |
| `ad_session_limit` | `number` | Persisted limit from settings (fallback) |

### Settings that drive the limits

```typescript
// From GET /api/settings/dashboard → SettingsContext
const limit         = settings.userRepeatAdViewTime || 0;  // 0 = no limit
const reShowAfterMs = (settings.adReShowAfterMinutes || 0) * 60 * 1000;
```

### When limits apply

Limits are **only checked** when the user is *not filtering*:

```typescript
const isFiltering = !!(
  filters.category  ||
  filters.location  ||
  filters.search    ||
  (filters.promoteTag && filters.promoteTag !== "All")
);
// subCategory and subLocation alone do NOT set isFiltering
```

### Eligibility check

```typescript
if (!isFiltering) {
  eligible = rawAds.filter((ad) => {
    if (sessionReShowAt[ad._id] !== undefined) return false; // blocked by timer
    if (effectiveLimit > 0) return (sessionViews[ad._id] || 0) < effectiveLimit;
    return true; // no limit → always show
  });
}
```

### Re-show timer reset

At the top of every `fetchData()` call, any ad whose `reshowAt` timestamp has passed has its session records deleted — it becomes visible again.

> **Debugging tip:** To reset all session view state, open DevTools → Application → Session Storage and delete all four `ad_session_*` keys, or log out (which clears `ad_session_views` and `ad_session_view_tokens` — note: *not* `ad_session_reshow_at`).

---

## 8. Ad Rendering Logic

### Feed chunking algorithm

The `ads` array is split into two pools — `promotedPool` (`adType === "Promoted"`) and `freePool` — then interleaved into chunks:

**Phase 1 — Promoted chunks:** each chunk takes 2 "big" promoted ads + up to 5 small ads per big ad (10 small total), entirely from the promoted pool.

**Phase 2 — Free chunks:** each chunk takes 2 big ads from *a copy* of the promoted pool, plus up to 5 free ads each. Promoted ads appear a second time here as big cards inside free chunks.

### Big card vs. small card

| Type | Image | Layout |
|------|-------|--------|
| Big (bigAd) | 16:9 aspect ratio, blurred background + contained foreground | Full-width card with price, location, category |
| Small (smallAds) | 120×90px (mobile) / 160×130px (desktop) thumbnail | Horizontal flex: thumbnail + details |

### Traffic ads

If `ad.adType === "Promoted" && ad.promoteType === "traffic" && ad.trafficLink`, clicking opens `trafficLink` in a new tab. The Ad Details modal is **never opened** for these.

### Highlight styling

Ads where `hasHighlightLabel(ad)` returns true get an orange border and drop shadow. This checks `ad.labels` for the string `"highlight"` or `"highlights"`.

### Category row

After each chunk, if `chunk.showCategoryBatch` is true, a horizontal scrolling row of up to 10 `totalAds` for a given category is rendered. The category comes from `feedCategories` returned by the feed API. The `categoryToShow` variable is derived as `feedAdsCategories[chunkIndex % feedAdsCategories.length]`.

---

## 9. Filter System

### URL parameter mapping

| Short param | Long param | State field |
|-------------|------------|-------------|
| `c` | `category` | `filters.category` |
| `sc` | `subCategory` | `filters.subCategory` |
| `l` | `location` | `filters.location` |
| `sl` | `subLocation` | `filters.subLocation` |
| `search` | — | `filters.search` |
| `promoteTag` | — | `filters.promoteTag` (default: "All") |
| `sort` | — | `filters.sort` (default: "newest") |

### `promoteTag="Verified"` special case

On the frontend count display only, "Verified" is treated as `ad.user?.mVerified === true` rather than matching `ad.promoteTag`. The backend receives `promoteTag=Verified` as a query param and handles it server-side.

### Saved search (localStorage)

The "Save Search" button snapshots the current `ads` array to `localStorage` under `saved_search_ads`. When viewing saved results, the feed fetcher is paused and session view limits are bypassed.

---

## 10. Image URL Resolution

All image paths from the API pass through `utils/imageUrl.ts → getImageUrl()`:

```typescript
export const getImageUrl = (path) => {
  if (!path) return '';
  // Already absolute URL or data URI → return as-is
  if (path.startsWith('http') || path.startsWith('data:') || ...) return path;
  // Raw base64 (>200 chars, no / or .) → wrap in data URI
  if (path.length > 200 && ...) return `data:${mime};base64,${path}`;
  // Relative path → prepend API_BASE_URL
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};
```

So an image stored as `uploads/photo.jpg` is served as `https://prevsbackend.onrender.com/uploads/photo.jpg`.

---

## 11. Full Startup Request Sequence

On initial load of `/d`, requests fire in this order:

1. `GET /api/settings/dashboard` — SettingsProvider mount → populates `settings` (view limits, logo, etc.)
2. `GET /api/ads/public/ad-positions` — SettingsContext → populates banner ad positions
3. `GET /api/ads/public/all` — `fetchInitialData()` + DashboardLayoutClient → total count + category row data
4. `GET /api/user/premium` — `fetchInitialData()` → Popular Sellers sidebar
5. `GET /api/user/me` — only if `Cookies.get("token")` exists → following status on sellers
6. `GET /api/categories` + `/api/categories/sub` + `/api/locations` + `/api/locations/sub` — all 4 in parallel; only on first render (`hasFetchedMetaRef` guard)
7. `GET /api/ads/public/feed?page=1` — `fetchData()` → main ad feed

Steps 3–5 run in parallel. Steps 6 and 7 also run in parallel.

---

## 12. Settings API

Fetched from `GET /api/settings/dashboard` → `SettingsContext`. Shapes ad visibility behavior:

| Field | Type | Effect on ads |
|-------|------|---------------|
| `userRepeatAdViewTime` | number | Max times each ad shows per session (0 = unlimited) |
| `adReShowAfterMinutes` | number | Minutes after which a blocked ad re-appears (0 = never re-shows) |
| `siteLogo` | string | Logo image path |
| `favIcon` | string | Favicon path |
| `productPhotoLimit` | number | Max images per ad post |
| `blockCheckInHeadline` | string[] | Words blocked in headlines |
| `blockCheckInDescription` | string[] | Words blocked in descriptions |

Display-banner ad positions come from a separate call: `GET /api/ads/public/ad-positions`. Position IDs used: `1` (top), `2` (below header), `5` (popup on load).

---

## 13. Failure Checklist for Repository B

Ranked by likelihood. Each is an independent cause that would produce an empty feed.

1. **`API_BASE_URL` wrong or missing.** Repository B must hard-code (or correctly wire) its backend URL. `NEXT_PUBLIC_API_URL` env var is ignored in Repo A — the URL lives in `utils/apiConfig.ts`.

2. **`/api/ads/public/feed` returns `success: false` or missing field.** If the field is falsy, the frontend breaks immediately and shows nothing. Check the raw network response in DevTools.

3. **Session view limits blocking all ads.** If `userRepeatAdViewTime > 0` and all returned ads have been seen ≥ limit times, the feed is empty. Clear `sessionStorage` keys `ad_session_views`, `ad_session_view_tokens`, `ad_session_reshow_at` to verify.

4. **Settings not loading (`userRepeatAdViewTime` becomes `storedLimit`).** If `/api/settings/dashboard` fails, `effectiveLimit` falls back to the previously stored sessionStorage value. A stale high limit hides ads.

5. **CORS rejection.** All requests go to an external domain. If Repo B is on a different origin, the backend must whitelist it. A CORS error is silent in the feed (just an empty response).

6. **Category/location name mismatches.** Filters use name strings, not IDs. If the backend data uses different name values in Repo B, filtering returns zero results.

7. **Traffic ads never open a modal.** Ads with `promoteType === "traffic"` open an external link instead of the detail modal. This is intentional behavior, not a bug.

8. **`feedCategories` missing.** Not required for ads to show — just suppresses the horizontal category row between chunks. Won't cause an empty feed on its own.

9. **Auth token cookie missing on user-specific calls.** `/api/ads/me` and follow status require a `"token"` cookie. The main feed does not require auth.
