import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { AddDetour } from "./components/AddDetour";
import { AuthScreen, JoinScreen } from "./components/AuthScreens";
import { CategoryLegend } from "./components/CategoryLegend";
import { EmptyBeen } from "./components/EmptyState";
import { HeaderTrip } from "./components/HeaderTrip";
import { MapView } from "./components/MapView";
import { PlaceList } from "./components/PlaceList";
import { PlacePanel } from "./components/PlacePanel";
import { PlaceSearch } from "./components/PlaceSearch";
import { loadDemoPlaces, saveDemoPlaces } from "./lib/demoStore";
import { demoAlbum, type PhotoAlbum } from "./lib/photos";
import { messageOf } from "./lib/search";
import { askBrowserLocation, LOCATION_OFF, type MapPoint } from "./lib/distance";
import { matchesPlaceName, matchesStatus, matchesType, newCustomPlace } from "./lib/places";
import { ORIGINAL_GOAL, originalVisited } from "./lib/progress";
import { isOnTheMap, regionFromPoint } from "./lib/regions";
import {
  addFamilyMember,
  createFamilyMap,
  deletePlace,
  fetchMembership,
  fetchPlaces,
  savePlace,
  seedFamilyMap,
  supabaseAlbum,
  type Membership,
} from "./lib/remote";
import type { LatLng, Place, StatusFilter } from "./types";

function useWideScreen(): boolean {
  const [wide, setWide] = useState(() => window.matchMedia("(min-width: 960px)").matches);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 960px)");
    const onChange = () => setWide(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return wide;
}

