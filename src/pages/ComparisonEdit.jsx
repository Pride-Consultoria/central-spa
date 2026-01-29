import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { get, post } from '../services/api/client';
import { Button, Input, Spinner, EmptyState, Pill } from '../components/ui';

const MODALITIES = ['MEI', 'PME', 'EMPRESARIAL', 'OPCIONAL'];

export default function ComparisonEdit() {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
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

    if (loading) return <Spinner />;
    if (error) return <div className="alert">{error}</div>;
    if (!data) return <EmptyState />;

    return (
        <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="m-0 text-xl font-bold">Editar comparação #{id}</h1>
                    <p className="muted">Fluxo SPA espelhando o legacy.</p>
                </div>
                <Button onClick={save} disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar alterações'}
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="card col-span-2 space-y-3">
                    <Input
                        label="Título"
                        value={state.title}
                        onChange={(e) => setState({ ...state, title: e.target.value })}
                    />
                    <div className="grid md:grid-cols-2 gap-3">
                        <label className="ui-field">
                            <span className="ui-field__label">Modalidade</span>
                            <select
                                className="ui-input"
                                value={state.modality}
                                onChange={(e) => setState({ ...state, modality: e.target.value })}
                            >
                                {MODALITIES.map((m) => (
                                    <option key={m} value={m}>
                                        {m}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="ui-field">
                            <span className="ui-field__label">Região</span>
                            <select
                                className="ui-input"
                                value={state.region_id}
                                onChange={(e) => setState({ ...state, region_id: e.target.value })}
                            >
                                {data.regions?.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="ui-field">
                            <span className="ui-field__label">Faixa de vidas</span>
                            <select
                                className="ui-input"
                                value={state.lives_range}
                                onChange={(e) => setState({ ...state, lives_range: e.target.value })}
                            >
                                {data.livesRanges?.map((lr) => (
                                    <option key={lr} value={lr}>
                                        {lr}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="ui-field">
                            <span className="ui-field__label">Tipo</span>
                            <select
                                className="ui-input"
                                value={state.type}
                                onChange={(e) => setState({ ...state, type: e.target.value })}
                            >
                                {Object.keys(types || {}).map((t) => (
                                    <option key={t} value={t}>
                                        {types[t]}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="card bg-[rgba(255,255,255,0.02)]">
                        <h4 className="m-0 mb-2">Distribuição de vidas</h4>
                        <div className="grid md:grid-cols-3 gap-2">
                            {Object.entries(faixas).map(([key, label]) => (
                                <label key={key} className="ui-field">
                                    <span className="ui-field__label">{label}</span>
                                    <input
                                        className="ui-input"
                                        type="number"
                                        min="0"
                                        value={state.snapshot[key] || 0}
                                        onChange={(e) => updateSnapshot(key, e.target.value)}
                                    />
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="card space-y-3">
                    <h4 className="m-0">Operadoras</h4>
                    <div className="flex flex-col gap-2 max-h-[320px] overflow-auto">
                        {operators.map((op) => (
                            <button
                                key={op.id}
                                type="button"
                                className={`ui-btn ui-btn--secondary justify-start ${String(state.activeOperator) === String(op.id) ? 'border border-green-400' : ''}`}
                                onClick={() => setState({ ...state, activeOperator: op.id })}
                            >
                                {op.name}
                            </button>
                        ))}
                    </div>
                    <h4 className="m-0">Planos</h4>
                    <div className="space-y-2 max-h-[320px] overflow-auto">
                        {activePlans.length === 0 && <p className="muted">Selecione uma operadora.</p>}
                        {activePlans.map((plan) => (
                            <div key={plan.id} className="flex items-center justify-between bg-[rgba(255,255,255,0.04)] rounded-lg p-2">
                                <div>
                                    <div className="font-semibold">{plan.name}</div>
                                </div>
                                <Button
                                    type="button"
                                    variant={isSelected(state.activeOperator, plan.id) ? 'secondary' : 'primary'}
                                    onClick={() => toggleSelection(state.activeOperator, plan.id)}
                                >
                                    {isSelected(state.activeOperator, plan.id) ? 'Selecionado' : 'Selecionar'}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="card space-y-3">
                <h3 className="m-0">Planos selecionados</h3>
                {state.selections.length === 0 && <EmptyState description="Nenhum plano selecionado." />}
                <div className="grid md:grid-cols-2 gap-3">
                    {state.selections.map((sel, idx) => {
                        const plan = (planOptions[sel.operator_id] || []).find((p) => String(p.id) === String(sel.plan_id));
                        const opName = operators.find((o) => String(o.id) === String(sel.operator_id))?.name || sel.operator_id;
                        return (
                            <div key={`${sel.operator_id}-${sel.plan_id}`} className="card bg-[rgba(255,255,255,0.03)]">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="font-bold">{plan?.name || 'Plano'}</div>
                                        <div className="muted">{opName}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Pill tone={sel.is_client_plan ? 'info' : 'default'}>Cliente</Pill>
                                        <Pill tone={sel.is_featured ? 'success' : 'default'}>Destaque</Pill>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <Button variant="secondary" size="sm" onClick={() => markClient(idx)}>
                                        Plano do cliente
                                    </Button>
                                    <Button variant="secondary" size="sm" onClick={() => markFeatured(idx)}>
                                        Indicação Pride
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => removeSelection(idx)}>
                                        Remover
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {error && <div className="alert">{error}</div>}
        </section>
    );
}
