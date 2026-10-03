# Ad Feed: Promoted vs Free Ads — Backend Requirements

**File:** `app/dashboard/DashboardClient.tsx` · `components/LegacyFeedAdCard.tsx` · `components/InvestmentPostCard.tsx`

---

## 1. How the Feed is Built (Frontend Logic)

The frontend fetches ads from `/api/ads/public/feed` with pagination, then splits every ad into one of two pools based on a single field:

```
ad.adType === "Promoted"  →  Promoted pool
ad.adType !== "Promoted"  →  Free pool  (anything else, e.g. "Free")
```

It then builds **chunks** in two passes:

### Pass 1 — Promoted-only chunks

Iterates the **Promoted pool** until exhausted. Each chunk gets up to 2 "blocks":

| Slot | Content |
|------|---------|
| `bigAd` | 1 Promoted ad → rendered as `LegacyFeedAdCard variant="big"` (or `InvestmentPostCard` if `postRole` is set) |
| `smallAds` | up to 5 Promoted ads → rendered as `LegacyFeedAdCard variant="small"` |

A category-row banner is shown **after every promoted chunk** (`showCategoryBatch: true`).

### Pass 2 — Free chunks with injected Promoted big-cards

Iterates the **Free pool** until exhausted. Each chunk gets up to 2 "blocks":

| Slot | Content |
|------|---------|
| `bigAd` | 1 Promoted ad (re-used from the same promoted list, separate copy) → big card |
| `smallAds` | up to 5 Free ads → small cards |

A category-row banner is shown between free chunks when more free ads remain.

**Result:** Promoted ads appear prominently at the top of the feed AND again as big banner cards interspersed between groups of free ads.

---

## 2. Required Backend Fields per Ad Type

### 2a. Fields required by BOTH ad types

| Field | Type | Notes |
|-------|------|-------|
| `_id` | `string` | Unique ad identifier |
| `headline` | `string` | Title shown on card |
| `description` | `string` | Used in search matching |
| `images` | `string[]` | At least `images[0]` for the card thumbnail |
| `price` | `number \| null` | Shown as `৳ price` if present |
| `category` | `string` | Displayed with icon on card; used for category-row grouping |
| `subCategory` | `string` | Used for filtering |
| `location` | `string` | Displayed on card with MapPin icon |
| `subLocation` | `string` | Used for filtering |
| `adType` | `"Promoted" \| "Free"` | **The primary field that routes each ad to promoted or free pool** |
| `createdAt` | `string` (ISO date) | Used for time-ago display |
| `deliveryCount` | `number` | Referenced in interface |
| `user._id` | `string` | Opens profile modal on click |
| `user.name` | `string` | Shown as "Post By / Promoted By [name]" |
| `user.storeName` | `string \| undefined` | Preferred over `name` if present |
| `user.photo` | `string \| undefined` | Avatar |
| `user.mVerified` | `boolean` | Shows verified badge next to name; also used by `promoteTag=Verified` filter |
| `user.verifiedBy` | `string \| undefined` | Secondary verification check |
| `user.followers` | `any[]` | Synced on follow/unfollow events |

### 2b. Fields required ONLY for Promoted ads

| Field | Type | Notes |
|-------|------|-------|
| `adType` | `"Promoted"` | Must be exactly `"Promoted"` (capital P) — the card shows "Promoted By" label instead of "Post By" |
| `promoteTag` | `string \| undefined` | Used by the `promoteTag` filter (e.g. `"Hot"`, `"Verified"`) |
| `promoteType` | `"call_msg" \| "traffic"` | Changes the CTA button behaviour |
| `trafficLink` | `string \| undefined` | Required when `promoteType === "traffic"` — renders as `<a href>` external link |
| `trafficButtonType` | `string \| undefined` | Button label for traffic link (e.g. `"Visit"`, `"Order Now"`) |

### 2c. Fields required for Investment / Marketplace posts (either type)

