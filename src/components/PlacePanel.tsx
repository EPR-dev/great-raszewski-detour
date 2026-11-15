import { useEffect, useState } from "react";
import type { Place } from "../types";
import { CATEGORIES, categoryClass } from "../lib/categories";
import { distanceKm, formatDistance, type MapPoint } from "../lib/distance";
import { CategoryMark } from "./CategoryLegend";
import { regionLabel } from "../lib/regions";

export function PlacePanel({
  place,
  justStamped,
  moving,
  onClose,
  onMadeIt,
  onUpdate,
  onRemove,
  onMove,
  origin,
  locationNote,
  onAskLocation,
}: {
  place: Place;
  justStamped: boolean;
  moving: boolean;
  onClose: () => void;
  onMadeIt: () => void;
  onUpdate: (place: Place) => void;
  onRemove: () => void;
  onMove: () => void;
  origin: MapPoint | null;
  locationNote: string | null;
  onAskLocation: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [name, setName] = useState(place.name);
  const [category, setCategory] = useState(place.category ?? "");
  const [note, setNote] = useState(place.note ?? "");
  const [visitDate, setVisitDate] = useState(place.visitDate ?? "");
  const [memory, setMemory] = useState(place.visitMemory ?? "");

  useEffect(() => {
    setEditing(false);
    setConfirming(false);
    setName(place.name);
    setCategory(place.category ?? "");
    setNote(place.note ?? "");
    setVisitDate(place.visitDate ?? "");
    setMemory(place.visitMemory ?? "");
  }, [place]);

  function saveEdits() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onUpdate({
      ...place,
      name: trimmed,
      category: category || null,
      note: note.trim() || null,
      updatedAt: new Date().toISOString(),
    });
    setEditing(false);
  }

  function saveNotes() {
    onUpdate({
      ...place,
      visitDate: visitDate || null,
      visitMemory: memory.trim() || null,
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <article className="postcard" data-testid="place-card">
      <header className="postcard-top">
        <p className={`cat-stamp ${categoryClass(place.category)}`}>
          <CategoryMark category={place.category} />
          {place.category ?? "Detour"}
        </p>
        <p className="postmark">{regionLabel(place.region)}</p>
        <button
          type="button"
          className="next-toggle"
          data-testid="next-up"
          aria-pressed={place.nextUp}
          onClick={() =>
            onUpdate({
              ...place,
              nextUp: !place.nextUp,
              updatedAt: new Date().toISOString(),
            })
          }
        >
          Next up
        </button>
        <button type="button" className="text-button" onClick={onClose}>
          Close
        </button>
      </header>
      <h2>{place.name}</h2>
      {origin ? (
        <p className="can-we-go" data-testid="can-we-go">
          Can we go there? {formatDistance(distanceKm(origin, place))}
        </p>
      ) : (
        <button type="button" className="secondary" data-testid="can-we-go" onClick={onAskLocation}>
          Can we go there?
        </button>
      )}
      {locationNote ? (
        <p className="hint" data-testid="location-note">
          {locationNote}
        </p>
      ) : null}
      {place.status === "been" ? (
        <p className={`been-stamp on-card${justStamped ? " is-fresh" : ""}`}>Been there</p>
      ) : null}

      {place.status === "want" ? (
        <button type="button" className="made-it" data-testid="made-it" onClick={onMadeIt}>
          We made it!
        </button>
      ) : (
        <form
          className="notes-form"
          onSubmit={(event) => {
            event.preventDefault();
            saveNotes();
          }}
        >
          <label className="field">
            <span>Visit date</span>
            <input
              type="date"
              value={visitDate}
              onChange={(event) => setVisitDate(event.target.value)}
            />
          </label>
          <label className="field">
            <span>Field notes from the back seat</span>
            <textarea
              value={memory}
              maxLength={280}
              rows={3}
              onChange={(event) => setMemory(event.target.value)}
              placeholder="Who fell asleep, what was eaten, what the kids voted for next."
            />
          </label>
          <button type="submit" className="secondary">
            Save field notes
          </button>
        </form>
      )}

      {place.note ? <p className="place-note">{place.note}</p> : null}
      {place.isStarter ? null : <p className="family-tag">Added by the family</p>}

      {moving ? <p className="hint">Tap the map to shift this detour.</p> : null}

      {editing ? (
        <form
          className="edit-form"
          onSubmit={(event) => {
            event.preventDefault();
            saveEdits();
          }}
        >
          <label className="field">
            <span>Name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} />
          </label>
          <label className="field">
            <span>Category</span>
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
            <span>Note</span>
            <textarea value={note} rows={3} maxLength={280} onChange={(event) => setNote(event.target.value)} />
          </label>
          <div className="button-row">
            <button type="submit" className="secondary">
              Save changes
            </button>
            <button type="button" className="text-button" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="button-row">
          <button type="button" className="secondary" onClick={() => setEditing(true)}>
            Edit
          </button>
          <button type="button" className="secondary" onClick={onMove}>
            {moving ? "Done moving" : "Move pin"}
          </button>
          <button type="button" className="text-button danger" onClick={() => setConfirming(true)}>
            Remove
          </button>
        </div>
      )}

      {place.sourceUrl ? (
        <p className="source-link">
          <a href={place.sourceUrl} target="_blank" rel="noreferrer">
            Official visitor info
          </a>
        </p>
      ) : null}

      {confirming ? (
        <div className="confirm" role="alertdialog" aria-labelledby="remove-title">
          <p id="remove-title">Take {place.name} off the map?</p>
          <div className="button-row">
            <button type="button" className="secondary" onClick={() => setConfirming(false)}>
              Keep it
            </button>
            <button type="button" className="danger-button" data-testid="confirm-remove" onClick={onRemove}>
              Remove
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
