import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { get } from '../services/api/client';
import { Spinner, EmptyState, Button, Pill } from '../components/ui';
import NetworkModal from '../components/presentation/NetworkModal';

export default function ComparisonPresentation({ isPublic = false, comparisonId, signature }) {
    const params = useParams();
    const [searchParams] = useSearchParams();
    const id = comparisonId || params.id;
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [networkOpen, setNetworkOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);

    const sig = signature || searchParams.get('signature');
    const endpoint = sig
        ? `/public/comparisons/${id}/presentation?signature=${encodeURIComponent(sig)}`
        : `/comparisons/${id}/presentation`;

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await get(endpoint);
            setData(res.data);
        } catch (err) {
            setError(err.message || 'Erro ao carregar apresentação.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, signature]);

    if (loading) return <Spinner />;
    if (error) return <div className="alert">{error}</div>;
    if (!data) return <EmptyState />;

    const openNetwork = (planId) => {
        setSelectedPlan(planId);
        setNetworkOpen(true);
    };

    return (
        <div className="card">
            <header className="section-header">
                <div>
                    <h1 style={{ margin: 0 }}>{data.title || `Comparação #${data.id}`}</h1>
                    <p className="muted">
                        Região: {data.region || '-'} · Tipo: {data.type || '-'} · Modalidade: {data.modality || '-'}
                    </p>
                </div>
                <div className="cta">
                    {!isPublic && (
                        <a className="btn primary" href={data.public_link} target="_blank" rel="noreferrer">
                            Link público
                        </a>
                    )}
                </div>
            </header>

            <div className="cards-grid">
                {data.plans?.map((plan) => (
                    <div key={plan.id} className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>{plan.name}</h3>
                                <p className="muted" style={{ margin: 0 }}>
                                    {plan.operator}
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                {plan.is_client_plan && <Pill tone="info">Plano do cliente</Pill>}
                                {plan.is_featured && <Pill tone="success">Indicação Pride</Pill>}
                            </div>
                        </div>
                        <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
                            <div className="muted">Total: {Number(plan.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                            <div className="muted">Hospitais: {plan.hospitals?.length || 0}</div>
                            <Button variant="secondary" onClick={() => openNetwork(plan.plan_id)}>
                                Ver hospitais
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <NetworkModal
                open={networkOpen}
                comparisonId={id}
                planId={selectedPlan}
                onClose={() => setNetworkOpen(false)}
            />
        </div>
    );
}
