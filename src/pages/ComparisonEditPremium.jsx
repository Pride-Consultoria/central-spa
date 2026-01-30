import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Building2, ArrowRight } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import NetworkModal from '../components/presentation/NetworkModal';
import Drawer from '../components/ui/Drawer';
import ComparisonHeaderActions from '../components/comparisons/ComparisonHeaderActions';
import ConfigDrawer from '../components/comparisons/ConfigDrawer';
import LivesModal from '../components/comparisons/LivesModal';
import PlansList from '../components/comparisons/PlansList';
import useComparison from '../utils/useComparison';
import useComparisonEditState from '../hooks/useComparisonEditState';
import '../styles.css';

const PLAN_TYPE_LABELS = {
    COM: 'Com coparticipação',
    SEM: 'Sem coparticipação',
    PARC: 'Parcial',
};

export default function ComparisonEditPremium() {
    const { id } = useParams();
    const { data, loading, error, saving, setError, save: persist } = useComparison(id);
    const [showHospitals, setShowHospitals] = useState(false);
    const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
    const [planMenuOpen, setPlanMenuOpen] = useState(null);
    const [saveMessage, setSaveMessage] = useState('');
    const [showLivesModal, setShowLivesModal] = useState(false);
    const [showConfigDrawer, setShowConfigDrawer] = useState(false);
    const [showPlansDrawer, setShowPlansDrawer] = useState(false);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
    const {
        state,
        sortableIds,
        totalVidas,
        toggleSelection,
        markClient,
        markFeatured,
        removeSelection,
        updateSnapshot,
        setActiveOperator,
        updateField,
        handleReorder,
    } = useComparisonEditState(data);
    const operators = data?.operators || [];
    const faixas = data?.faixas || {};
    const planOptions = data?.planOptions || {};
    const livesRanges = data?.livesRanges || [];
    const planValues = data?.planValues || [];
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

    const save = async (silent = false) => {
        setError(null);
        const payload = {
            title: state.title,
            modality: state.modality,
            region_id: state.region_id,
            lives_range: state.lives_range,
            type: state.type,
            snapshot: state.snapshot,
            comparisonPlans: state.selections,
        };
        try {
            await persist(payload, { silent });
            if (!silent) {
                setSaveMessage('Salvo com sucesso');
                setTimeout(() => setSaveMessage(''), 3000);
            }
        } catch (err) {
            if (!silent) {
                setError(err.message || 'Erro ao salvar');
            }
        }
    };

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

    const computePlanTotal = (planId, forcedType = null) => {
        const pv = planValues.find(
            (p) =>
                String(p.plan_id) === String(planId) &&
                String(p.region_id) === String(state.region_id) &&
                String(p.type) === String(forcedType ?? state.type) &&
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

    const computeTotalsForSelection = (sel) => {
        const withCopay = computePlanTotal(sel?.plan_id, 'COM');
        const partialCopay = computePlanTotal(sel?.plan_id, 'PARC');
        const withoutCopay = computePlanTotal(sel?.plan_id, 'SEM');
        // Se nÇœo encontrar planValues, mantemos qualquer valor vindo da API para evitar "ƒ?" inicial.
        return {
            with: withCopay ?? sel?.total_with_coparticipation ?? null,
            partial: partialCopay ?? sel?.total_coparticipacao_parcial ?? null,
            without: withoutCopay ?? sel?.total_without_coparticipation ?? null,
        };
    };

    const calculateTotalForSelection = (sel) =>
        computePlanTotal(sel?.plan_id) ??
        sel?.total ??
        sel?.price ??
        sel?.value ??
        sel?.monthly_cost ??
        null;

    const copyPresentationLink = async () => {
        const url = `${window.location.origin}/app/comparisons/${id}/presentation`;
        try {
            await navigator.clipboard.writeText(url);
        } catch (err) {
            // fallback silencioso
        } finally {
            setHeaderMenuOpen(false);
        }
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
                            Comparação #{id}
                        </div>
                        <h1 className="text-3xl font-bold leading-tight">{state.title || 'Sem título'}</h1>
                        {/* textos removidos conforme solicitação */}
                    </div>
                    <ComparisonHeaderActions
                        id={id}
                        state={state}
                        saving={saving}
                        onSave={() => save()}
                        onEditLives={() => setShowLivesModal(true)}
                        onEditConfig={() => setShowConfigDrawer(true)}
                        onEditPlans={() => setShowPlansDrawer(true)}
                        headerMenuOpen={headerMenuOpen}
                        setHeaderMenuOpen={setHeaderMenuOpen}
                        copyPresentationLink={copyPresentationLink}
                    />
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
                            <PlansList
                                sortableIds={sortableIds}
                                selections={state.selections}
                                planOptions={planOptions}
                                operators={operators}
                                types={PLAN_TYPE_LABELS}
                                stateType={state.type}
                                modality={state.modality}
                                livesRange={state.lives_range}
                                planMenuOpen={planMenuOpen}
                                setPlanMenuOpen={setPlanMenuOpen}
                                onMarkClient={markClient}
                                onMarkFeatured={markFeatured}
                                onRemove={removeSelection}
                                livesRanges={livesRanges}
                                formatCurrency={formatCurrency}
                                totalFor={calculateTotalForSelection}
                                computeTotals={computeTotalsForSelection}
                                sensors={sensors}
                                onDragEnd={({ active, over }) => {
                                    if (!over) return;
                                    const oldIndex = sortableIds.indexOf(active.id);
                                    const newIndex = sortableIds.indexOf(over.id);
                                    if (oldIndex !== -1 && newIndex !== -1) {
                                        handleReorder(oldIndex, newIndex);
                                    }
                                }}
                                DndContext={DndContext}
                                closestCenter={closestCenter}
                            />
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
                                    onClick={() => setActiveOperator(op.id)}
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
                                <span className="font-semibold text-white">{PLAN_TYPE_LABELS[state.type] || state.type || '-'}</span>
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

            <LivesModal
                open={showLivesModal}
                onClose={() => setShowLivesModal(false)}
                faixas={faixas}
                snapshot={state.snapshot}
                updateSnapshot={updateSnapshot}
            />

            <ConfigDrawer
                open={showConfigDrawer}
                onClose={() => setShowConfigDrawer(false)}
                state={state}
                updateField={updateField}
                data={data || {}}
            />

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
                                    onClick={() => setActiveOperator(op.id)}
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
