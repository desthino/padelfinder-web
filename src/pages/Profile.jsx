import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { G, LEVEL_LABEL, LEVEL_COLOR } from '../lib/theme';
import { Page, Card, Badge, LevelBadge, Btn, Input, Select, Spinner, Empty } from '../components/UI';

const LEVELS = [
  { value: 'debutant', label: '🌱 Débutant' },
  { value: 'intermediaire', label: '⚡ Intermédiaire' },
  { value: 'avance', label: '🔥 Avancé' },
  { value: 'expert', label: '🏆 Expert' },
];
const AVATARS = ['🧑','👩','🧔','👱','🏃','🎾'];

export default function Profile() {
  const { id } = useParams();
  const { user, profile: myProfile, setProfile, refetchProfile } = useAuth();
  const navigate = useNavigate();
  const isMe = id === user?.id;

  const [profile, setLocalProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [friendStatus, setFriendStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchProfile(); }, [id]);

  async function fetchProfile() {
    const { data } = await supabase.from('players').select('*').eq('id', id).single();
    setLocalProfile(data);
    setForm({ first_name: data?.first_name, last_name: data?.last_name, city: data?.city, level: data?.level, avatar: data?.avatar, bio: data?.bio || '' });

    const { data: rv } = await supabase.from('reviews').select('*, reviewer:players!reviews_reviewer_id_fkey(first_name,last_name,avatar)').eq('reviewed_id', id).order('created_at', { ascending: false });
    setReviews(rv || []);

    if (!isMe) {
      const { data: fs } = await supabase.from('friendships').select('status').or(`and(sender_id.eq.${user.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${user.id})`).maybeSingle();
      setFriendStatus(fs?.status || null);
    }
    setLoading(false);
  }

  async function saveProfile() {
    setSaving(true);
    const { data } = await supabase.from('players').update(form).eq('id', user.id).select().single();
    setLocalProfile(data);
    if (refetchProfile) refetchProfile();
    setEditing(false);
    setSaving(false);
  }

  async function sendFriendRequest() {
    await supabase.from('friendships').insert({ sender_id: user.id, receiver_id: id, status: 'pending' });
    setFriendStatus('pending');
  }

  async function sendMessage() {
    const { data: existing } = await supabase.from('conversations').select('id')
      .or(`and(player1_id.eq.${user.id},player2_id.eq.${id}),and(player1_id.eq.${id},player2_id.eq.${user.id})`).maybeSingle();
    if (existing) { navigate(`/messages/${existing.id}`); return; }
    const { data: conv } = await supabase.from('conversations').insert({ player1_id: user.id, player2_id: id }).select().single();
    navigate(`/messages/${conv.id}`);
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><Spinner size={32} /></div>;
  if (!profile) return <div style={{ padding: '2rem', textAlign: 'center' }}>Joueur introuvable.</div>;

  return (
    <Page maxWidth={700}>
      <button onClick={() => navigate(-1)} style={{ fontSize: 13, color: G.textMuted, background: 'none', border: 'none', cursor: 'pointer', marginBottom: '1rem', fontFamily: G.font }}>← Retour</button>

      {/* Carte profil */}
      <Card style={{ marginBottom: '1rem' }}>
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Prénom" value={form.first_name} onChange={v => setForm(f => ({...f, first_name: v}))} />
              <Input label="Nom" value={form.last_name} onChange={v => setForm(f => ({...f, last_name: v}))} />
            </div>
            <Input label="Ville" value={form.city} onChange={v => setForm(f => ({...f, city: v}))} />
            <Select label="Niveau" value={form.level} onChange={v => setForm(f => ({...f, level: v}))} options={LEVELS} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 500, color: G.textMuted, textTransform: 'uppercase', marginBottom: 8 }}>Avatar</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {AVATARS.map(a => (
                  <button key={a} onClick={() => setForm(f => ({...f, avatar: a}))} style={{ width: 44, height: 44, borderRadius: '50%', fontSize: 22, border: form.avatar === a ? `2px solid ${G.green}` : `2px solid ${G.border}`, background: form.avatar === a ? G.greenLight : '#f5f5f5', cursor: 'pointer' }}>{a}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 500, color: G.textMuted, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Bio</label>
              <textarea value={form.bio} onChange={e => setForm(f => ({...f, bio: e.target.value}))} rows={3} style={{ width: '100%', boxSizing: 'border-box', padding: '9px 13px', fontSize: 14, border: '0.5px solid #ddd', borderRadius: 8, fontFamily: G.font, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn variant="ghost" onClick={() => setEditing(false)}>Annuler</Btn>
              <Btn onClick={saveProfile} disabled={saving}>{saving ? 'Sauvegarde…' : 'Sauvegarder'}</Btn>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: G.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, border: `2px solid ${G.greenMid}`, flexShrink: 0 }}>
              {profile.avatar || '🧑'}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: G.text, margin: '0 0 6px' }}>{profile.first_name} {profile.last_name}</h1>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                {profile.level && <LevelBadge level={profile.level} />}
                {profile.city && <Badge text={`📍 ${profile.city}`} bg="#F3F4F6" color="#374151" />}
                {profile.rating > 0 && <Badge text={`⭐ ${Number(profile.rating).toFixed(1)}`} bg="#FFF8E1" color="#F57F17" />}
              </div>
              {profile.bio && <p style={{ fontSize: 13, color: G.textSub, margin: 0 }}>{profile.bio}</p>}
              <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700, fontSize: 18, color: G.text }}>{profile.matches_played || 0}</div><div style={{ fontSize: 11, color: G.textMuted }}>Matchs</div></div>
                <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700, fontSize: 18, color: G.text }}>{reviews.length}</div><div style={{ fontSize: 11, color: G.textMuted }}>Avis</div></div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {isMe ? (
                <Btn small onClick={() => setEditing(true)}>✏️ Modifier</Btn>
              ) : (
                <>
                  <Btn small onClick={sendMessage}>💬 Message</Btn>
                  {!friendStatus && <Btn small variant="secondary" onClick={sendFriendRequest}>+ Ajouter</Btn>}
                  {friendStatus === 'pending' && <Badge text="Demande envoyée" bg="#FFF8E1" color="#F57F17" />}
                  {friendStatus === 'accepted' && <Badge text="✓ Ami" />}
                </>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Avis */}
      <Card>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: '0.75rem' }}>⭐ Avis ({reviews.length})</div>
        {reviews.length === 0
          ? <Empty icon="⭐" text="Aucun avis pour l'instant" />
          : reviews.map(r => (
            <div key={r.id} style={{ padding: '10px 0', borderBottom: `0.5px solid #f0f0f0` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 20 }}>{r.reviewer?.avatar || '🧑'}</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{r.reviewer?.first_name} {r.reviewer?.last_name}</span>
                <span style={{ fontSize: 13, color: G.yellow }}>{'⭐'.repeat(r.rating || 0)}</span>
              </div>
              {r.comment && <p style={{ fontSize: 13, color: G.textSub, margin: 0 }}>{r.comment}</p>}
            </div>
          ))
        }
        {!isMe && (
          <div style={{ marginTop: '0.75rem' }}>
            <Btn small onClick={() => navigate(`/reviews/${id}`)}>Laisser un avis</Btn>
          </div>
        )}
      </Card>
    </Page>
  );
}
