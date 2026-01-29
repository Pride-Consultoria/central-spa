import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, MoreVertical, Building2, X, ArrowRight, GripVertical } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import { rectSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { get, post } from '../services/api/client';
import NetworkModal from '../components/presentation/NetworkModal';
import Modal from '../components/ui/Modal';
import Drawer from '../components/ui/Drawer';
import '../styles.css';

const PlanSortableItem = ({ id, children }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: transition || 'transform 220ms ease, box-shadow 150ms ease',
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging ? 30 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`group relative rounded-2xl border border-white/10 bg-[#0f1a2b] p-4 transition duration-200 ${
                isDragging ? 'ring-2 ring-emerald-400/60 shadow-2xl scale-[1.02] opacity-95' : 'hover:border-white/30 hover:-translate-y-0.5'
            } ${isOver ? 'ring-2 ring-blue-400/40' : ''}`}
        >
            <div
                className="absolute top-2 left-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/70 opacity-0 transition group-hover:opacity-100"
                title="Arraste para reordenar"
            >
                <GripVertical size={16} />
            </div>
            {children({ isDragging, isOver })}
        </div>
    );
};

export default function ComparisonEditPremium() {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [showHospitals, setShowHospitals] = useState(false);
    const [showHeaderActions, setShowHeaderActions] = useState(false);
    const [planMenuOpen, setPlanMenuOpen] = useState(null);
    const [saveMessage, setSaveMessage] = useState('');
    const [activeId, setActiveId] = useState(null);
    const [showLivesModal, setShowLivesModal] = useState(false);
    const [showConfigDrawer, setShowConfigDrawer] = useState(false);
    const [showPlansDrawer, setShowPlansDrawer] = useState(false);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
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
    const planValues = data?.planValues || [];
    const sortableIds = useMemo(
        () => state.selections.map((sel, idx) => `${sel.operator_id}-${sel.plan_id}-${idx}`),
        [state.selections],
    );
    const creatorRaw = data?.comparison?.created_by_name || data?.comparison?.created_by;
    const creator = creatorRaw && isNaN(Number(creatorRaw)) ? creatorRaw : 'Usuário';
    const createdAt = data?.comparison?.created_at;

    const formatSince = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (Number.isNaN(date.getTime())) return '';
        const diffMs = Date.now() - date.getTime();
        const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        if (days === 0) return 'há menos de 1 dia';
        if (days === 1) return 'há 1 dia';
        return `há ${days} dias`;
    };

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

    const save = async (silent = false) => {
        if (!silent) setSaving(true);
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
            if (!silent) {
                setSaveMessage('Salvo com sucesso');
                setTimeout(() => setSaveMessage(''), 3000);
            }
        } catch (err) {
            if (!silent) {
                setError(err.message || 'Erro ao salvar');
            }
        } finally {
            if (!silent) setSaving(false);
        }
    };

    const totalVidas = Object.values(state.snapshot || {}).reduce((acc, val) => acc + Number(val || 0), 0);

    useEffect(() => {
        if (loading || !data) return;
        const timer = setTimeout(() => {
            save(true);
        }, 600);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.title, state.modality, state.region_id, state.lives_range, state.type, state.snapshot, state.selections]);

    const formatCurrency = (val) => {
        const num = Number(val || 0);
        if (Number.isNaN(num) || num === 0) return 'R$ 0,00';
        return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
    };

    const computePlanTotal = (planId) => {
        const pv = planValues.find(
            (p) =>
                String(p.plan_id) === String(planId) &&
                String(p.region_id) === String(state.region_id) &&
                String(p.type) === String(state.type) &&
                String(p.lives_range) === String(state.lives_range),
        );
        if (!pv) return null;
        let total = 0;
        Object.keys(faixas || {}).forEach((key) => {
            const qty = Number(state.snapshot[key] || 0);
            const unit = Number(pv.values?.[key] || 0);
            total += qty * unit;
        });
        return total;
    };

    const handleReorder = (from, to) => {
        if (from === null || to === null || from === to) return;
        setState((prev) => {
            const arr = [...prev.selections];
            const [moved] = arr.splice(from, 1);
            arr.splice(to, 0, moved);
            return { ...prev, selections: arr };
        });
    };

    const renderPlanCard = (sel, idx) => {
        const plan = (planOptions[sel.operator_id] || []).find((p) => String(p.id) === String(sel.plan_id));
        const operatorName = operators.find((o) => String(o.id) === String(sel.operator_id))?.name || '';
        const hospitalsCount =
            plan?.hospitals?.length ??
            plan?.hospitals_count ??
            plan?.hospitalsCount ??
            sel.hospitals_count ??
            0;
        const total =
            computePlanTotal(plan?.id ?? sel.plan_id) ??
            sel.total ??
            plan?.total ??
            plan?.price ??
            plan?.value ??
            plan?.monthly_cost ??
            sel.monthly_cost ??
            null;

        return (
            <>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-14 w-20 rounded-xl border border-white/5 bg-white/5 grid place-items-center overflow-hidden">
                            {plan?.image ? (
                                <img
                                    src={plan.image.startsWith('http') ? plan.image : `/storage/${plan.image}`}
                                    alt="logo plano"
                                    className="max-h-full max-w-full object-contain"
                                />
                            ) : (
                                <span className="text-sm text-white/70">{operatorName.slice(0, 2) || 'PL'}</span>
                            )}
                        </div>
                        <div>
                            <div className="text-sm text-white/60 uppercase tracking-[0.08em]">
                                {operatorName || 'Operadora'}
                            </div>
                            <div className="text-lg font-semibold leading-tight">{plan?.name || 'Plano'}</div>
                            <div className="text-xs text-white/50">{types[state.type] || state.type || '-'}</div>
                        </div>
                    </div>
                    <div className="relative">
                        <button
                            type="button"
                            className="text-white/50 hover:text-white transition"
                            onClick={() =>
                                setPlanMenuOpen((prev) =>
                                    prev === `${sel.operator_id}-${sel.plan_id}` ? null : `${sel.operator_id}-${sel.plan_id}`,
                                )
                            }
                        >
                            <MoreVertical size={18} />
                        </button>
                        {planMenuOpen === `${sel.operator_id}-${sel.plan_id}` && (
                            <div className="absolute right-0 z-30 mt-2 w-44 rounded-lg border border-white/10 bg-[#0f172a] shadow-xl">
                                <button
                                    className="w-full px-3 py-2 text-left text-xs font-semibold text-white hover:bg-white/5"
                                    type="button"
                                    onClick={() => {
                                        markClient(idx);
                                        setPlanMenuOpen(null);
                                    }}
                                >
                                    Plano do cliente
                                </button>
                                <button
                                    className="w-full px-3 py-2 text-left text-xs font-semibold text-white hover:bg-white/5"
                                    type="button"
                                    onClick={() => {
                                        markFeatured(idx);
                                        setPlanMenuOpen(null);
                                    }}
                                >
                                    Indicação Pride
                                </button>
                                <button
                                    className="w-full px-3 py-2 text-left text-xs font-semibold text-white hover:bg-white/5"
                                    type="button"
                                    onClick={() => {
                                        removeSelection(idx);
                                        setPlanMenuOpen(null);
                                    }}
                                >
                                    Remover
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-3 space-y-2 text-sm text-white/70">
                    <div className="flex items-center justify-between">
                        <span className="text-white/50">Modalidade</span>
                        <span className="font-semibold text-white">{state.modality || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-white/50">Faixa</span>
                        <span className="font-semibold text-white">
                            {state.lives_range ||
                                livesRanges.find((lr) => lr === state.lives_range) ||
                                livesRanges[0] ||
                                '-'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-white/50">Hospitais</span>
                        <span className="font-semibold text-white">
                            {hospitalsCount > 0 ? `${hospitalsCount} hospitais` : 'Hospitais não informados'}
                        </span>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400">
                        <CheckCircle2 size={18} />
                        <span className="text-sm font-semibold">Selecionado</span>
                    </div>
                    <div className="text-base font-semibold text-white">
                        {total ? `${formatCurrency(total)}` : 'R$ 0,00'}
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    {sel.is_client_plan && (
                        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                            Plano do cliente
                        </span>
                    )}
                    {sel.is_featured && (
                        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
                            Indicação Pride
                        </span>
                    )}
                </div>
            </>
        );
    };

    if (loading) return <div className="muted p-4">Carregando...</div>;
    if (error) return <div className="alert p-4">{error}</div>;
    if (!data) return <div className="muted p-4">Sem dados.</div>;

    return (
        <div className="min-h-screen text-[#e5e7eb]">
            {saveMessage && (
                <div className="fixed top-4 right-4 z-50 rounded-lg bg-emerald-500 text-white px-4 py-2 shadow-lg">
                    {saveMessage}
                </div>
            )}
            <div className="mx-auto w-full px-0 py-0 lg:px-0 lg:py-0">
                <header className="relative mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-1">
                        <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">
                            Comparacao #{id}
                        </div>
                        <h1 className="text-3xl font-bold leading-tight">{state.title || 'Sem título'}</h1>
                        {/* textos removidos conforme solicitação */}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                className="rounded-lg border border-white/15 bg-[#0d1526] px-4 py-2 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-[#101a30]"
                                type="button"
                                onClick={() => setShowLivesModal(true)}
                            >
                                Editar vidas
                            </button>
                            <button
                                className="rounded-lg border border-[#9fb5ff]/70 bg-[#1a2540] px-4 py-2 text-sm font-semibold text-[#dbe6ff] transition hover:border-[#c1d3ff] hover:bg-[#1f2c4d]"
                                type="button"
                                onClick={() => setShowConfigDrawer(true)}
                            >
                                Editar configurações
                            </button>
                            <button
                                className="rounded-lg border border-white/15 bg-[#0d1526] px-4 py-2 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-[#101a30]"
                                type="button"
                                onClick={() => setShowPlansDrawer(true)}
                            >
                                Escolher planos
                            </button>
                        </div>
                        <button
                            className="inline-flex items-center gap-2 rounded-lg bg-white text-slate-900 px-4 py-2 text-sm font-semibold border border-white/70 transition hover:border-white hover:bg-white/90 disabled:opacity-60"
                            type="button"
                            onClick={() => save()}
                            disabled={saving}
                        >
                            {saving ? 'Salvando...' : 'Continuar'}
                            <ArrowRight size={16} />
                        </button>
                        <button
                            className="rounded-lg px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                            type="button"
                            onClick={() => setShowHeaderActions((prev) => !prev)}
                        >
                            <MoreVertical size={18} />
                        </button>
                        {showHeaderActions && (
                            <div className="absolute right-4 top-16 z-20 w-52 rounded-lg border border-white/10 bg-[#0f172a] shadow-xl">
                                <div className="flex flex-col text-sm text-white/80">
                                    <a
                                        href={`/app/comparisons/${id}/presentation`}
                                        className="px-3 py-2 hover:bg-white/5"
                                        onClick={() => setShowHeaderActions(false)}
                                    >
                                        Ver apresentação (SPA)
                                    </a>
                                    <a
                                        href={`/comparisons/${id}/edit`}
                                        className="px-3 py-2 hover:bg-white/5"
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={() => setShowHeaderActions(false)}
                                    >
                                        Editar no legacy
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                <div className="grid gap-4 lg:grid-cols-[2fr_360px]">
                    <div className="space-y-4">
                        <div className="rounded-2xl bg-transparent p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="text-lg font-semibold m-0">Planos selecionados</h3>
                                <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/70">
                                    {state.selections.length} plano(s)
                                </span>
                            </div>
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragStart={({ active }) => setActiveId(active.id)}
                                onDragEnd={({ active, over }) => {
                                    setActiveId(null);
                                    if (!over) return;
                                    const oldIndex = sortableIds.indexOf(active.id);
                                    const newIndex = sortableIds.indexOf(over.id);
                                    if (oldIndex !== -1 && newIndex !== -1) {
                                        handleReorder(oldIndex, newIndex);
                                    }
                                }}
                                onDragCancel={() => setActiveId(null)}
                            >
                                <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
                                    <div className={`grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${activeId ? 'opacity-90' : ''}`}>
                                        {state.selections.map((sel, idx) => (
                                            <PlanSortableItem key={sortableIds[idx]} id={sortableIds[idx]}>
                                                {() => renderPlanCard(sel, idx)}
                                            </PlanSortableItem>
                                        ))}
                                        {state.selections.length === 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setShowPlansDrawer(true)}
                                                className="w-full rounded-2xl border border-dashed border-white/20 p-6 text-center text-white/60 hover:border-white/40 hover:text-white transition"
                                            >
                                                Nenhum plano selecionado
                                            </button>
                                        )}
                                    </div>
                                </SortableContext>
                                <DragOverlay>
                                    {activeId ? (
                                        <div className="rounded-2xl border border-white/10 bg-[#0f1a2b] p-4 shadow-2xl opacity-90">
                                            {(() => {
                                                const idx = sortableIds.indexOf(activeId);
                                                const item = state.selections[idx];
                                                return item ? renderPlanCard(item, idx) : null;
                                            })()}
                                        </div>
                                    ) : null}
                                </DragOverlay>
                            </DndContext>
                        </div>

                        {false && (
                        <div className="rounded-2xl border border-white/5 bg-[#0f1a2b] p-4 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
                            <div className="mb-3">
                                <div className="text-xs uppercase tracking-[0.18em] text-white/50 font-semibold">
                                    Operadoras
                                </div>
                                <h3 className="text-lg font-semibold m-0">Escolha operadora e planos</h3>
                            </div>
                            <div className="grid gap-3 lg:grid-cols-[280px_1fr]">
                                <div className="space-y-2 max-h-[340px] overflow-auto pr-1">
                                    {operators.map((op) => (
                                        <button
                                            key={op.id}
                                            type="button"
                                            className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                                                String(state.activeOperator) === String(op.id)
                                                    ? 'border-emerald-400/60 bg-emerald-500/10 text-white'
                                                    : 'border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10'
                                            }`}
                                            onClick={() => setState({ ...state, activeOperator: op.id })}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg border border-white/10 bg-white/5 grid place-items-center overflow-hidden">
                                                    {(op.logo && <img src={op.logo} alt="logo" className="max-w-full max-h-full object-contain" />) || op.name.slice(0, 2)}
                                                </div>
                                                <div>
                                                    <div className="font-semibold">{op.name}</div>
                                                    <div className="text-xs text-white/60">
                                                        {(planOptions[op.id] || []).length} plano(s)
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="m-0 text-sm uppercase tracking-[0.08em] text-white/60">Planos</h4>
                                        <span className="text-xs text-white/50">{activePlans.length} opção(ões)</span>
                                    </div>
                                    <div className="grid gap-2 md:grid-cols-2">
                                        {activePlans.map((plan) => (
                                            <div
                                                key={plan.id}
                                                className={`flex items-center justify-between rounded-xl border px-3 py-3 transition ${
                                                    isSelected(state.activeOperator, plan.id)
                                                        ? 'border-emerald-400/60 bg-emerald-500/10 text-white'
                                                        : 'border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-lg border border-white/10 bg-white/5 grid place-items-center overflow-hidden">
                                                        {plan.image ? (
                                                            <img
                                                                src={plan.image.startsWith('http') ? plan.image : `/storage/${plan.image}`}
                                                                alt="logo plano"
                                                                className="max-w-full max-h-full object-contain"
                                                            />
                                                        ) : (
                                                            operators.find((o) => String(o.id) === String(state.activeOperator))?.name.slice(0, 2)
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold leading-tight">{plan.name}</div>
                                                        <div className="text-xs text-white/60">
                                                            {operators.find((o) => String(o.id) === String(state.activeOperator))?.name || ''}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
                                                    type="button"
                                                    onClick={() => toggleSelection(state.activeOperator, plan.id)}
                                                >
                                                    {isSelected(state.activeOperator, plan.id) ? 'Selecionado' : 'Selecionar'}
                                                </button>
                                            </div>
                                        ))}
                                        {activePlans.length === 0 && (
                                            <div className="rounded-xl border border-dashed border-white/20 px-3 py-6 text-center text-white/60">
                                                Selecione uma operadora para ver os planos.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        )}
                    </div>

                    <aside className="rounded-2xl bg-[#0f1a2b] p-4 sticky top-6 self-start">
                        <div className="flex items-center gap-2 text-sm text-white/70">
                            <Building2 size={16} />
                            <span>Detalhes da comparação</span>
                        </div>
                        <div className="mt-4 space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-white/60">Distribuição</span>
                                <span className="font-semibold text-white">Geral</span>
                            </div>
                    <div className="flex items-center justify-between">
                        <span className="text-white/60">Total de vidas</span>
                        <span className="font-semibold text-white">{totalVidas}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-white/60">Modalidade</span>
                        <span className="font-semibold text-white">{state.modality || '-'}</span>
                    </div>
                            <div className="flex items-center justify-between">
                                <span className="text-white/60">Região</span>
                                <span className="font-semibold text-white">
                                    {data.regions?.find((r) => String(r.id) === String(state.region_id))?.name || '-'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-white/60">Tipo</span>
                                <span className="font-semibold text-white">{types[state.type] || state.type || '-'}</span>
                            </div>
                            <div className="h-px bg-white/10" />
                            <div className="text-xs text-white/50">
                                Criado por {creator} {formatSince(createdAt)}
                            </div>
                        </div>
                    </aside>
                </div>

                {false && (
                    <div className="mt-4 rounded-2xl border border-white/5 bg-[#0f1a2b] p-4 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
                        <div className="mb-3">
                            <div className="text-xs uppercase tracking-[0.18em] text-white/50 font-semibold">Distribuição</div>
                            <h3 className="text-lg font-semibold m-0">Edite o snapshot</h3>
                            <p className="text-xs text-white/60">Mantenha os valores para não alterar as regras.</p>
                        </div>
                        <div className="grid gap-3 md:grid-cols-3">
                            {Object.entries(faixas).map(([key, label]) => (
                                <label key={key} className="flex flex-col gap-1 text-sm text-white/70">
                                    <span className="text-white/60">{label}</span>
                                    <input
                                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-400/60 focus:ring-0"
                                        type="number"
                                        min="0"
                                        value={state.snapshot[key] || 0}
                                        onChange={(e) => updateSnapshot(key, e.target.value)}
                                    />
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {showHospitals && (
                <NetworkModal open={showHospitals} comparisonId={id} onClose={() => setShowHospitals(false)} />
            )}

            <Modal open={showLivesModal} onClose={() => setShowLivesModal(false)} title="Distribuição de vidas">
                <div className="grid lg:grid-cols-[1.4fr_0.8fr] gap-4">
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-white">Distribuição</label>
                            <select
                                className="w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-3 text-white outline-none focus:border-white/30"
                                value="Geral"
                                readOnly
                            >
                                <option>Geral</option>
                            </select>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {Object.entries(faixas).map(([key, label]) => (
                                <label key={key} className="space-y-1">
                                    <span className="text-xs font-semibold text-white/70">{label}</span>
                                    <input
                                        className="w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2.5 text-white outline-none focus:border-white/30"
                                        type="number"
                                        min="0"
                                        value={state.snapshot[key] || 0}
                                        onChange={(e) => updateSnapshot(key, e.target.value)}
                                    />
                                </label>
                            ))}
                        </div>
                        <div className="flex justify-start">
                            <button
                                className="rounded-lg border border-white/15 bg-white px-5 py-2.5 text-sm font-semibold text-[#0b1220] transition hover:border-white/30 hover:bg-white"
                                type="button"
                                onClick={() => setShowLivesModal(false)}
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-4">
                        <h4 className="text-base font-semibold text-white">Quantidade de vidas</h4>
                        <p className="mt-2 text-sm text-white/70">
                            Informe a quantidade de vidas por faixa etária ou utilize o conversor de datas de nascimento.
                        </p>
                    </div>
                </div>
            </Modal>

            <Drawer open={showConfigDrawer} onClose={() => setShowConfigDrawer(false)} title="Configuração do plano" side="left">
                <div className="space-y-3">
                    <label className="space-y-1 text-sm text-white/80">
                        <span className="font-semibold">Modalidade*</span>
                        <select
                            className="w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2.5 text-white outline-none focus:border-white/30"
                            value={state.modality}
                            onChange={(e) => setState({ ...state, modality: e.target.value })}
                        >
                            {(data.modalities || []).map((m) => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="space-y-1 text-sm text-white/80">
                        <span className="font-semibold">Região*</span>
                        <select
                            className="w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2.5 text-white outline-none focus:border-white/30"
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
                    <label className="space-y-1 text-sm text-white/80">
                        <span className="font-semibold">Faixa de Vidas*</span>
                        <select
                            className="w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2.5 text-white outline-none focus:border-white/30"
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
                    <label className="space-y-1 text-sm text-white/80">
                        <span className="font-semibold">Tipo de Plano*</span>
                        <select
                            className="w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2.5 text-white outline-none focus:border-white/30"
                            value={state.type}
                            onChange={(e) => setState({ ...state, type: e.target.value })}
                        >
                            {Object.entries(types || {}).map(([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <div className="pt-2">
                        <button
                            className="group w-full inline-flex items-center justify-center gap-2 rounded-lg bg-white text-slate-900 px-5 py-2.5 text-sm font-semibold border border-white/70 transition hover:border-white hover:bg-white/90 disabled:opacity-60"
                            type="button"
                            onClick={() => setShowConfigDrawer(false)}
                        >
                            Continuar
                            <ArrowRight size={16} className="opacity-0 transition-opacity group-hover:opacity-100" />
                        </button>
                    </div>
                </div>
            </Drawer>

            <Drawer open={showPlansDrawer} onClose={() => setShowPlansDrawer(false)} title="Escolher planos" side="left" width="80vw">
                <div className="grid lg:grid-cols-[320px_1fr] gap-4">
                    <div className="space-y-3">
                        <div className="text-sm font-semibold text-white">Filtros</div>
                        <div className="text-xs text-white/60">Operadoras</div>
                        <input
                            className="w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2.5 text-white outline-none focus:border-white/30"
                            placeholder="Busque por operadora ou plano"
                        />
                        <label className="space-y-1 text-sm text-white/80">
                            <span className="font-semibold">Cidade</span>
                            <select className="w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2.5 text-white outline-none focus:border-white/30">
                                <option>Todas</option>
                            </select>
                        </label>
                        <label className="space-y-1 text-sm text-white/80">
                            <span className="font-semibold">Modalidade</span>
                            <select className="w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2.5 text-white outline-none focus:border-white/30">
                                <option>Todas</option>
                            </select>
                        </label>
                        <button
                            className="w-full rounded-lg border border-white/15 bg-transparent px-4 py-2 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/5"
                            type="button"
                        >
                            Limpar filtros
                        </button>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-semibold text-white">Operadoras</div>
                                <div className="text-xs text-white/60">Escolha a operadora e os planos</div>
                            </div>
                            <button
                                className="group inline-flex items-center gap-2 rounded-lg bg-white text-slate-900 px-4 py-2 text-sm font-semibold border border-white/70 transition hover:border-white hover:bg-white/90 disabled:opacity-60"
                                type="button"
                                onClick={() => setShowPlansDrawer(false)}
                            >
                                Continuar
                                <ArrowRight size={16} className="opacity-0 transition-opacity group-hover:opacity-100" />
                            </button>
                        </div>

                        <div className="space-y-2 max-h-48 overflow-auto pr-1">
                            {operators.map((op) => (
                                <button
                                    key={op.id}
                                    type="button"
                                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                                        String(state.activeOperator) === String(op.id)
                                            ? 'border-emerald-400/60 bg-emerald-500/10 text-white'
                                            : 'border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10'
                                    }`}
                                    onClick={() => setState({ ...state, activeOperator: op.id })}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg border border-white/10 bg-white/5 grid place-items-center overflow-hidden">
                                                {(op.logo && <img src={op.logo} alt="logo" className="max-w-full max-h-full object-contain" />) || op.name.slice(0, 2)}
                                            </div>
                                            <div>
                                                <div className="font-semibold">{op.name}</div>
                                                <div className="text-xs text-white/60">
                                                    {(planOptions[op.id] || []).length} plano(s)
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div>
                            <div className="text-sm font-semibold text-white">Planos</div>
                            <div className="text-xs text-white/60 mb-2">Selecione uma operadora para listar planos.</div>
                            <div className="grid gap-2 md:grid-cols-2">
                                {activePlans.map((plan) => (
                                    <div
                                        key={plan.id}
                                        className={`flex items-center justify-between rounded-xl border px-3 py-3 transition ${
                                            isSelected(state.activeOperator, plan.id)
                                                ? 'border-emerald-400/60 bg-emerald-500/10 text-white'
                                                : 'border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg border border-white/10 bg-white/5 grid place-items-center overflow-hidden">
                                                {plan.image ? (
                                                    <img
                                                        src={plan.image.startsWith('http') ? plan.image : `/storage/${plan.image}`}
                                                        alt="logo plano"
                                                        className="max-w-full max-h-full object-contain"
                                                    />
                                                ) : (
                                                    operators.find((o) => String(o.id) === String(state.activeOperator))?.name.slice(0, 2)
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-semibold leading-tight">{plan.name}</div>
                                                <div className="text-xs text-white/60">
                                                    {operators.find((o) => String(o.id) === String(state.activeOperator))?.name || ''}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
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
            </Drawer>

            {error && <div className="alert">{error}</div>}
        </div>
    );
}
