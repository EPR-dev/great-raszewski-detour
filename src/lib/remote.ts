import type { SupabaseClient } from "@supabase/supabase-js";
import type { Place, VisitStatus } from "../types";

type PlaceRow = {
  id: string;
  map_id: string;
  name: string;
  lat: number;
  lng: number;
  region: string;
  category: string | null;
  note: string | null;
  status: VisitStatus;
  visit_date: string | null;
  visit_memory: string | null;
  next_up: boolean;
  is_starter: boolean;
  source_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Membership = {
  mapId: string;
  role: "owner" | "member";
  mapName: string;
};

function fromRow(row: PlaceRow): Place {
  return {
    id: row.id,
    name: row.name,
    lat: row.lat,
    lng: row.lng,
    region: row.region,
    category: row.category,
    note: row.note,
    status: row.status,
    visitDate: row.visit_date,
    visitMemory: row.visit_memory,
    nextUp: Boolean(row.next_up),
    isStarter: row.is_starter,
    sourceUrl: row.source_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(mapId: string, place: Place): Omit<PlaceRow, "created_at" | "updated_at"> {
  return {
    id: place.id,
    map_id: mapId,
    name: place.name,
    lat: place.lat,
    lng: place.lng,
    region: place.region,
    category: place.category,
    note: place.note,
    status: place.status,
    visit_date: place.visitDate,
    visit_memory: place.visitMemory,
    next_up: place.nextUp,
    is_starter: place.isStarter,
    source_url: place.sourceUrl,
  };
}

export async function fetchMembership(client: SupabaseClient): Promise<Membership | null> {
  const { data, error } = await client
    .from("map_members")
    .select("map_id, role")
    .order("created_at", { ascending: true })
    .limit(1);
  if (error) throw error;
  const member = data?.[0] as { map_id: string; role: "owner" | "member" } | undefined;
  if (!member) return null;
  const map = await client.from("family_maps").select("name").eq("id", member.map_id).single();
  if (map.error) throw map.error;
  return {
    mapId: member.map_id,
    role: member.role,
    mapName: (map.data as { name: string }).name,
  };
}

export async function createFamilyMap(client: SupabaseClient, name: string): Promise<string> {
  const { data, error } = await client.rpc("create_family_map", { map_name: name });
  if (error) throw error;
  return data as string;
}

export async function addFamilyMember(
  client: SupabaseClient,
  mapId: string,
  email: string,
): Promise<void> {
  const { error } = await client.rpc("add_map_member", {
    target_map: mapId,
    member_email: email,
  });
  if (error) throw error;
}

export async function seedFamilyMap(client: SupabaseClient, mapId: string): Promise<void> {
  const { error } = await client.rpc("seed_family_map", { target_map: mapId });
  if (error) throw error;
}

export async function fetchPlaces(client: SupabaseClient, mapId: string): Promise<Place[]> {
  const { data, error } = await client.from("places").select("*").eq("map_id", mapId);
  if (error) throw error;
  return ((data ?? []) as PlaceRow[])
    .map(fromRow)
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
}

export async function savePlace(
  client: SupabaseClient,
  mapId: string,
  place: Place,
): Promise<void> {
  const { error } = await client.from("places").upsert(toRow(mapId, place), {
    onConflict: "map_id,id",
  });
  if (error) throw error;
}

export async function deletePlace(
  client: SupabaseClient,
  mapId: string,
  id: string,
): Promise<void> {
  const { error } = await client.from("places").delete().eq("map_id", mapId).eq("id", id);
  if (error) throw error;
}
