import type { ApiResponse, Profile, ChatMessage, Role } from '../types';

const DEFAULT_BASE = 'http://localhost:8000/api/v1';

const BASE = (import.meta.env.VITE_API_BASE_URL as string) || DEFAULT_BASE;
const SEND_PATH = import.meta.env.VITE_API_SEND_PATH || '/ask';
const PROFILES_PATH = import.meta.env.VITE_PROFILES_PATH || '/profiles';
const SET_PROFILE_PATH = import.meta.env.VITE_SET_PROFILE_PATH || '/conversations/profile';

const historyUrl = (cid: string, limit = 1000) =>
  join(BASE, `/conversations/${encodeURIComponent(cid)}/history5`) + `?limit=${limit}`;

if (!import.meta.env.VITE_API_BASE_URL) {
  console.warn('VITE_API_BASE_URL is not set. Using default:', DEFAULT_BASE);
}

function join(base: string, path: string) {
  const b = base.replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

function normalizeProfile(p: any): Profile {
  const id = p?.id ?? p?.profile_id ?? p?.slug ?? p?.key ?? '';
  const name = p?.name ?? p?.title ?? p?.label ?? id;
  return { id, name };
}

function normalizeRole(roleRaw: any): Role {
  const r = String(roleRaw ?? '').toLowerCase();
  return (r === 'user' ? 'user' : 'assistant') as Role;
}

function normalizeMsg(m: any): ChatMessage {
  const role = normalizeRole(m?.role);
  const message = (m?.message ?? m?.content ?? '').toString();
  return { role, message };
}

export async function getProfiles(): Promise<Profile[]> {
  const url = join(BASE, PROFILES_PATH);
  const res = await fetch(url, { method: 'GET' });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to load profiles (${res.status}): ${text || res.statusText}`);
  }

  const raw = await res.json();
  const arr: any[] = Array.isArray(raw) ? raw : (raw?.profiles ?? raw?.items ?? []);
  return arr.map(normalizeProfile).filter(p => p.id);
}

export async function setProfile(profileId: string): Promise<void> {
  const url = join(BASE, SET_PROFILE_PATH);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ profile_id: profileId }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Could not apply profile (${res.status}): ${text || res.statusText}`);
  }
}


export async function sendMessage(
  conversationId: string | null,
  message: string
): Promise<ApiResponse> {
  const url = join(BASE, SEND_PATH);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversation_id: conversationId, message }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${text || res.statusText}`);
  }

  const data = (await res.json()) as ApiResponse;
  return data;
}

export async function getHistory(
  conversationId: string,
  limit = 1000
): Promise<ChatMessage[]> {
  const res = await fetch(historyUrl(conversationId, limit), { method: 'GET' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to load history (${res.status}): ${text || res.statusText}`);
  }
  const data = await res.json();
  const arr: any[] = Array.isArray(data?.message) ? data.message : [];
  return arr.map(normalizeMsg);
}

export async function sendAndReloadHistory(
  conversationId: string | null,
  message: string,
  limit = 1000
): Promise<{ api: ApiResponse; history: ChatMessage[] }> {
  const api = await sendMessage(conversationId, message);
  const cid = api?.conversation_id as string;
  const history = cid ? await getHistory(cid, limit) : [];
  return { api, history };
}
