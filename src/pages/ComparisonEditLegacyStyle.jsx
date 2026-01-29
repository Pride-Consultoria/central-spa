import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, MoreVertical, Building2 } from 'lucide-react';
import { get, post } from '../services/api/client';
import NetworkModal from '../components/presentation/NetworkModal';
import '../styles.css';

export default function ComparisonEditLegacyStyle() {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [showHospitals, setShowHospitals] = useState(false);
    const [state, setState] = useState({
        title: '',
        modality: 'PME',
        region_id: '',
        lives_range: '',
        type: '',
        snapshot: {},
        selections: [],
        activeOperator: '',
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await get(`/comparisons/${id}/edit`);
                const d = res.data;
                setData(d);
                setState((prev) => ({
                    ...prev,
                    title: d.comparison?.title || '',
                    modality: d.comparison?.modality || 'PME',
                    region_id: d.comparison?.region_id || d.regions?.[0]?.id || '',
                    lives_range: d.comparison?.lives_range || d.livesRanges?.[0] || '',
                    type: d.comparison?.type || (d.types ? Object.keys(d.types)[0] : ''),
                    snapshot: d.existingSnapshot || {},
                    selections: (d.existingSelections || []).map((s) => ({
                        operator_id: s.operator_id,
                        plan_id: s.plan_id,
                        is_client_plan: !!s.is_client_plan,
                        is_featured: !!s.is_featured,
                    })),
                    activeOperator: d.operators?.[0]?.id || '',
                }));
            } catch (err) {
                setError(err.message || 'Erro ao carregar');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const operators = data?.operators || [];
    const faixas = data?.faixas || {};
    const types = data?.types || {};
    const planOptions = data?.planOptions || {};
    const livesRanges = data?.livesRanges || [];

    const activePlans = useMemo(() => {
        if (!state.activeOperator) return [];
        return planOptions[state.activeOperator] || [];
    }, [state.activeOperator, planOptions]);

    const isSelected = (opId, planId) =>
        state.selections.some(
            (s) => String(s.operator_id) === String(opId) && String(s.plan_id) === String(planId),
        );

    const toggleSelection = (opId, planId) => {
        setState((prev) => {
            const exists = prev.selections.find(
                (s) => String(s.operator_id) === String(opId) && String(s.plan_id) === String(planId),
            );
            if (exists) {
                return {
                    ...prev,
                    selections: prev.selections.filter(
                        (s) => !(String(s.operator_id) === String(opId) && String(s.plan_id) === String(planId)),
                    ),
                };
            }
            return {
                ...prev,
                selections: [
                    ...prev.selections,
                    { operator_id: opId, plan_id: planId, is_client_plan: false, is_featured: false },
                ],
            };
        });
    };

    const markClient = (index) => {
        setState((prev) => ({
            ...prev,
            selections: prev.selections.map((s, i) => ({ ...s, is_client_plan: i === index })),
        }));
    };

    const markFeatured = (index) => {
        setState((prev) => ({
            ...prev,
            selections: prev.selections.map((s, i) => ({ ...s, is_featured: i === index })),
        }));
    };

    const removeSelection = (index) => {
        setState((prev) => ({
            ...prev,
            selections: prev.selections.filter((_, i) => i !== index),
        }));
    };

    const updateSnapshot = (key, value) => {
        setState((prev) => ({
            ...prev,
            snapshot: { ...prev.snapshot, [key]: Number(value) || 0 },
        }));
    };

    const save = async () => {
        setSaving(true);
        setError(null);
        try {
            const payload = {
                title: state.title,
                modality: state.modality,
                region_id: state.region_id,
                lives_range: state.lives_range,
                type: state.type,
                snapshot: state.snapshot,
                comparisonPlans: state.selections,
            };
            await post(`/comparisons/${id}?_method=PUT`, payload);
        } catch (err) {
            setError(err.message || 'Erro ao salvar');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="muted p-4">Carregando...</div>;
    if (error) return <div className="alert p-4">{error}</div>;
    if (!data) return <div className="muted p-4">Sem dados.</div>;

    return (
        <div className="min-h-screen bg-[#0b1323] text-[#e5e7eb] p-4">
            <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl p-4 flex justify-between items-start mb-4">
                <div>
                    <div className="text-sm uppercase tracking-[0.08em] text-[#94a3b8] font-bold">
                        Comparacao #{id}
                    </div>
                    <h2 className="text-2xl font-bold mt-1 mb-1">{state.title || 'Sem titulo'}</h2>
                    <div className="text-[#94a3b8]">Ajuste a distribuicao de vidas, selecione planos e compartilhe com o cliente.</div>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button className="btn secondary" type="button">
                        Editar vidas (SPA)
                    </button>
                    <button className="btn ghost" type="button">
                        Editar configuracoes (SPA)
                    </button>
                    <button className="btn" type="button">
                        Escolher planos
                    </button>
                </div>
            </div>

            <div className="grid lg:grid-cols-[2fr_1fr] gap-4">
                <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="m-0">Planos selecionados</h3>
                        <button className="btn secondary" type="button">
                            Selecionar / editar
                        </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                        {state.selections.map((sel, idx) => {
                            const plan = (planOptions[sel.operator_id] || []).find((p) => String(p.id) === String(sel.plan_id));
                            return (
                                <div key={`${sel.operator_id}-${sel.plan_id}`} className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#122038] p-3 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-[80px] h-[60px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] grid place-items-center rounded-lg overflow-hidden">
                                                {plan?.image ? (
                                                    <img src={plan.image.startsWith('http') ? plan.image : `/storage/${plan.image}`} alt="logo plano" className="max-w-full max-h-full object-contain" />
                                                ) : (
                                                    <span>{(operators.find((o) => String(o.id) === String(sel.operator_id))?.name || '').slice(0, 2)}</span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold">{plan?.name || 'Plano'}</div>
                                                <div className="text-sm text-[#94a3b8]">{types[state.type] || state.type}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            {sel.is_client_plan && <span className="px-2 py-1 rounded bg-[rgba(93,224,180,0.12)] text-xs text-[#5de0b4]">Cliente</span>}
                                            {sel.is_featured && <span className="px-2 py-1 rounded bg-[rgba(93,224,180,0.12)] text-xs text-[#5de0b4]">Destaque</span>}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        <button className="btn secondary" type="button" onClick={() => markClient(idx)}>
                                            Plano do cliente
                                        </button>
                                        <button className="btn secondary" type="button" onClick={() => markFeatured(idx)}>
                                            Indicacao Pride
                                        </button>
                                        <button className="btn ghost" type="button" onClick={() => removeSelection(idx)}>
                                            Remover
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        {state.selections.length === 0 && (
                            <div className="rounded-xl border border-dashed border-[rgba(255,255,255,0.2)] p-6 text-center text-[#94a3b8]">
                                Nenhum plano selecionado
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl p-4 space-y-3">
                    <div className="section-header" />
                    <div className="flex gap-2 flex-wrap">
                        <button className="btn secondary" type="button" onClick={() => setShowHospitals(true)}>
                            Ver hospitais
                        </button>
                        <button className="btn" type="button" onClick={save} disabled={saving}>
                            {saving ? 'Salvando...' : 'Enviar'}
                        </button>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="muted">Distribuicao</span>
                            <strong>Geral</strong>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="muted">Total de vidas</span>
                            <strong>
                                {Object.values(state.snapshot || {}).reduce((acc, val) => acc + Number(val || 0), 0)}
                            </strong>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="muted">Modalidade</span>
                            <strong>{state.modality || '-'}</strong>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="muted">Regiao</span>
                            <strong>
                                {data.regions?.find((r) => String(r.id) === String(state.region_id))?.name || '-'}
                            </strong>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="muted">Tipo</span>
                            <strong>{types[state.type] || state.type || '-'}</strong>
                        </div>
                    </div>
                </div>
            </div>

            {/* Drawer inline para operar seleção, estilizado similar ao legacy */}
            <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl p-4 mt-4">
                <div className="mb-3">
                    <div className="muted">Operadoras</div>
                    <h3 style={{ margin: 0 }}>Escolha a operadora e os planos</h3>
                </div>
                <div className="grid md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                        {operators.map((op) => (
                            <div
                                key={op.id}
                                className={`operator-card cursor-pointer ${String(state.activeOperator) === String(op.id) ? 'active' : ''}`}
                                onClick={() => setState({ ...state, activeOperator: op.id })}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div className="logo" style={{ width: '46px', height: '32px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
                                        {(op.logo && <img src={op.logo} alt="logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />) || op.name.slice(0, 2)}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 800 }}>{op.name}</div>
                                        <div className="muted">{(planOptions[op.id] || []).length} plano(s)</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="md:col-span-2">
                        <h4 className="m-0 mb-2">Planos</h4>
                        <div className="grid md:grid-cols-2 gap-2">
                        {activePlans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`plan-card ${isSelected(state.activeOperator, plan.id) ? 'plan-card--selected' : ''}`}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div className="logo" style={{ width: '46px', height: '32px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
                                        {plan.image ? (
                                            <img src={plan.image.startsWith('http') ? plan.image : `/storage/${plan.image}`} alt="logo plano" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                        ) : (
                                            operators.find((o) => String(o.id) === String(state.activeOperator))?.name.slice(0, 2)
                                        )}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 800 }}>{plan.name}</div>
                                        <div className="muted">
                                            {operators.find((o) => String(o.id) === String(state.activeOperator))?.name || ''}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    className="btn secondary"
                                    type="button"
                                    onClick={() => toggleSelection(state.activeOperator, plan.id)}
                                >
                                    {isSelected(state.activeOperator, plan.id) ? 'Selecionado' : 'Selecionar'}
                                </button>
                            </div>
                        ))}
                        </div>
                    </div>
                </div>
            </div>

            {showHospitals && (
                <NetworkModal
                    open={showHospitals}
                    comparisonId={id}
                    onClose={() => setShowHospitals(false)}
                />
            )}

            {error && <div className="alert">{error}</div>}
        </div>
    );
}
