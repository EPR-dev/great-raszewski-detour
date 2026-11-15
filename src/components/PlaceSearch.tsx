import { useMemo, useState } from "react";
import { matchesPlaceName } from "../lib/places";
import { regionLabel } from "../lib/regions";
import type { Place } from "../types";
import { CategoryMark } from "./CategoryLegend";

export function PlaceSearch({
  places,
  query,
  onQuery,
  onSelect,
}: {
  places: Place[];
  query: string;
  onQuery: (value: string) => void;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const matches = useMemo(() => {
    if (!query.trim()) return [];
    return places.filter((place) => matchesPlaceName(place, query)).slice(0, 8);
  }, [places, query]);

  return (
    <div className="search-slot">
      <label className="field map-search">
        <span>Search places</span>
        <input
          data-testid="place-search"
          type="search"
          enterKeyHint="search"
          placeholder="Uluru, Robertson Pie Shop…"
          value={query}
          autoComplete="off"
          onChange={(event) => {
            onQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
        />
      </label>
      {open && query.trim() ? (
        <ul className="search-results" data-testid="search-results" role="listbox">
          {matches.length === 0 ? (
            <li className="search-empty">No place on the map has that name. Add a detour if it's new.</li>
          ) : (
            matches.map((place) => (
              <li key={place.id}>
                <button
                  type="button"
                  role="option"
                  data-testid="search-hit"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onSelect(place.id);
                    setOpen(false);
                  }}
                >
                  <span
                    className={place.status === "been" ? "status-pin been" : "status-pin want"}
                    aria-hidden="true"
                  >
                    <CategoryMark category={place.category} />
                    {place.status === "been" ? <span className="status-tick">✓</span> : null}
                  </span>
                  <span className="row-copy">
                    <span className="row-name">{place.name}</span>
                    <span className="row-meta">
                      {regionLabel(place.region)} · {place.category ?? "Detour"}
                    </span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
