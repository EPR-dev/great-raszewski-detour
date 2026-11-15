export type VisitStatus = "want" | "been";

export type Starter = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  region: string;
  category: string;
  note: string;
  sourceUrl: string;
};

export type Place = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  region: string;
  category: string | null;
  note: string | null;
  status: VisitStatus;
  nextUp: boolean;
  visitDate: string | null;
  visitMemory: string | null;
  isStarter: boolean;
  sourceUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StatusFilter = "all" | "next" | "been";

export type LatLng = {
  lat: number;
  lng: number;
};
