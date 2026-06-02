import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { G } from '../lib/theme';
import { Page, Spinner } from '../components/UI';

export default function Conversation() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [other, setOther] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => { fetchMessages(); subscribeMessages(); }, [id]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function fetchMessages() {
    const { data: conv } = await supabase.from('conversations')
      .select('player1:players!conversations_player1_id_fkey(id,first_name,last_name,avatar),player2:players!conversations_player2_id_fkey(id,first_name,last_name,avatar)')
      .eq('id', id).single();
    if (conv) setOther(conv.player1?.id === user.id ? conv.player2 : conv.player1);

    const { data: msgs } = await supabase.from('messages')
      .select('*').eq('conversation_id', id).order('created_at');
    setMessages(msgs || []);
    setLoading(false);
  }

  function subscribeMessages() {
    const sub = supabase.channel('messages-' + id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` },
        payload => setMessages(m => [...m, payload.new]))
      .subscribe();
    return () => supabase.removeChannel(sub);
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!text.trim()) return;
    await supabase.from('messages').insert({ conversation_id: id, sender_id: user.id, content: text.trim() });
    await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', id);
    setText('');
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><Spinner size={32} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: G.bg, fontFamily: G.font, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `0.5px solid ${G.border}`, padding: '0 1.5rem', height: 56, display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={() => navigate('/messages')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: G.textMuted }}>←</button>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: G.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{other?.avatar || '🧑'}</div>
        <div style={{ fontWeight: 600, fontSize: 15, color: G.text }}>{other?.first_name} {other?.last_name}</div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1rem 6rem', maxWidth: 700, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {messages.map(m => {
          const isMine = m.sender_id === user.id;
          return (
            <div key={m.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
              <div style={{ maxWidth: '70%', padding: '8px 12px', borderRadius: isMine ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: isMine ? G.green : '#fff', color: isMine ? '#fff' : G.text, fontSize: 14, border: isMine ? 'none' : `0.5px solid ${G.border}` }}>
                {m.content}
                <div style={{ fontSize: 10, opacity: 0.6, marginTop: 3, textAlign: 'right' }}>
                  {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: `0.5px solid ${G.border}`, padding: '0.75rem 1rem' }}>
        <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8, maxWidth: 700, margin: '0 auto' }}>
          <input value={text} onChange={e => setText(e.target.value)} placeholder="Écrire un message..." style={{ flex: 1, padding: '10px 14px', fontSize: 14, border: `0.5px solid #ddd`, borderRadius: 24, fontFamily: G.font, outline: 'none' }} />
          <button type="submit" style={{ width: 40, height: 40, borderRadius: '50%', background: G.green, border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}>↑</button>
        </form>
      </div>
    </div>
  );
}
