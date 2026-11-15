import { useEffect, useState } from "react";
import { PHOTO_LIMIT, PHOTO_LIMIT_MESSAGE, type PhotoAlbum, type SavedPhoto } from "../lib/photos";

function release(photos: SavedPhoto[]) {
  for (const photo of photos) {
    if (photo.url.startsWith("blob:")) URL.revokeObjectURL(photo.url);
  }
}

export function PhotoStrip({ placeId, album }: { placeId: string; album: PhotoAlbum }) {
  const [photos, setPhotos] = useState<SavedPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    let current: SavedPhoto[] = [];
    setMessage(null);
    setPhotos([]);
    album
      .list(placeId)
      .then((next) => {
        if (cancel) {
          release(next);
          return;
        }
        current = next;
        setPhotos(next);
      })
      .catch((error: unknown) => {
        if (!cancel) setMessage(error instanceof Error ? error.message : "Could not load photos");
      });
    return () => {
      cancel = true;
      release(current);
    };
  }, [album, placeId]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (photos.length >= PHOTO_LIMIT) {
      setMessage(PHOTO_LIMIT_MESSAGE);
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await album.add(placeId, file);
      const next = await album.list(placeId);
      setPhotos((current) => {
        release(current);
        return next;
      });
      if (next.length >= PHOTO_LIMIT) setMessage(PHOTO_LIMIT_MESSAGE);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : PHOTO_LIMIT_MESSAGE);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="photo-strip" data-testid="photo-strip">
      <div className="photo-head">
        <h3>Photos</h3>
        <span>
          {photos.length} of {PHOTO_LIMIT}
        </span>
      </div>
      {message ? (
        <p className="hint warn" data-testid="photo-limit">
          {message}
        </p>
      ) : null}
      {photos.length > 0 ? (
        <ul className="photo-grid">
          {photos.map((photo) => (
            <li key={photo.id}>
              <img src={photo.url} alt="" data-testid="place-photo" />
            </li>
          ))}
        </ul>
      ) : (
        <p className="hint">Add a photo from the visit. Ten is the limit.</p>
      )}
      <label className={`secondary photo-add${busy ? " is-busy" : ""}`}>
        {busy ? "Saving photo…" : "Add a photo"}
        <input
          type="file"
          accept="image/*"
          data-testid="photo-input"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            void onFile(file);
          }}
        />
      </label>
    </section>
  );
}
