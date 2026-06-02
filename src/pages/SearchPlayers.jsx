import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { G, LEVEL_LABEL } from '../lib/theme';
import { Page, PageHeader, Card, Badge, LevelBadge, Empty, Btn, Input, Select, Spinner, PlayerCard } from '../components/UI';

const LEVELS = [
  { value: '', label: 'Tous les niveaux' },
  { value: 'debutant', label: '🌱 Débutant' },
  { value: 'intermediaire', label: '⚡ Intermédiaire' },
  { value: 'avance', label: '🔥 Avancé' },
  { value: 'expert', label: '🏆 Expert' },
];

export default function SearchPlayers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [city, setCity] = useState('');
  const [level, setLevel] = useState('');
  const [name, setName] = useState('');
  const [friendStatus, setFriendStatus] = useState({});

  useEffect(() => { search(); }, []);

  async function search() {
    setLoading(true);
    let q = supabase.from('players').select('id,first_name,last_name,level,avatar,city,rating,matches_played').neq('id', user.id).limit(20);
    if (city) q = q.ilike('city', `%${city}%`);
    if (level) q = q.eq('level', level);
    if (name) q = q.or(`first_name.ilike.%${name}%,last_name.ilike.%${name}%`);
    const { data } = await q;
    setPlayers(data || []);

    // Récupère le statut d'amitié pour chaque joueur
    if (data?.length) {
      const { data: fs } = await supabase.from('friendships').select('receiver_id,sender_id,status').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
      const map = {};
      (fs || []).forEach(f => {
        const other = f.sender_id === user.id ? f.receiver_id : f.sender_id;
        map[other] = f.status;
      });
      setFriendStatus(map);
    }
    setLoading(false);
  }

  async function sendFriendRequest(playerId) {
    await supabase.from('friendships').insert({ sender_id: user.id, receiver_id: playerId, status: 'pending' });
    setFriendStatus(s => ({ ...s, [playerId]: 'pending' }));
  }

  function FriendBtn({ playerId }) {
    const status = friendStatus[playerId];
    if (status === 'accepted') return <Badge text="✓ Ami" />;
    if (status === 'pending')  return <Badge text="En attente" bg="#FFF8E1" color="#F57F17" />;
    return <Btn small variant="secondary" onClick={e => { e.stopPropagation(); sendFriendRequest(playerId); }}>+ Ajouter</Btn>;
  }

  return (
    <Page>
      <PageHeader title="Rechercher des joueurs" subtitle="Trouvez vos partenaires de padel" />

      {/* Filtres */}
      <Card style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'flex-end' }}>
          <Input label="Nom" value={name} onChange={setName} placeholder="Marie, Dupont..." />
          <Input label="Ville" value={city} onChange={setCity} placeholder="Paris, Lyon..." />
          <Select label="Niveau" value={level} onChange={setLevel} options={LEVELS} />
          <Btn onClick={search} disabled={loading}>🔍 Rechercher</Btn>
        </div>
      </Card>

      {/* Résultats */}
      <Card>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Spinner /></div>
        ) : players.length === 0 ? (
          <Empty icon="🔍" text="Aucun joueur trouvé" cta="Modifier les filtres" onClick={() => { setCity(''); setLevel(''); setName(''); search(); }} />
        ) : (
          <>
            <div style={{ fontSize: 12, color: G.textMuted, marginBottom: '0.75rem' }}>{players.length} joueur{players.length > 1 ? 's' : ''} trouvé{players.length > 1 ? 's' : ''}</div>
            {players.map(p => (
              <PlayerCard
                key={p.id}
                player={p}
                onClick={() => navigate(`/profile/${p.id}`)}
                actions={<FriendBtn playerId={p.id} />}
              />
            ))}
          </>
        )}
      </Card>
    </Page>
  );
}
