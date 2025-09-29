// src/lib/demoStore.ts
export type DemoUser = { 
  id: string; 
  email: string; 
  name: string; 
  department?: string; 
  supervisor?: string; 
  isAdmin?: boolean 
};

export type DemoAsset = {
  id: string; 
  type: "IMAGE"|"VIDEO"; 
  title?: string; 
  description?: string; 
  blobPathRaw: string; 
  likeCount: number;
  ownerId: string; 
  ownerNameAtUpload: string; 
  ownerDepartmentAtUpload?: string|null; 
  ownerSupervisorAtUpload?: string|null; 
  createdAt: number;
};

export type DemoBallot = { 
  id: string; 
  userId: string; 
  category: "IMAGE"|"VIDEO"; 
  status: "DRAFT"|"SUBMITTED"; 
  items: string[]; 
  submittedAt?: number 
};

type Store = {
  users: Map<string, DemoUser>;
  assets: Map<string, DemoAsset>;
  ballots: Map<string, DemoBallot>;
  votes: Set<string>; // `${userId}:${assetId}`
};

const g = globalThis as any;
export const demoDb: Store =
  g.__SHE_DEMO_DB__ ?? (g.__SHE_DEMO_DB__ = {
    users: new Map(),
    assets: new Map(),
    ballots: new Map(),
    votes: new Set(),
  });