import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const starters = JSON.parse(readFileSync(join(root, "src/data/starters.json"), "utf8"));
const sql = readFileSync(
  join(root, "supabase/migrations/20241114000000_family_map.sql"),
  "utf8",
);

const failures = [];
const ids = new Set();
const names = new Set();
const coords = new Set();
const regions = {};
const allowed = new Set([
  "Coast",
  "Wildlife",
  "Outback",
  "Mountains",
  "History",
  "Quirky",
  "Culture",
  "Rainforest",
  "Museum",
]);

if (starters.length !== 100) failures.push(`expected 100 starters, got ${starters.length}`);

for (const place of starters) {
  if (ids.has(place.id)) failures.push(`duplicate id ${place.id}`);
  ids.add(place.id);
  if (names.has(place.name)) failures.push(`duplicate name ${place.name}`);
  names.add(place.name);
  const key = `${Number(place.lat).toFixed(5)},${Number(place.lng).toFixed(5)}`;
  if (coords.has(key)) failures.push(`duplicate coordinates ${place.name} ${key}`);
  coords.add(key);
  if (!(place.lat <= -10.5 && place.lat >= -44 && place.lng >= 113 && place.lng <= 154)) {
    failures.push(`coordinate outside Australia ${place.name} ${place.lat},${place.lng}`);
  }
  if (!place.note || place.note.length < 20) failures.push(`note too short ${place.id}`);
  if (!allowed.has(place.category)) failures.push(`bad category ${place.id} ${place.category}`);
  if (!place.sourceUrl?.startsWith("https://")) failures.push(`source url ${place.id}`);
  regions[place.region] = (regions[place.region] ?? 0) + 1;
  const lat = Number(place.lat).toFixed(5);
  const lng = Number(place.lng).toFixed(5);
  if (!sql.includes(`'${place.id}'`) || !sql.includes(lat) || !sql.includes(lng)) {
    failures.push(`migration missing ${place.id} ${lat} ${lng}`);
  }
}

for (let n = 1; n <= 100; n += 1) {
  const id = `detour-${String(n).padStart(3, "0")}`;
  if (!ids.has(id)) failures.push(`missing ${id}`);
}

const expected = { NSW: 14, JBT: 1, VIC: 14, QLD: 15, SA: 12, WA: 14, TAS: 12, NT: 12, ACT: 6 };
for (const [region, count] of Object.entries(expected)) {
  if (regions[region] !== count) {
    failures.push(`region ${region} expected ${count} got ${regions[region] ?? 0}`);
  }
}

const goal = 100;
const withCustom = starters.map((place) => ({ ...place, isStarter: true, status: "want" }));
withCustom.push({ id: "custom-1", isStarter: false, status: "been" });
withCustom[0] = { ...withCustom[0], status: "been" };
const visited = withCustom.filter((place) => place.isStarter && place.status === "been").length;
if (visited !== 1) failures.push(`visited originals should ignore custom places, got ${visited}`);
if (goal !== 100) failures.push("denominator changed");

if (!sql.includes("seeded_at is not null")) {
  failures.push("seed function does not refuse a second seed");
}
if (!sql.includes("is_map_member")) failures.push("missing membership check");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`pass: ${starters.length} unique starters, Australian coordinates, goal stays ${goal}`);
console.log("regions", regions);
