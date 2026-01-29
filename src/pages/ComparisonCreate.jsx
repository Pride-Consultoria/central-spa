import { useEffect, useState } from 'react';
import { get, post } from '../services/api/client';
import { Button, Input, Spinner, EmptyState } from '../components/ui';

const MODALITIES = ['MEI', 'PME', 'EMPRESARIAL', 'OPCIONAL'];
const TYPES = ['COM', 'SEM', 'PARC'];

export default function ComparisonCreate() {
    const [bootstrap, setBootstrap] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [form, setForm] = useState({
        title: '',
        modality: MODALITIES[0],
        region_id: '',
        lives_range: '0-0',
        type: TYPES[0],
        snapshot: {},
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await get('/comparisons/bootstrap');
                const b = res.data || {};
                const defaultRegion = b.regions?.[0]?.id || '';
                const defaultLives = b.livesRanges?.[0] || '0-0';
                const defaultType = b.types ? Object.keys(b.types)[0] : TYPES[0];
                const snapshot = Object.fromEntries(Object.keys(b.faixas || {}).map((k) => [k, 0]));
                setBootstrap(b);
                setForm((prev) => ({
                    ...prev,
                    region_id: defaultRegion,
                    lives_range: defaultLives,
                    type: defaultType,
                    snapshot,
                }));
            } catch (err) {
                setError(err.message || 'Erro ao carregar');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const onSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            const payload = {
                title: form.title || 'Sem título',
                modality: form.modality || MODALITIES[0],
                region_id: form.region_id,
                lives_range: form.lives_range,
                type: form.type,
                snapshot: form.snapshot,
                comparisonPlans: [],
            };
            const res = await post('/comparisons', payload);
            const id = res?.data?.id;
            if (id) {
                window.location.href = `/app/comparisons/${id}/edit`;
            } else {
                setError('Não foi possível obter o ID criado.');
            }
        } catch (err) {
            setError(err.message || 'Erro ao criar comparação');
        }
    };

    if (loading) return <Spinner />;
    if (error) return <div className="alert">{error}</div>;
    if (!bootstrap) return <EmptyState />;

    return (
        <section className="card">
            <h1>Criar comparação</h1>
            <p className="muted">Fluxo igual ao PHP: informar título e avançar para edição.</p>
            <form className="form" onSubmit={onSubmit}>
                <Input
                    label="Título"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Ex: Geral 2 vidas - PME"
                />
                {/* Hidden fields equivalentes ao PHP */}
                <input type="hidden" value={form.modality} readOnly />
                <input type="hidden" value={form.region_id} readOnly />
                <input type="hidden" value={form.lives_range} readOnly />
                <input type="hidden" value={form.type} readOnly />
                {Object.keys(bootstrap.faixas || {}).map((key) => (
                    <input key={key} type="hidden" value={form.snapshot[key] || 0} readOnly />
                ))}
                <Button type="submit">Continuar</Button>
                {error && <div className="alert">{error}</div>}
            </form>
        </section>
    );
}
