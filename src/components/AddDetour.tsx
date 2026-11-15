import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { LatLng, Place } from "../types";
import { CATEGORIES } from "../lib/categories";
import { knownPlaceLine, placesMatchingQuery } from "../lib/places";
import { isOnTheMap, regionFromPoint, regionLabel } from "../lib/regions";
import { geocodeConfig, isAlreadyOnTheMap, searchPlaces, type SearchHit } from "../lib/search";

export function AddDetour({
  places,
  draft,
  dropMode,
  onDropMode,
  onPlacePin,
  onSave,
  onSelectExisting,
  onClose,
}: {
  places: Place[];
  draft: LatLng | null;
  dropMode: boolean;
  onDropMode: (armed: boolean) => void;
  onPlacePin: (point: LatLng) => void;
  onSave: (input: {
    name: string;
    lat: number;
    lng: number;
    region: string;
    category: string | null;
    note: string | null;
  }) => void;
  onSelectExisting: (id: string) => void;
  onClose: () => void;
}) {
  const config = useMemo(() => geocodeConfig(), []);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [settledQuery, setSettledQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [chosen, setChosen] = useState<LatLng | null>(draft);
  const [region, setRegion] = useState(draft ? regionFromPoint(draft.lat, draft.lng) : "");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!draft) return;
    setChosen(draft);
    setRegion(regionFromPoint(draft.lat, draft.lng));
  }, [draft]);

  useEffect(() => {
    if (config.mode !== "autocomplete") return;
    const q = query.trim();
    if (q.length < 3) {
      setHits([]);
      setSettledQuery(q);
      setSearchError(null);
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSearching(true);
      searchPlaces(q, controller.signal)
        .then((next) => {
          if (controller.signal.aborted) return;
          setHits(next);
          setSettledQuery(q);
          setSearchError(null);
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          if (error instanceof DOMException && error.name === "AbortError") return;
          setHits([]);
          setSettledQuery(q);
          setSearchError("The directory didn't answer. Drop a pin on the map and name it.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, 450);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [config.mode, query]);

  const localMatches = useMemo(() => placesMatchingQuery(places, query), [places, query]);
  const directoryHits = useMemo(
    () => hits.filter((hit) => !isAlreadyOnTheMap(hit, places)),
    [hits, places],
  );

  function chooseHit(hit: SearchHit) {
    const point = { lat: hit.lat, lng: hit.lng };
    setChosen(point);
    setRegion(hit.region);
    setName(hit.name);
    setHits([]);
    setQuery("");
    onDropMode(false);
    onPlacePin(point);
    window.setTimeout(() => {
      document.querySelector("[data-testid=pin-summary]")?.scrollIntoView({ block: "nearest" });
    }, 50);
  }

  async function submitSearch(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    if (q.length < 3) return;
    setSearching(true);
    setSearchError(null);
    try {
      const next = await searchPlaces(q, new AbortController().signal);
      setHits(next);
      if (next.length === 0) {
        setSearchError("No matches. Drop a pin on the map and name it.");
      }
    } catch {
      setHits([]);
      setSearchError("The directory didn't answer. Drop a pin on the map and name it.");
    } finally {
      setSearching(false);
    }
  }

  function save(event: FormEvent) {
    event.preventDefault();
    if (!chosen || !name.trim()) return;
    if (!isOnTheMap(chosen.lat, chosen.lng)) {
      setSearchError("That pin is off the edge of the map. Drop it on Australia.");
      return;
    }
    onSave({
      name: name.trim(),
      lat: chosen.lat,
      lng: chosen.lng,
      region: region || regionFromPoint(chosen.lat, chosen.lng),
      category: category || null,
      note: note.trim() || null,
    });
  }

  return (
    <div className="add-panel">
      <div className="panel-head">
        <h2>Add a detour</h2>
        <button type="button" className="text-button" onClick={onClose}>
          Close
        </button>
      </div>
      <form
        className="add-search"
        onSubmit={config.mode === "submit" ? submitSearch : (event) => event.preventDefault()}
      >
        <label className="field">
          <span>Search for a place</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={config.mode === "off" ? "Search is off" : "Uluru, Robertson, a bakery…"}
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            autoFocus={config.mode !== "off" && window.matchMedia("(min-width: 960px)").matches}
            disabled={config.mode === "off"}
            data-testid="detour-search"
          />
        </label>
        <p className="hint" data-testid="search-fallback">
          If this search is off or fails, tap the map and name the pin.
        </p>
        {config.mode === "submit" ? (
          <button type="submit" className="secondary" disabled={searching || query.trim().length < 3}>
            {searching ? "Searching…" : "Search"}
          </button>
        ) : config.mode === "autocomplete" ? (
          <p className="hint" data-testid="search-status">
            {searching ? "Looking…" : "Type at least three letters."}
          </p>
        ) : null}
      </form>
      {config.mode !== "off" ? (
        <p className="fine-print">Place search © OpenStreetMap contributors</p>
      ) : null}
      {searchError ? <p className="hint warn">{searchError}</p> : null}

      {localMatches.length > 0 || directoryHits.length > 0 ? (
        <ul className="hit-list" data-testid="add-results" data-query={settledQuery.trim().toLowerCase()}>
          {localMatches.map((place) => (
            <li key={place.id}>
              <button type="button" className="is-known" data-testid="known-hit" onClick={() => onSelectExisting(place.id)}>
                {place.name}
                <span>{knownPlaceLine(place.name, regionLabel(place.region), query)}</span>
              </button>
            </li>
          ))}
          {directoryHits.map((hit) => (
            <li key={`${hit.label}-${hit.lat}`}>
              <button type="button" data-testid="geocode-hit" onClick={() => chooseHit(hit)}>
                {hit.label}
                <span>{regionLabel(hit.region)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        className={dropMode ? "secondary is-on" : "secondary"}
        onClick={() => onDropMode(!dropMode)}
        data-testid="drop-pin"
      >
        {dropMode ? "Tap the map…" : "Drop a pin on the map"}
      </button>

      <form onSubmit={save} className="save-form">
        <label className="field">
          <span>Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={80}
            placeholder="Name this detour"
            data-testid="detour-name"
          />
        </label>
        <p className="hint" data-testid="pin-summary">
          {chosen
            ? `Pin ready · ${regionLabel(region)} · ${chosen.lat.toFixed(3)}, ${chosen.lng.toFixed(3)}`
            : "A name and a location are the only requirements."}
        </p>
        <label className="field">
          <span>Category, if you like</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">No category</option>
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Note, if you like</span>
          <textarea
            value={note}
            rows={2}
            maxLength={280}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Why this one?"
          />
        </label>
        <button type="submit" className="made-it" disabled={!chosen || !name.trim()} data-testid="save-detour">
          Add this detour
        </button>
      </form>
    </div>
  );
}
