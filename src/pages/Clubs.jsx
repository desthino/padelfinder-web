import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { G } from '../lib/theme';
import { Page, PageHeader, Card, Badge, Empty, Input, Btn, Spinner } from '../components/UI';

export default function Clubs() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('');

  useEffect(() => { fetchClubs(); }, []);

  async function fetchClubs() {
    setLoading(true);
    let q = supabase.from('clubs').select('*').order('name');
    if (city) q = q.ilike('city', `%${city}%`);
    const { data } = await q;
    setClubs(data || []);
    setLoading(false);
  }

  return (
    <Page>
      <PageHeader title="Clubs de padel" subtitle="Trouvez un club près de chez vous" />

      <Card style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'flex-end' }}>
          <Input label="Ville" value={city} onChange={setCity} placeholder="Paris, Lyon, Marseille..." />
          <Btn onClick={fetchClubs}>🔍 Rechercher</Btn>
        </div>
      </Card>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Spinner size={32} /></div>
      ) : clubs.length === 0 ? (
        <Card><Empty icon="🏟️" text="Aucun club trouvé" /></Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {clubs.map(c => (
            <Card key={c.id}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, background: G.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🏟️</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: G.text, marginBottom: 4 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: G.textMuted, marginBottom: 6 }}>📍 {c.address || c.city}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {c.courts && <Badge text={`${c.courts} terrains`} />}
                    {c.city && <Badge text={c.city} bg="#F3F4F6" color="#374151" />}
                    {c.indoor && <Badge text="🏠 Indoor" bg="#EDE7F6" color="#4527A0" />}
                    {c.outdoor && <Badge text="☀️ Outdoor" bg="#FFF8E1" color="#F57F17" />}
                  </div>
                  {c.phone && <div style={{ fontSize: 12, color: G.textSub, marginTop: 6 }}>📞 {c.phone}</div>}
                  {c.website && <a href={c.website} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: G.green, display: 'block', marginTop: 4 }}>🌐 Site web</a>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Page>
  );
}
