# The Great Raszewski Detour

A mobile-first family map of Australia. A golden roadside sign is a detour. A green stamp is a place you have been. The original challenge is 100 detours, and it stays out of 100 even when the family adds their own.

Tagline: Australia, one wildly optimistic detour at a time.

## Run it locally

```bash
npm install
npm run dev
```

Open http://127.0.0.1:5173

Production build:

```bash
npm run build
npm run preview
```

Check the starter list (100 unique places, Australian coordinates, migration in sync):

```bash
npm run check:seed
```

## Demo mode

If `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are missing, the app starts immediately in **demo mode**. A banner says so. Places, visits, and field notes are stored in this browser's `localStorage` (`grd.places.v1`). Photos are stored in IndexedDB (`grd.photos.v1`) as compressed JPEGs, up to 10 per place, and they survive a reload. Demo mode does not need Supabase.

The 100 starters are copied in once. Loading the app again does not reset visits or recreate a place you removed. Clearing the site data for this origin starts a fresh demo.

Demo mode is one browser, not a shared family map.

## Place search

The **Search places** field on the main screen finds starters and family-added places by name. It never calls a geocoder, so Uluru and the pie shop still come up when remote search is off or the directory fails.

**Add a detour** stays on the screen, in the thumb zone on a phone. Inside that sheet, **Search for a place** lists a starter already on the map before directory results when the name matches (Robertson Pie Shop in Robertson NSW comes ahead of the Brisbane suburb). Choosing that starter opens the detour. Choosing a place that is not on the map names the detour, drops the pin, and flies the map there. If that search is off or fails, tap the map and name the pin. A name and a location are the only requirements.

Default provider: the public [Photon](https://photon.komoot.io/) demo (`https://photon.komoot.io/api/`). Photon is built for search-as-you-type. Its published terms allow project use if you are fair: extensive use is throttled, and there is no availability guarantee. This app waits for 3 characters, debounces 450ms, sends one request at a time, caches repeats, limits results to 6, and biases the search to Australia. Results are OpenStreetMap data (ODbL). Attribution is shown next to the search box.

Set `VITE_GEOCODE_URL=off` to disable remote search.

If `VITE_GEOCODE_URL` points at `nominatim.openstreetmap.org`, the app does **not** autocomplete. The [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/) forbids autocomplete against the public API, so the form searches only when you press Search. Prefer your own Nominatim instance if you need more than light family use. The public service also asks for a valid Referer or User-Agent and at most one request per second.

## Basemap

The default tiles are the OpenStreetMap standard layer. Attribution stays on the map. That server is run for light use; a family map is the right size, and you can point the app at your own tiles if you outgrow it.

CARTO Voyager (`basemaps.cartocdn.com`) now paints an "API key required" watermark unless you have a key, so it is not the default. If you have a tile URL, set:

```bash
VITE_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
VITE_TILE_ATTRIBUTION=&copy; OpenStreetMap contributors
```

## Environment variables

Copy `.env.example` to `.env.local`. Never commit real keys. The only Supabase key that belongs in the client is the **anon** key.

| Name | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL. Unset = demo mode. |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon public key. Unset = demo mode. |
| `VITE_TILE_URL` | Optional tile URL. |
| `VITE_TILE_ATTRIBUTION` | Optional tile attribution HTML. |
| `VITE_GEOCODE_URL` | Optional geocoder. `off` disables it. A Nominatim host forces search-on-submit. |

The service role key must stay on the server. Do not put it in `.env.local`, client code, or the repo.

## Supabase: shared family map

1. Create a Supabase project.
2. In Authentication, turn on email/password. For a small family, disabling email confirmation makes sign-up less fiddly. Leaving it on is fine; the app tells people to check their inbox.
3. Open the SQL editor and run `supabase/migrations/20241114000000_family_map.sql` once. That creates the tables, the 100 starter rows, row level security, and the helper functions. Then run `supabase/migrations/20241115000000_place_photos.sql`. That adds the private `place-photos` bucket and the `place_photos` table. If the family map was created before photos existed, run only the photos file.
4. In Database → Publications, make sure `places` is in `supabase_realtime` (the migration tries to add it). That is what lets one signed-in member see another member's change.
5. Put the project URL and anon key in `.env.local`, then restart `npm run dev`.

### Create the family map

