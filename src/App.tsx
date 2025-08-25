import { useEffect, useMemo, useRef, useState } from 'react';
import { PlusCircle, User as UserIcon, ClipboardCopy } from 'lucide-react';
import MessageBubble from './components/MessageBubble';
import { sendMessage, getProfiles, setProfile } from './lib/api';
import type { ChatMessage, Profile } from './types';

export default function App() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [profilesError, setProfilesError] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string>('');  

  const endRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => endRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages, loading]);

  useEffect(() => {
    const lastId = localStorage.getItem('debate:lastConversationId');
    if (lastId) setConversationId(lastId);
  }, []);
  useEffect(() => {
    if (conversationId) localStorage.setItem('debate:lastConversationId', conversationId);
    else localStorage.removeItem('debate:lastConversationId');
  }, [conversationId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setProfilesLoading(true);
      setProfilesError(null);
      try {
        const list = await getProfiles();
        if (!mounted) return;

        setProfiles(list);

        const saved = localStorage.getItem('debate:lastProfileId');
        const initial =
          (saved && list.some(p => p.id === saved) && saved) ||
          (list[0]?.id ?? '');

        setProfileId(initial);

        if (initial) {
          try { await setProfile(initial); } catch { /* ignore inicial */ }
        }
      } catch (e: any) {
        if (!mounted) return;
        setProfilesError(e?.message || 'Error cargando perfiles');

        const fallback: Profile[] = [
          { id: 'general', name: 'General' },
          { id: 'rude_arrogant', name: 'Rude & Arrogant' },
        ];
        setProfiles(fallback);
        setProfileId(fallback[0].id);
        try { await setProfile(fallback[0].id); } catch { /* ignore */ }
      } finally {
        if (mounted) setProfilesLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  async function handleSend() {
    if (!canSend) return;
    setError(null);
    setLoading(true);

    const userMsg: ChatMessage = { role: 'user', message: input.trim() };
    const prev = messages;
    setMessages([...prev, userMsg]);
    setInput('');

    try {
      const res = await sendMessage(conversationId, userMsg.message);
      setConversationId(res.conversation_id);
      setMessages(res.message); 
    } catch (e: any) {
      setError(e?.message || 'Error al comunicar con la API');
      setMessages(prev); 
    } finally {
      setLoading(false);
    }
  }

  function handleNewConversation() {
    setConversationId(null);
    setMessages([]);
    setError(null);
  }

  async function copyConversationId() {
    if (!conversationId) return;
    try { await navigator.clipboard.writeText(conversationId); } catch { /* ignore */ }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleProfileChange(id: string) {
    setProfileId(id);
    localStorage.setItem('debate:lastProfileId', id);

    try {
      await setProfile(id);
    } catch (e: any) {
      setError(e?.message || 'No se pudo aplicar el perfil');
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <button className="icon-btn" title="Nueva conversación" onClick={handleNewConversation}>
          <PlusCircle size={22} />
        </button>

        <div className="top-center">
          <span className="cid-label">Conversation ID:</span>
          <span className="cid-value">{conversationId ?? '—'}</span>
          <button
            className="icon-btn"
            title="Copiar Conversation ID"
            onClick={copyConversationId}
            disabled={!conversationId}
          >
            <ClipboardCopy size={18} />
          </button>
        </div>

        <div className="top-right">
          <UserIcon size={18} />
          <select
            className="profile-select"
            value={profileId}
            onChange={(e) => handleProfileChange(e.target.value)}
            title={profilesLoading ? 'Cargando perfiles…' : 'Seleccionar perfil'}
            disabled={profilesLoading || profiles.length === 0}
          >
            {profilesLoading && <option>Cargando perfiles…</option>}
            {!profilesLoading && profiles.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </header>

      <main className="chat-area">
        {messages.length === 0 && (
          <div className="empty">
            <h2>¡Inicia un debate!</h2>
            <p>Elige un perfil y escribe tu primer mensaje abajo.</p>
            {profilesError && <p style={{ color: '#fca5a5' }}>{profilesError}</p>}
          </div>
        )}

        {messages.map((m, i) => (
          <MessageBubble key={i} msg={m} />
        ))}

        {loading && (
          <div className="bubble-row">
            <div className="bubble bubble-bot">… pensando …</div>
          </div>
        )}

        {error && <div className="error">{error}</div>}

        <div ref={endRef} />
      </main>

      <footer className="composer">
        <textarea
          className="composer-input"
          placeholder="Escribe tu mensaje… (Enter para enviar, Shift+Enter para salto de línea)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={2}
        />
        <button className="send-btn" disabled={!canSend} onClick={handleSend}>
          Enviar
        </button>
      </footer>
    </div>
  );
}