These ads have `postRole` set and are rendered with `InvestmentPostCard` instead of `LegacyFeedAdCard`.

| Field | Type | Notes |
|-------|------|-------|
| `postRole` | `"investor" \| "business_owner"` | Triggers `InvestmentPostCard` renderer |
| `businessStatus` | `"new" \| "running" \| "closed" \| "active" \| "inactive"` | Shown as status badge |
| `minInvestment` | `number \| undefined` | Investment amount display |
| `maxInvestment` | `number \| undefined` | Investment amount display |
| `expectedReturn` | `number \| undefined` | Shown in purple return box |
| `expectedProfit` | `number \| undefined` | Alternative return field |
| `investmentReturnType` | `string \| undefined` | Return type label |
| `priceBoxValues` | `Record<string, unknown>` | Key-value pairs for the custom price box |
| `priceBoxFields` | `Array<{key, label?, labelBn?, inputType?, order?}>` | Field definitions for the price box |
| `features.priceBoxValues` | same | Alternative location (fallback) |
| `features.priceBoxFields` | same | Alternative location (fallback) |
| `features.priceBoxEnabled` | `boolean` | Whether to show the price box |
| `features.priceBoxName` | `string` | Label for the price box section |

---

## 3. Feed API Endpoint Requirements

**Endpoint:** `GET /api/ads/public/feed`

### Query parameters the frontend sends

| Param | Value |
|-------|-------|
| `category` | category name string |
| `subCategory` | subcategory name string |
| `location` | location name string |
| `subLocation` | sublocation name string |
| `promoteTag` | tag string (omitted if `"All"`) |
| `sort` | `"newest"` or other sort key |
| `search` | free-text search string |
| `status` | always `"active"` |
| `page` | page number (starts at 1) |

### Required response shape

```json
{
  "success": true,
  "data": [ /* array of ad objects */ ],
  "hasMore": true,
  "feedCategories": [ /* optional: category objects to show in between-chunk banners */ ]
}
```

- `success` — boolean; feed stops processing if `false`
- `data` — array of ad objects (see fields above)
- `hasMore` — boolean; controls infinite scroll pagination
- `feedCategories` — optional array of `{ _id, name, categoryNameBn }` objects; shown as scrollable category rows between feed chunks. If omitted, no category banners render.

---

## 4. Session-level Ad Visibility (Repeat View Throttling)

The frontend tracks how many times a user sees each ad per browser session and can hide ads that have been seen too many times. This is controlled by admin settings:

| Setting | Meaning |
|---------|---------|
| `settings.userRepeatAdViewTime` | Max times the same ad is shown per session (0 = unlimited) |
| `settings.adReShowAfterMinutes` | Minutes after which a hidden ad becomes visible again (0 = hidden for whole session) |

**Impact on backend:** The frontend may skip some ads from the API response and auto-fetch up to 6 extra pages to fill the feed. The backend must return enough ads per page (ideally 10–20) to allow the frontend to find `> 0` visible ads without exhausting all pages. If every ad in a page is filtered out client-side, the frontend requests the next page automatically (up to `maxAutoPages = 6`).

---

## 5. Summary: What the Backend Must Ensure

1. **`adType` is always set** — `"Promoted"` for paid/promoted ads, `"Free"` (or any other value) for organic free ads. Missing this field causes the ad to fall into the free pool.

2. **Promoted ads must return first** (or mixed) in the `data` array — the frontend splits by type, so order in the response does not control placement, but having promoted ads present in the payload is required for them to appear.

3. **`promoteType` and `trafficLink` must be set for traffic-type promoted ads** — otherwise the CTA button defaults to a modal open instead of an external link.

4. **`user` object must be embedded**, not just a user ID — the card renders `user.name`, `user.storeName`, `user.mVerified` directly.

5. **`feedCategories` in the response** enables the between-chunk category browsing rows. Without it the category banners are absent but the feed still works.

6. **`hasMore: false` on the last page** — required to stop the infinite scroll observer from making further requests.