1. Sign up in the app with the owner's email.
2. Choose **Create the family map**. The default name is The Great Raszewski Detour.
3. The app calls `seed_family_map`, which copies the 100 starters in as not-yet detours. None of them start stamped.

### Add family members

1. Each person creates their own account first (same app, their own email).
2. The owner opens their email menu and adds the member's email.
3. That person taps **Check again** (or signs in again). They should see the same places.

`add_map_member` only works for the map owner, and only for an email that already has an account.

### What the rules do

- `family_maps`, `map_members`, and `places` use row level security.
- A person can read and write places only when `map_members` says they belong to that map.
- An account that was never added cannot select the family's rows.
- Visit status, dates, and field notes live on `places`, so they are not world-readable.
- `starter_places` is the public catalogue (names and coordinates only). The client cannot read it. `seed_family_map` copies it.
- Photos live in the private `place-photos` bucket and in `place_photos`. Row level security and the storage policies both call `is_map_member`. A signed-in member of that map can see and add them. An account that was never added, and anyone not signed in, cannot. The bucket is not public, so a guessed file URL does not open. Each place accepts 10 photos; the database refuses an 11th.

### Seed once

`seed_family_map` sets `family_maps.seeded_at`. A later call returns immediately and does not insert again. Visits stay put. A starter the family removed is not recreated. Re-running the SQL file refreshes the catalogue table only (`on conflict do update`). It does not touch a family's `places` rows.

Pins show a golden roadside sign for a detour and a green stamp with a tick for been there, drawn on top of that place's type colour. Next up is a separate flag: tap it on the place card, tap again to clear it, and marking Been there clears it too. Undo puts the flag back if it was on. Filters are All, Next up, and Been there, and they combine with a place-type filter. Tap a type in the Place types legend to show only that type. Tap it again to show every type. The types are Coast, Wildlife, Outback, Mountains, History, Quirky, Culture, Rainforest, and Museum, each with its own colour from the paper, teal, mustard, and brick palette. The same colour is on the pin, the legend chip, and the list row. Museum is for museums and similar stops: Questacon, the Australian War Memorial, Sovereign Hill, and the Australian Age of Dinosaurs. Healesville Sanctuary stays Wildlife. The same icons are in the list and in the Place types legend. The original challenge stays out of 100.

On a laptop the list sits beside the map. On a phone, **List** expands that same list over the screen, and **Close list** returns to the map.

Each place card has a photo strip. **Add a photo** stores a compressed JPEG. Ten is the limit, and an eleventh is refused with “10 photos is the limit”. In demo mode the photos stay in this browser. In a shared map they stay with that place for every signed-in member.

If a map was seeded before a catalogue change, refresh starter types without touching visits:

```sql
update public.places p
set category = s.category
from public.starter_places s
where p.is_starter and p.id = s.id and p.category is distinct from s.category;
```

The progress line is always "X of 100 original detours visited". Family-added places show on the map and in the filters, and they do not change the 100. A one-line **Field notes from the back seat** sits on each list row and saves immediately. Writing one does not mark the detour visited, so the starter challenge stays out of 100.

**Closest to us** sorts that list by the browser's location when the family allows it. If they say no, the list stays in its current order. On a place, **Can we go there?** answers with the distance once that location is available.

## Starter places

`src/data/starters.json` is what demo mode loads, so the pins do not depend on a live geocoder. The same 100 rows are in the SQL migration. IDs are `detour-001` … `detour-100`.

Coordinates were checked against Wikipedia and Wikidata, official park or operator pages (including published GPS where the site gives it), Geoscience Australia place-name coordinates for Turquoise Bay, and OpenStreetMap for visitor points such as lookouts, car parks, and the Robertson Pie Shop. Broad parks are pinned on a meaningful visitor spot (Echo Point for the Three Sisters, Piccaninny car park for the Bungle Bungles, the Valley of the Winds car park, Point Avoid in Coffin Bay, Darlington on Maria Island). Murrays Beach is in Jervis Bay Territory, so its region is `JBT` even though it sits with the south-coast list.

Boat-only or permit places (Agincourt Reef, Horizontal Falls, Whitehaven Beach, Pajinka, Uluru's base walk) use a public map reference and link to official visitor information. The Uluru climb is closed; the pin is the base walk.

To regenerate the JSON and the migration from the same list:

```bash
python3 scripts/generate-seed.py
```
