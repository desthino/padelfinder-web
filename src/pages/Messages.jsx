import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { G } from '../lib/theme';
import { Page, PageHeader, Card, Empty, Spinner, Btn } from '../components/UI';

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [convs, setConvs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchConvs(); }, []);

  async function fetchConvs() {
    const { data } = await supabase
      .from('conversations')
      .select('id,updated_at,player1:players!conversations_player1_id_fkey(id,first_name,last_name,avatar),player2:players!conversations_player2_id_fkey(id,first_name,last_name,avatar),messages(content,created_at)')
      .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
      .order('updated_at', { ascending: false });
    setConvs(data || []);
    setLoading(false);
  }

  function getOther(conv) {
    return conv.player1?.id === user.id ? conv.player2 : conv.player1;
  }

  function lastMsg(conv) {
    const msgs = conv.messages || [];
    if (!msgs.length) return 'Aucun message';
    return msgs[msgs.length - 1].content;
  }

  return (
    <Page maxWidth={700}>
      <PageHeader title="Messages" subtitle="Vos conversations" />
      <Card>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Spinner /></div>
        ) : convs.length === 0 ? (
          <Empty icon="💬" text="Aucune conversation" cta="Trouver des joueurs" onClick={() => navigate('/search')} />
        ) : convs.map(c => {
          const other = getOther(c);
          return (
            <div key={c.id} onClick={() => navigate(`/messages/${c.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `0.5px solid #f0f0f0`, cursor: 'pointer' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: G.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                {other?.avatar || '🧑'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: G.text }}>{other?.first_name} {other?.last_name}</div>
                <div style={{ fontSize: 12, color: G.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lastMsg(c)}</div>
              </div>
              <div style={{ fontSize: 11, color: G.textMuted, flexShrink: 0 }}>
                {c.updated_at ? new Date(c.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}
              </div>
            </div>
          );
        })}
      </Card>
    </Page>
  );
}
