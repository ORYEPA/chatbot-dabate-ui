import type { ApiResponse, Profile } from '../types';

const BASE = import.meta.env.VITE_API_BASE_URL as string;
const SEND_PATH = import.meta.env.VITE_API_SEND_PATH || '/chat';

const PROFILES_PATH = import.meta.env.VITE_PROFILES_PATH || '/profiles';
const SET_PROFILE_PATH = import.meta.env.VITE_SET_PROFILE_PATH || '/conversations/profile';

if (!BASE) {
  console.warn('VITE_API_BASE_URL no está definido. Configúralo en .env');
}

function normalizeProfile(p: any): Profile {
  const id = p?.id ?? p?.profile_id ?? p?.slug ?? p?.key ?? '';
  const name = p?.name ?? p?.title ?? p?.label ?? id;
  return { id, name };
}

export async function getProfiles(): Promise<Profile[]> {
  const url = `${BASE}${PROFILES_PATH}`;
  const res = await fetch(url, { method: 'GET' });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`No se pudieron cargar perfiles (${res.status}): ${text || res.statusText}`);
  }

  const raw = await res.json();
  const arr: any[] = Array.isArray(raw) ? raw : (raw?.profiles ?? raw?.items ?? []);
  return arr.map(normalizeProfile).filter(p => p.id);
}

export async function setProfile(profileId: string): Promise<void> {
  const url = `${BASE}${SET_PROFILE_PATH}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ profile_id: profileId }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`No se pudo aplicar el perfil (${res.status}): ${text || res.statusText}`);
  }
}

export async function sendMessage(
  conversationId: string | null,
  message: string
): Promise<ApiResponse> {
  const url = `${BASE}${SEND_PATH}`;

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
