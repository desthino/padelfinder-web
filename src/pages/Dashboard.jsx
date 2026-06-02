import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { G, LEVEL_LABEL } from '../lib/theme';
import { Page, PageHeader, Section, Card, Badge, LevelBadge, Empty, Btn, PlayerCard, Spinner } from '../components/UI';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ games: [], players: [], friends: [], requests: [], clubs: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchAll(); }, [user]);

  async function fetchAll() {
    setLoading(true);
    const [games, players, friends, requests, clubs] = await Promise.all([
      supabase.from('game_players').select('games(id,date,location,level,max_players)').eq('player_id', user.id).limit(3).then(r => (r.data || []).map(d => d.games).filter(Boolean)),
      supabase.from('players').select('id,first_name,last_name,level,avatar,city,rating').neq('id', user.id).eq('city', profile?.city || '').limit(4).then(r => r.data || []),
      supabase.from('friendships').select('players!friendships_receiver_id_fkey(id,first_name,last_name,avatar,level)').eq('sender_id', user.id).eq('status', 'accepted').limit(5).then(r => (r.data || []).map(f => f.players).filter(Boolean)),
      supabase.from('friendships').select('id,players!friendships_sender_id_fkey(id,first_name,last_name,avatar,level)').eq('receiver_id', user.id).eq('status', 'pending').limit(3).then(r => r.data || []),
      supabase.from('clubs').select('id,name,city,courts').limit(4).then(r => r.data || []),
    ]);
    setData({ games, players, friends, requests, clubs });
    setLoading(false);
  }

  async function acceptFriend(id) {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', id);
    fetchAll();
  }
  async function declineFriend(id) {
    await supabase.from('friendships').delete().eq('id', id);
    fetchAll();
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><Spinner size={32} /></div>;

  return (
    <Page>
      <PageHeader
        title={`Bonjour, ${profile?.first_name || 'Joueur'} 👋`}
        subtitle="Votre tableau de bord PadelFinder"
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
        {[
          { icon: '🏓', val: profile?.matches_played || 0, label: 'Matchs joués', color: G.green },
          { icon: '⭐', val: profile?.rating ? Number(profile.rating).toFixed(1) : '—', label: 'Note', color: G.yellow },
          { icon: '📍', val: profile?.city || '—', label: 'Ville', color: G.purple, small: true },
          { icon: '🎯', val: LEVEL_LABEL[profile?.level]?.split(' ')[1] || '—', label: 'Niveau', color: '#EC4899', small: true },
        ].map(s => (
          <Card key={s.label}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: s.small ? 15 : 20, fontWeight: 700, color: G.text }}>{s.val}</div>
                <div style={{ fontSize: 11, color: G.textMuted }}>{s.label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
        <div>
          {/* Parties */}
          <Section title="Prochaines parties" icon="📅" action="Voir tout" onAction={() => navigate('/games')}>
            {data.games.length === 0
              ? <Empty icon="📅" text="Aucune partie programmée" cta="Trouver une partie" onClick={() => navigate('/games')} />
              : data.games.map(g => (
                <div key={g.id} onClick={() => navigate(`/games/${g.id}`)} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: `0.5px solid #f0f0f0`, cursor: 'pointer' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: G.green, minWidth: 55, textTransform: 'uppercase' }}>
                    {g.date ? new Date(g.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: G.text }}>📍 {g.location || 'Lieu non défini'}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                      {g.level && <LevelBadge level={g.level} />}
                      {g.max_players && <Badge text={`${g.max_players} joueurs max`} bg="#F3F4F6" color="#374151" />}
                    </div>
                  </div>
                </div>
              ))
            }
          </Section>

          {/* Clubs */}
          <Section title="Clubs de padel" icon="🏟️" action="Voir tout" onAction={() => navigate('/clubs')}>
            {data.clubs.length === 0
              ? <Empty icon="🏟️" text="Aucun club" cta="Explorer" onClick={() => navigate('/clubs')} />
              : data.clubs.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `0.5px solid #f0f0f0` }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: G.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏟️</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: G.text }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: G.textMuted }}>📍 {c.city}{c.courts ? ` · ${c.courts} terrains` : ''}</div>
                  </div>
                </div>
              ))
            }
          </Section>
        </div>

        <div>
          {/* Demandes d'amitié */}
          {data.requests.length > 0 && (
            <Section title={`Demandes d'amitié (${data.requests.length})`} icon="🤝">
              {data.requests.map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `0.5px solid #f0f0f0` }}>
                  <span style={{ fontSize: 24 }}>{r.players?.avatar || '🧑'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: G.text }}>{r.players?.first_name} {r.players?.last_name}</div>
                    {r.players?.level && <LevelBadge level={r.players.level} />}
                  </div>
                  <button onClick={() => acceptFriend(r.id)} style={{ width: 28, height: 28, borderRadius: '50%', background: G.greenLight, border: 'none', color: G.green, cursor: 'pointer', fontWeight: 700 }}>✓</button>
                  <button onClick={() => declineFriend(r.id)} style={{ width: 28, height: 28, borderRadius: '50%', background: G.redLight, border: 'none', color: G.red, cursor: 'pointer', fontWeight: 700 }}>✕</button>
                </div>
              ))}
            </Section>
          )}

          {/* Joueurs proches */}
          <Section title="Joueurs près de vous" icon="👥" action="Rechercher" onAction={() => navigate('/search')}>
            {data.players.length === 0
              ? <Empty icon="👥" text="Aucun joueur dans votre ville" cta="Modifier mon profil" onClick={() => navigate(`/profile/${user.id}`)} />
              : data.players.map(p => <PlayerCard key={p.id} player={p} onClick={() => navigate(`/profile/${p.id}`)} />)
            }
          </Section>

          {/* Amis */}
          <Section title="Mes amis" icon="❤️" action="Voir tout" onAction={() => navigate('/friends')}>
            {data.friends.length === 0
              ? <Empty icon="❤️" text="Pas encore d'amis" cta="Trouver des joueurs" onClick={() => navigate('/search')} />
              : data.friends.map(f => <PlayerCard key={f.id} player={f} onClick={() => navigate(`/profile/${f.id}`)} />)
            }
          </Section>
        </div>
      </div>
    </Page>
  );
}
