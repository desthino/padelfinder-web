import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { G } from '../lib/theme';
import { Page, PageHeader, Card, Empty, Btn, LevelBadge, Spinner, PlayerCard } from '../components/UI';

export default function Friends() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('friends');

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [f, r] = await Promise.all([
      supabase.from('friendships').select('id,players!friendships_receiver_id_fkey(id,first_name,last_name,avatar,level,city,rating)').eq('sender_id', user.id).eq('status', 'accepted')
        .then(async res => {
          const sent = (res.data || []).map(d => ({ fid: d.id, ...d.players }));
          const { data: received } = await supabase.from('friendships').select('id,players!friendships_sender_id_fkey(id,first_name,last_name,avatar,level,city,rating)').eq('receiver_id', user.id).eq('status', 'accepted');
          return [...sent, ...(received || []).map(d => ({ fid: d.id, ...d.players }))];
        }),
      supabase.from('friendships').select('id,players!friendships_sender_id_fkey(id,first_name,last_name,avatar,level,city)').eq('receiver_id', user.id).eq('status', 'pending').then(r => r.data || []),
    ]);
    setFriends(f);
    setRequests(r);
    setLoading(false);
  }

  async function accept(id) {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', id);
    fetchAll();
  }
  async function decline(id) {
    await supabase.from('friendships').delete().eq('id', id);
    fetchAll();
  }
  async function remove(fid) {
    await supabase.from('friendships').delete().eq('id', fid);
    fetchAll();
  }

  return (
    <Page maxWidth={700}>
      <PageHeader title="Amis" subtitle="Gérez vos relations" />

      <div style={{ display: 'flex', gap: 4, background: '#fff', border: `0.5px solid ${G.border}`, borderRadius: 10, padding: 3, marginBottom: '1rem', width: 'fit-content' }}>
        {[['friends', `Amis (${friends.length})`], ['requests', `Demandes (${requests.length})`]].map(([val, label]) => (
          <button key={val} onClick={() => setTab(val)} style={{ padding: '6px 16px', fontSize: 13, fontWeight: 500, border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: G.font, background: tab === val ? G.green : 'none', color: tab === val ? '#fff' : G.textSub }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Spinner size={32} /></div>
      ) : tab === 'friends' ? (
        <Card>
          {friends.length === 0
            ? <Empty icon="❤️" text="Aucun ami pour l'instant" cta="Trouver des joueurs" onClick={() => navigate('/search')} />
            : friends.map(f => (
              <PlayerCard key={f.id} player={f} onClick={() => navigate(`/profile/${f.id}`)}
                actions={<Btn small variant="ghost" onClick={e => { e.stopPropagation(); remove(f.fid); }}>Retirer</Btn>}
              />
            ))
          }
        </Card>
      ) : (
        <Card>
          {requests.length === 0
            ? <Empty icon="🤝" text="Aucune demande en attente" />
            : requests.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `0.5px solid #f0f0f0` }}>
                <span style={{ fontSize: 28 }}>{r.players?.avatar || '🧑'}</span>
                <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => navigate(`/profile/${r.players?.id}`)}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: G.text }}>{r.players?.first_name} {r.players?.last_name}</div>
                  {r.players?.level && <LevelBadge level={r.players.level} />}
                </div>
                <Btn small onClick={() => accept(r.id)}>✓ Accepter</Btn>
                <Btn small variant="ghost" onClick={() => decline(r.id)}>✕</Btn>
              </div>
            ))
          }
        </Card>
      )}
    </Page>
  );
}
