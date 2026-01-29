import { useEffect, useState } from 'react';
import { get } from '../../services/api/client';
import { Button, Input, Pill, Spinner, EmptyState } from '../ui';

export default function NetworkModal({ open, comparisonId, planId, onClose }) {
    const [search, setSearch] = useState('');
    const [region, setRegion] = useState('');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [timer, setTimer] = useState(null);

    const fetchNetwork = async (q = {}) => {
        if (!open) return;
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (planId) params.append('plan_id', planId);
            if (q.search) params.append('search', q.search);
            if (q.region) params.append('region', q.region);
            const res = await get(`/comparisons/${comparisonId}/network?${params.toString()}`);
            setData(res.data || []);
        } catch (err) {
            setError(err.message || 'Erro ao carregar');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNetwork({ search, region });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, planId]);

    const debounceSearch = (val) => {
        if (timer) clearTimeout(timer);
        const t = setTimeout(() => {
            setSearch(val);
            fetchNetwork({ search: val, region });
        }, 300);
        setTimer(t);
    };

    const onRegionChange = (val) => {
        setRegion(val);
        fetchNetwork({ search, region: val });
    };

    if (!open) return null;

    return (
        <div className="ui-modal__backdrop" onClick={onClose}>
            <div className="ui-modal network-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                <div className="ui-modal__header">
                    <h3>Rede credenciada</h3>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        Fechar
                    </Button>
                </div>
                <div className="ui-modal__body">
                    <div className="filters">
                        <Input
                            label="Buscar hospital"
                            placeholder="Nome ou categoria"
                            onChange={(e) => debounceSearch(e.target.value)}
                        />
                        <Input
                            label="Região"
                            placeholder="SP, RJ..."
                            value={region}
                            onChange={(e) => onRegionChange(e.target.value)}
                        />
                    </div>
                    {loading ? (
                        <Spinner />
                    ) : error ? (
                        <div className="alert">{error}</div>
                    ) : !data.length ? (
                        <EmptyState description="Nenhum hospital encontrado." />
                    ) : (
                        <div className="network-table">
                            <div className="network-row head">
                                <div className="network-cell">Hospital</div>
                                <div className="network-cell">Categoria</div>
                                <div className="network-cell">Região</div>
                                <div className="network-cell">Plano</div>
                                <div className="network-cell">Operadora</div>
                                <div className="network-cell">Tipos</div>
                            </div>
                            {data.flatMap((item) =>
                                item.hospitals.map((h, idx) => (
                                    <div className="network-row" key={`${item.plan_id}-${idx}-${h.name}`}>
                                        <div className="network-cell">{h.name}</div>
                                        <div className="network-cell">
                                            <Pill tone="info">{h.category || '-'}</Pill>
                                        </div>
                                        <div className="network-cell">{h.region || '-'}</div>
                                        <div className="network-cell">{item.plan}</div>
                                        <div className="network-cell">{item.operator}</div>
                                        <div className="network-cell">
                                            {h.types && h.types.length ? h.types.join(', ') : '-'}
                                        </div>
                                    </div>
                                )),
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
