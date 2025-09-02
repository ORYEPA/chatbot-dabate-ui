import { useEffect, useMemo, useRef, useState } from 'react';
import { PlusCircle, User as UserIcon, ClipboardCopy } from 'lucide-react';
import MessageBubble from './components/MessageBubble';
import { sendMessage, getProfiles, setProfile, getHistory } from './lib/api';
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
  const reqIdRef = useRef(0);

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
          try { await setProfile(initial); } catch { /* */ }
        }
      } catch (e: any) {
        if (!mounted) return;
        setProfilesError(e?.message || 'Failed to load profiles.');

        const fallback: Profile[] = [
          { id: 'general', name: 'General' },
          { id: 'rude_arrogant', name: 'Rude & Arrogant' },
        ];
        setProfiles(fallback);
        setProfileId(fallback[0].id);
        try { await setProfile(fallback[0].id); } catch { /*  */ }
      } finally {
        if (mounted) setProfilesLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!conversationId) return;
      try {
        const full = await getHistory(conversationId, 1000);
        if (!active) return;
        setMessages(full);
      } catch {
        // ignore
      }
    })();
    return () => { active = false; };
  }, [conversationId]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  async function handleSend() {
    if (!canSend) return;
    setError(null);
    setLoading(true);

    const myReq = ++reqIdRef.current;

    const userMsg: ChatMessage = { role: 'user', message: input.trim() };
    const prev = messages;
    setMessages([...prev, userMsg]); 
    setInput('');

    try {
      const res = await sendMessage(conversationId, userMsg.message);
      if (myReq !== reqIdRef.current) return; 

      const cid = res.conversation_id;
      setConversationId(cid);

      const full = await getHistory(cid, 1000);
      if (myReq !== reqIdRef.current) return;
      setMessages(full);
    } catch (e: any) {
      setError(e?.message || 'API request failed.');
      setMessages(prev); 
    } finally {
      if (myReq === reqIdRef.current) setLoading(false);
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
      setError(e?.message || 'Could not apply profile.');
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <button className="icon-btn" title="New conversation" onClick={handleNewConversation}>
          <PlusCircle size={22} />
        </button>

        <div className="top-center">
          <span className="cid-label">Conversation ID:</span>
          <span className="cid-value">{conversationId ?? '—'}</span>
          <button
            className="icon-btn"
            title="Copy Conversation ID"
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
            title={profilesLoading ? 'Loading profiles…' : 'Select profile'}
            disabled={profilesLoading || profiles.length === 0}
          >
            {profilesLoading && <option>Loading profiles…</option>}
            {!profilesLoading && profiles.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </header>

      <main className="chat-area">
        {messages.length === 0 && (
          <div className="empty">
            <h2>Start a debate!</h2>
            <p>Select a profile and type your first message below.</p>
            {profilesError && <p style={{ color: '#fca5a5' }}>{profilesError}</p>}
          </div>
        )}

        {messages.map((m, i) => {
          const txt = (m as any)?.message ?? (m as any)?.content ?? '';
          return <MessageBubble key={`${i}-${m.role}-${String(txt).slice(0,32)}`} msg={m} />;
        })}

        {loading && (
          <div className="bubble-row">
            <div className="bubble bubble-bot">… thinking …</div>
          </div>
        )}

        {error && <div className="error">{error}</div>}

        <div ref={endRef} />
      </main>

      <footer className="composer">
        <textarea
          className="composer-input"
          placeholder="Type your message… (Enter to send, Shift+Enter for a new line)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={2}
        />
        <button className="send-btn" disabled={!canSend} onClick={handleSend}>
          Send
        </button>
      </footer>
    </div>
  );
}