function MapShell({
  demo,
  places,
  notice,
  account,
  onSave,
  onDelete,
  album,
}: {
  demo: boolean;
  places: Place[];
  notice: string | null;
  account: {
    email: string;
    role: "owner" | "member";
    onSignOut: () => void;
    onAddMember: (email: string) => Promise<void>;
  } | null;
  onSave: (place: Place) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  album: PhotoAlbum;
}) {
  const wide = useWideScreen();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [dropMode, setDropMode] = useState(false);
  const [draft, setDraft] = useState<LatLng | null>(null);
  const [draftFly, setDraftFly] = useState(0);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [undoPlace, setUndoPlace] = useState<Place | null>(null);
  const [stampedId, setStampedId] = useState<string | null>(null);
  const [robertsonToken, setRobertsonToken] = useState(0);
  const [focusToken, setFocusToken] = useState(0);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberNote, setMemberNote] = useState<string | null>(null);
  const [origin, setOrigin] = useState<MapPoint | null>(null);
  const [closest, setClosest] = useState(false);
  const [locationNote, setLocationNote] = useState<string | null>(null);

  async function allowLocation(): Promise<MapPoint | null> {
    const point = await askBrowserLocation();
    if (!point) {
      setClosest(false);
      setLocationNote(LOCATION_OFF);
      return null;
    }
    setOrigin(point);
    setLocationNote(null);
    return point;
  }

  async function toggleClosest() {
    if (closest) {
      setClosest(false);
      return;
    }
    const point = origin ?? (await allowLocation());
    if (!point) return;
    setClosest(true);
  }

  const selected = places.find((place) => place.id === selectedId) ?? null;
  const visible = places.filter(
    (place) =>
      matchesStatus(place, filter) && matchesType(place, typeFilter) && matchesPlaceName(place, query),
  );
  const beenCount = places.filter((place) => place.status === "been").length;
  const showEmptyBeen =
    !listOpen && filter === "been" && !typeFilter && beenCount === 0 && !selected && !addOpen;
  const listExpanded = listOpen && !wide;

  useEffect(() => {
    if (wide) setListOpen(false);
  }, [wide]);
  const activeFilters =
    (filter !== "all" ? 1 : 0) + (typeFilter ? 1 : 0) + (query.trim() ? 1 : 0);

  const onSelectPin = useCallback((id: string) => {
    setSelectedId(id);
    setAddOpen(false);
    setDropMode(false);
    setListOpen(false);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!undoPlace) return;
    const timer = window.setTimeout(() => setUndoPlace(null), 12000);
    return () => window.clearTimeout(timer);
  }, [undoPlace]);

  useEffect(() => {
    if (!stampedId) return;
    const timer = window.setTimeout(() => setStampedId(null), 1700);
    return () => window.clearTimeout(timer);
  }, [stampedId]);

  useEffect(() => {
    if (!filtersOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFiltersOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtersOpen]);

  async function save(place: Place) {
    try {
      await onSave(place);
    } catch (error) {
      setToast(messageOf(error));
    }
  }

  function selectFromList(id: string) {
    setSelectedId(id);
    setAddOpen(false);
    setDropMode(false);
    setFocusToken((token) => token + 1);
    setListOpen(false);
  }

  function chooseFromSearch(id: string) {
    const place = places.find((item) => item.id === id);
    if (place && !matchesStatus(place, filter)) setFilter("all");
    if (place && typeFilter && place.category !== typeFilter) setTypeFilter(null);
    setFiltersOpen(false);
    selectFromList(id);
  }

  function pick(point: LatLng) {
    if (!isOnTheMap(point.lat, point.lng)) {
      setToast("That pin is off the edge of the map. Try somewhere in Australia.");
      return;
    }
    if (movingId) {
      const place = places.find((item) => item.id === movingId);
      if (!place) return;
      void save({
        ...place,
        lat: point.lat,
        lng: point.lng,
        region: regionFromPoint(point.lat, point.lng),
        updatedAt: new Date().toISOString(),
      });
      setMovingId(null);
      setToast("Pin shifted.");
      return;
    }
    setDraft(point);
  }

  let dock: ReactNode = null;
  if (addOpen) {
    dock = (
      <AddDetour
        places={places}
        draft={draft}
        dropMode={dropMode}
        onDropMode={setDropMode}
        onPlacePin={(point) => {
          setDraft(point);
          setDropMode(false);
          setListOpen(false);
          setDraftFly((token) => token + 1);
        }}
        onClose={() => {
          setAddOpen(false);
          setDropMode(false);
          setDraft(null);
        }}
        onSelectExisting={selectFromList}
        onSave={async (input) => {
          const place = newCustomPlace(input);
          try {
            await onSave(place);
            setToast("On the list. How far could it be?");
            setSelectedId(place.id);
            setAddOpen(false);
            setDropMode(false);
            setDraft(null);
            setListOpen(false);
            setFocusToken((token) => token + 1);
          } catch (error) {
            setToast(messageOf(error));
          }
        }}
      />
    );
  } else if (listOpen || (wide && !selected)) {
    dock = (
      <PlaceList
        places={places}
        filter={filter}
        typeFilter={typeFilter}
        query={query}
        selectedId={selectedId}
        onSelect={selectFromList}
        onMemory={(id, memory) => {
          const place = places.find((item) => item.id === id);
          if (!place || (place.visitMemory ?? null) === memory) return;
          void save({
            ...place,
            visitMemory: memory,
            updatedAt: new Date().toISOString(),
          });
        }}
        origin={origin}
        closest={closest}
        locationNote={locationNote}
        onClosest={() => void toggleClosest()}
      />
    );
  } else if (selected) {
    dock = (
      <PlacePanel
        place={selected}
        justStamped={stampedId === selected.id}
        moving={movingId === selected.id}
        onClose={() => {
          setSelectedId(null);
          setMovingId(null);
        }}
        onMadeIt={() => {
          const snapshot = selected;
          void save({
            ...selected,
            status: "been",
            nextUp: false,
            updatedAt: new Date().toISOString(),
          });
          setUndoPlace(snapshot);
          setStampedId(selected.id);
        }}
        onUpdate={(place) => void save(place)}
        onRemove={() => {
          void onDelete(selected.id)
            .then(() => {
              setSelectedId(null);
              setMovingId(null);
            })
            .catch((error: unknown) => setToast(messageOf(error)));
        }}
        onMove={() => setMovingId((current) => (current === selected.id ? null : selected.id))}
        origin={origin}
        locationNote={locationNote}
        onAskLocation={() => void allowLocation()}
        album={album}
      />
    );
  }

  return (
    <div className={addOpen ? "app is-adding" : "app"}>
      {demo ? (
        <p className="demo-banner" data-testid="demo-banner">
          Demo mode · saved in this browser
        </p>
      ) : null}
      {notice ? <p className="demo-banner">{notice}</p> : null}
      <header className="top">
        <HeaderTrip />
        <div className="top-bar">
          <div className="brand">
            <h1 className="motel-sign">
              <span>The Great</span>
              <span>Raszewski Detour</span>
            </h1>
            <p className="tagline">Australia, one wildly optimistic detour at a time.</p>
          </div>
          <p className="progress" data-testid="progress">
            <strong>
              {originalVisited(places)} of {ORIGINAL_GOAL}
            </strong>
            <span>original detours visited</span>
          </p>
          <button
            type="button"
            className={`filters-toggle${filtersOpen ? " is-open" : ""}`}
            aria-expanded={filtersOpen}
            aria-controls="map-filters"
            data-testid="filters-toggle"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            {filtersOpen ? "Hide filters" : "Filters"}
            {activeFilters > 0 ? (
              <span className="filters-count" data-testid="filters-count">
                {activeFilters}
              </span>
            ) : null}
          </button>
          {wide ? null : (
            <button
              type="button"
              className={`filters-toggle${listOpen ? " is-open" : ""}`}
              aria-expanded={listOpen}
              data-testid="list-toggle"
              onClick={() => setListOpen((open) => !open)}
            >
              {listOpen ? "Close list" : "List"}
            </button>
          )}
          {account ? (
            <details className="account">
              <summary>{account.email}</summary>
              <div className="account-body">
                {account.role === "owner" ? (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      void account
                        .onAddMember(memberEmail.trim())
                        .then(() => {
                          setMemberNote("They're on the map.");
                          setMemberEmail("");
                        })
                        .catch((error: unknown) => setMemberNote(messageOf(error)));
                    }}
                  >
                    <label className="field">
                      <span>Add a family member</span>
                      <input
                        type="email"
                        value={memberEmail}
                        required
                        placeholder="Email they signed up with"
                        onChange={(event) => setMemberEmail(event.target.value)}
                      />
                    </label>
                    <button type="submit" className="secondary">
                      Add them
                    </button>
                  </form>
                ) : (
                  <p className="hint">You're on the family map.</p>
                )}
                {memberNote ? <p className="hint">{memberNote}</p> : null}
                <button type="button" className="text-button" onClick={account.onSignOut}>
                  Sign out
                </button>
              </div>
            </details>
          ) : null}
        </div>
      </header>
      <div className={`stage${listExpanded ? " is-list" : ""}${filtersOpen ? " filters-open" : ""}`}>
        {filtersOpen ? (
          <section className="filter-drawer" id="map-filters" aria-label="Search and filters" data-testid="filter-drawer">
            <div className="filter-drawer-head">
              <p className="legend-title">Search and filters</p>
              <button type="button" className="text-button" data-testid="filters-close" onClick={() => setFiltersOpen(false)}>
                Close
              </button>
            </div>
            <PlaceSearch places={places} query={query} onQuery={setQuery} onSelect={chooseFromSearch} />
            <CategoryLegend
              selected={typeFilter}
              onToggle={(category) => setTypeFilter((current) => (current === category ? null : category))}
            />
            <div className="segment status-filter" role="group" aria-label="Filter detours">
              {(
                [
                  ["all", "All"],
                  ["next", "Next up"],
                  ["been", "Been there"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>
        ) : null}
        <MapView
          places={visible}
          selectedId={selectedId}
          draft={draft}
          draftFly={draftFly}
          pickArmed={dropMode || movingId !== null}
          robertsonToken={robertsonToken}
          focusToken={focusToken}
          focusPlace={selected}
          onSelect={onSelectPin}
          onPick={pick}
          onRobertson={() => {
            setListOpen(false);
            setRobertsonToken((token) => token + 1);
          }}
        />
        {showEmptyBeen ? (
          <div className="map-empty">
            <EmptyBeen />
          </div>
        ) : null}
        {dock ? <aside className="dock">{dock}</aside> : null}
      </div>
      <div className="action-bar">
        <button
          type="button"
          className="add-button"
          data-testid="add-detour"
          onClick={() => {
            setAddOpen(true);
            setFiltersOpen(false);
            setListOpen(false);
            setMovingId(null);
            setSelectedId(null);
            setDraft(null);
            setDropMode(false);
          }}
        >
          Add a detour
        </button>
      </div>
      <div className="toasts" aria-live="polite">
        {undoPlace ? (
          <div className="toast">
            <span>Stamped. It's a been-there.</span>
            <button type="button" data-testid="undo" onClick={() => {
              void save(undoPlace);
              setUndoPlace(null);
              setStampedId(null);
            }}>
              Undo
            </button>
          </div>
        ) : null}
        {toast ? (
          <div className="toast" data-testid="toast">
            {toast}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DemoApp() {
  const [places, setPlaces] = useState<Place[] | null>(null);
  const placesRef = useRef<Place[]>([]);
  const album = useMemo(() => demoAlbum(), []);

  useEffect(() => {
    const loaded = loadDemoPlaces();
    placesRef.current = loaded;
    setPlaces(loaded);
  }, []);

  const onSave = useCallback(async (place: Place) => {
    const previous = placesRef.current;
    const exists = previous.some((item) => item.id === place.id);
    const next = exists
      ? previous.map((item) => (item.id === place.id ? place : item))
      : [...previous, place];
    placesRef.current = next;
    setPlaces(next);
    try {
      saveDemoPlaces(next);
    } catch (error) {
      placesRef.current = previous;
      setPlaces(previous);
      throw error;
    }
  }, []);

  const onDelete = useCallback(async (id: string) => {
    const previous = placesRef.current;
    const next = previous.filter((place) => place.id !== id);
    placesRef.current = next;
    setPlaces(next);
    try {
      saveDemoPlaces(next);
    } catch (error) {
      placesRef.current = previous;
      setPlaces(previous);
      throw error;
    }
    try {
      await album.removePlace(id);
    } catch {
      // The detour is already gone. A leftover photo stays in this browser.
    }
  }, [album]);

  if (!places) {
    return (
      <main className="gate">
        <p>Unfolding the map…</p>
      </main>
    );
  }

  return (
    <MapShell
      demo
      places={places}
      notice={null}
      account={null}
      onSave={onSave}
      onDelete={onDelete}
      album={album}
    />
  );
}

function SharedApp({ client }: { client: SupabaseClient }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [membership, setMembership] = useState<Membership | null | undefined>(undefined);
  const [places, setPlaces] = useState<Place[]>([]);
  const [ready, setReady] = useState(false);
  const [gateMessage, setGateMessage] = useState<string | null>(null);
  const [gateBusy, setGateBusy] = useState(false);
  const placesRef = useRef<Place[]>([]);
  const userId = session?.user.id ?? null;
  const album = useMemo(
    () => (membership ? supabaseAlbum(client, membership.mapId) : demoAlbum()),
    [client, membership],
  );

  useEffect(() => {
    void client.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = client.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, [client]);

  useEffect(() => {
    if (!userId) return;
    let cancel = false;
    setMembership(undefined);
    fetchMembership(client)
      .then((found) => {
        if (!cancel) setMembership(found);
      })
      .catch((error: unknown) => {
        if (!cancel) {
          setMembership(null);
          setGateMessage(messageOf(error));
        }
      });
    return () => {
      cancel = true;
    };
  }, [client, userId]);

  useEffect(() => {
    if (!membership) return;
    let cancel = false;
    setReady(false);
    void (async () => {
      try {
        await seedFamilyMap(client, membership.mapId);
        const loaded = await fetchPlaces(client, membership.mapId);
        if (cancel) return;
        placesRef.current = loaded;
        setPlaces(loaded);
        setReady(true);
      } catch (error) {
        if (cancel) return;
        setGateMessage(messageOf(error));
        setReady(true);
      }
    })();

    const channel = client
      .channel(`places-${membership.mapId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "places",
          filter: `map_id=eq.${membership.mapId}`,
        },
        () => {
          void fetchPlaces(client, membership.mapId)
            .then((loaded) => {
              placesRef.current = loaded;
              setPlaces(loaded);
            })
            .catch(() => {
              // The next successful load will catch up.
            });
        },
      )
      .subscribe();

    return () => {
      cancel = true;
      void client.removeChannel(channel);
    };
  }, [client, membership]);

  const onSave = useCallback(
    async (place: Place) => {
      if (!membership) return;
      const previous = placesRef.current;
      const exists = previous.some((item) => item.id === place.id);
      const next = exists
        ? previous.map((item) => (item.id === place.id ? place : item))
        : [...previous, place];
      placesRef.current = next;
      setPlaces(next);
      try {
        await savePlace(client, membership.mapId, place);
      } catch (error) {
        placesRef.current = previous;
        setPlaces(previous);
        throw error;
      }
    },
    [client, membership],
  );

  const onDelete = useCallback(
    async (id: string) => {
      if (!membership) return;
      const previous = placesRef.current;
      const next = previous.filter((place) => place.id !== id);
      placesRef.current = next;
      setPlaces(next);
      try {
        await deletePlace(client, membership.mapId, id);
      } catch (error) {
        placesRef.current = previous;
        setPlaces(previous);
        throw error;
      }
      try {
        await album.removePlace(id);
      } catch {
        // The detour row is already gone. Storage cleanup can be retried later.
      }
    },
    [album, client, membership],
  );

  if (session === undefined || (session && membership === undefined) || (membership && !ready)) {
    return (
      <main className="gate">
        <p>Unfolding the map…</p>
      </main>
    );
  }
  if (!session) return <AuthScreen client={client} />;
  if (!membership) {
    return (
      <JoinScreen
        email={session.user.email ?? "this account"}
        busy={gateBusy}
        message={gateMessage}
        onRefresh={() => {
          setMembership(undefined);
          setUserRefresh();
        }}
        onSignOut={() => void client.auth.signOut()}
        onCreate={(name) => {
          setGateBusy(true);
          setGateMessage(null);
          void createFamilyMap(client, name)
            .then(() => fetchMembership(client))
            .then((found) => setMembership(found))
            .catch((error: unknown) => setGateMessage(messageOf(error)))
            .finally(() => setGateBusy(false));
        }}
      />
    );
  }

  return (
    <MapShell
      demo={false}
      places={places}
      notice={gateMessage}
      onSave={onSave}
      onDelete={onDelete}
      album={album}
      account={{
        email: session.user.email ?? "Signed in",
        role: membership.role,
        onSignOut: () => void client.auth.signOut(),
        onAddMember: (email) => addFamilyMember(client, membership.mapId, email),
      }}
    />
  );

  function setUserRefresh() {
    void fetchMembership(client)
      .then((found) => setMembership(found))
      .catch((error: unknown) => {
        setMembership(null);
        setGateMessage(messageOf(error));
      });
  }
}

export function App() {
  const client = useMemo(() => {
    const url = import.meta.env.VITE_SUPABASE_URL?.trim();
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
    if (!url || !key) return null;
    return createClient(url, key);
  }, []);

  if (!client) return <DemoApp />;
  return <SharedApp client={client} />;
}
