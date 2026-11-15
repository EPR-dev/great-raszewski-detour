export const PHOTO_LIMIT = 10;
export const PHOTO_LIMIT_MESSAGE = "10 photos is the limit";

export type SavedPhoto = {
  id: string;
  url: string;
};

export type PhotoAlbum = {
  list(placeId: string): Promise<SavedPhoto[]>;
  add(placeId: string, file: File): Promise<void>;
  removePlace(placeId: string): Promise<void>;
};

const DB_NAME = "grd.photos.v1";
const STORE = "photos";

type PhotoRecord = {
  id: string;
  placeId: string;
  createdAt: string;
  blob: Blob;
};

export async function compressPhoto(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose a photo.");
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("That photo could not be read. Try another.");
  }
  const maxEdge = 960;
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("That photo could not be read. Try another.");
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((next) => resolve(next), "image/jpeg", 0.68);
  });
  if (!blob) throw new Error("That photo could not be read. Try another.");
  return blob;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("placeId", "placeId", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open photo storage"));
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not read photos"));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not save that photo"));
    transaction.onabort = () => reject(transaction.error ?? new Error("Could not save that photo"));
  });
}

export function demoAlbum(): PhotoAlbum {
  return {
    async list(placeId) {
      const db = await openDb();
      const records = await requestToPromise(
        db.transaction(STORE).objectStore(STORE).index("placeId").getAll(placeId),
      );
      db.close();
      return (records as PhotoRecord[])
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map((record) => ({
          id: record.id,
          url: URL.createObjectURL(record.blob),
        }));
    },
    async add(placeId, file) {
      const db = await openDb();
      const existing = await requestToPromise(
        db.transaction(STORE).objectStore(STORE).index("placeId").getAllKeys(placeId),
      );
      if (existing.length >= PHOTO_LIMIT) {
        db.close();
        throw new Error(PHOTO_LIMIT_MESSAGE);
      }
      const blob = await compressPhoto(file);
      const record: PhotoRecord = {
        id: crypto.randomUUID(),
        placeId,
        createdAt: new Date().toISOString(),
        blob,
      };
      const transaction = db.transaction(STORE, "readwrite");
      transaction.objectStore(STORE).add(record);
      await transactionDone(transaction);
      db.close();
    },
    async removePlace(placeId) {
      const db = await openDb();
      const keys = await requestToPromise(
        db.transaction(STORE).objectStore(STORE).index("placeId").getAllKeys(placeId),
      );
      if (keys.length === 0) {
        db.close();
        return;
      }
      const transaction = db.transaction(STORE, "readwrite");
      const store = transaction.objectStore(STORE);
      for (const key of keys) store.delete(key);
      await transactionDone(transaction);
      db.close();
    },
  };
}
