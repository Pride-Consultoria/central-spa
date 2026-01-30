import IconButton from '../ui/IconButton';
import { DropdownContent, DropdownItem } from '../ui/Dropdown';
import { UserCheck, Star, Trash2, GripVertical, MoreVertical, CheckCircle2 } from 'lucide-react';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { rectSortingStrategy } from '@dnd-kit/sortable';

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

export default function PlansList({
    sortableIds,
    selections,
    planOptions = {},
    operators = [],
    types = {},
    stateType,
    modality,
    livesRange,
    planMenuOpen,
    setPlanMenuOpen,
    onMarkClient,
    onMarkFeatured,
    onRemove,
    livesRanges = [],
    formatCurrency,
    totalFor,
    computeTotals,
    sensors,
    onDragStart,
    onDragEnd,
    onDragCancel,
    DndContext,
    closestCenter,
}) {
    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragCancel={onDragCancel}
        >
            <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {selections.map((sel, idx) => {
                        const plansForOperator = planOptions?.[sel.operator_id] || [];
                        const plan = plansForOperator.find((p) => String(p.id) === String(sel.plan_id));
                        const operatorName =
                            operators.find((o) => String(o.id) === String(sel.operator_id))?.name ||
                            plan?.operator_name ||
                            plan?.operator ||
                            '';
                        const hospitalsCount =
                            plan?.hospitals?.length ??
                            plan?.hospitals_count ??
                            plan?.hospitalsCount ??
                            sel.hospitals_count ??
                            0;
                        const totalBase = totalFor(sel);
                        const computedTotals = computeTotals ? computeTotals(sel) : {};
                        const totalWithCopay =
                            computedTotals.with ??
                            plan?.total_with_coparticipation ??
                            plan?.total_coparticipacao ??
                            sel?.total_with_coparticipation ??
                            sel?.total_coparticipacao ??
                            null;
                        const totalPartialCopay =
                            computedTotals.partial ??
                            plan?.total_partial_coparticipation ??
                            plan?.total_coparticipacao_parcial ??
                            sel?.total_partial_coparticipation ??
                            sel?.total_coparticipacao_parcial ??
                            null;
                        const totalWithoutCopay =
                            computedTotals.without ??
                            plan?.total_without_coparticipation ??
                            plan?.total_sem_coparticipacao ??
                            sel?.total_without_coparticipation ??
                            sel?.total_sem_coparticipacao ??
                            null;

                        // Valores exibidos: se não houver, mostramos "—" para evitar repetir fallback.
                        const displayWith = totalWithCopay ?? totalPartialCopay;
                        const displayParcial = totalPartialCopay;
                        const semUsaParcial = totalWithoutCopay == null && totalPartialCopay != null;
                        const displaySem = totalWithoutCopay ?? (semUsaParcial ? totalPartialCopay : null);
                        const typeLabel = types?.[stateType] || stateType || '-';
                        return (
                            <PlanSortableItem key={sortableIds[idx]} id={sortableIds[idx]}>
                                {() => (
                                    <>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="grid h-12 w-16 place-items-center overflow-hidden rounded-xl border border-white/10 bg-white/5">
                                                    {plan?.logo_url ? (
                                                        <img
                                                            src={plan.logo_url}
                                                            alt={plan?.name || 'logo plano'}
                                                            className="max-h-full max-w-full object-contain"
                                                        />
                                                    ) : (
                                                        <span className="text-sm text-white/70">
                                                            {operatorName?.[0]?.toUpperCase() || 'PL'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-sm text-white/60 uppercase tracking-[0.08em]">
                                                        {operatorName || 'Operadora'}
                                                    </div>
                                                    <div className="text-lg font-semibold leading-tight">{plan?.name || 'Plano'}</div>
                                                    <div className="text-xs text-white/50">{typeLabel}</div>
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <IconButton
                                                    aria-label="Ações do plano"
                                                    onClick={() =>
                                                        setPlanMenuOpen((prev) =>
                                                            prev === `${sel.operator_id}-${sel.plan_id}` ? null : `${sel.operator_id}-${sel.plan_id}`,
                                                        )
                                                    }
                                                >
                                                    <MoreVertical size={16} />
                                                </IconButton>
                                                {planMenuOpen === `${sel.operator_id}-${sel.plan_id}` && (
                                                    <DropdownContent>
                                                        <DropdownItem
                                                            className="text-xs"
                                                            onClick={() => {
                                                                onMarkClient(idx);
                                                                setPlanMenuOpen(null);
                                                            }}
                                                        >
                                                            <UserCheck size={14} />
                                                            <span>Plano do cliente</span>
                                                        </DropdownItem>
                                                        <DropdownItem
                                                            className="text-xs"
                                                            onClick={() => {
                                                                onMarkFeatured(idx);
                                                                setPlanMenuOpen(null);
                                                            }}
                                                        >
                                                            <Star size={14} />
                                                            <span>Indicação Pride</span>
                                                        </DropdownItem>
                                                        <DropdownItem
                                                            className="text-xs"
                                                            onClick={() => {
                                                                onRemove(idx);
                                                                setPlanMenuOpen(null);
                                                            }}
                                                        >
                                                            <Trash2 size={14} />
                                                            <span>Remover</span>
                                                        </DropdownItem>
                                                    </DropdownContent>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-3 space-y-2 text-sm text-white/70">
                                            <div className="flex items-center justify-between">
                                                <span className="text-white/50">Modalidade</span>
                                                <span className="font-semibold text-white">{modality || '-'}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-white/50">Faixa</span>
                                                <span className="font-semibold text-white">
                                                    {livesRange ||
                                                        livesRanges.find((lr) => lr === livesRange) ||
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
                        <div className="flex flex-col items-end gap-1 text-white">
                            <div className="text-xs text-white/60">Total com coparticipação</div>
                            <div className="text-sm font-semibold">
                                {displayWith != null ? formatCurrency(displayWith) : '—'}
                            </div>
                            <div className="text-xs text-white/60">Total com coparticipação parcial</div>
                            <div className="text-sm font-semibold">
                                {displayParcial != null ? formatCurrency(displayParcial) : '—'}
                            </div>
                            <div className="text-xs text-white/60">
                                {semUsaParcial ? 'Total com coparticipação parcial' : 'Total sem coparticipação'}
                            </div>
                            <div className="text-sm font-semibold">
                                {displaySem != null ? formatCurrency(displaySem) : '—'}
                            </div>
                        </div>
                                        </div>

                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {sel.is_client_plan && (
                                                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                                                    Plano do cliente
                                                </span>
                                            )}
                                            {sel.is_featured && (
                                                <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-200">
                                                    Indicação Pride
                                                </span>
                                            )}
                                        </div>
                                    </>
                                )}
                            </PlanSortableItem>
                        );
                    })}
                </div>
            </SortableContext>
        </DndContext>
    );
}
