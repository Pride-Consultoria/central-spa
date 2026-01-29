import { CheckCircle2, MoreVertical } from 'lucide-react';

export default function PlanCard({
    logoUrl,
    logoFallback = '',
    operatorName,
    planName,
    meta = [],
    hospitalsCount,
    price,
    selected = false,
    statusLabel = 'Selecionado',
    badges = [],
    onDetails,
    onMenuToggle,
    menuContent,
}) {
    return (
        <div className="relative flex h-full flex-col gap-4 rounded-2xl border border-white/10 bg-[#0f1a2b] p-4 shadow-[0_16px_60px_rgba(0,0,0,0.45)] transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-[0_22px_70px_rgba(0,0,0,0.55)]">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="grid h-12 w-16 place-items-center overflow-hidden rounded-xl border border-white/10 bg-white/5">
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt="logo plano"
                                className="max-h-full max-w-full object-contain"
                            />
                        ) : (
                            <span className="text-sm text-white/70">{logoFallback || 'PL'}</span>
                        )}
                    </div>
                    <div>
                        <div className="text-[11px] uppercase tracking-[0.14em] text-white/60">
                            {operatorName || 'Operadora'}
                        </div>
                        <div className="text-lg font-semibold leading-tight text-white">{planName || 'Plano'}</div>
                    </div>
                </div>
                {onMenuToggle && (
                    <button
                        type="button"
                        className="dash-icon-btn"
                        aria-label="Abrir menu do plano"
                        onClick={onMenuToggle}
                    >
                        <MoreVertical size={18} />
                    </button>
                )}
                {menuContent}
            </div>

            <div className="space-y-2 text-sm text-white/70">
                {meta.map((line, idx) => (
                    <div key={`${line?.label || line}-${idx}`} className="flex items-center justify-between">
                        <span className="text-white/50">{line?.label || ''}</span>
                        <span className="font-semibold text-white">
                            {line?.value ?? line ?? '-'}
                        </span>
                    </div>
                ))}
                {typeof hospitalsCount === 'number' && (
                    <div className="flex items-center justify-between">
                        <span className="text-white/50">Hospitais</span>
                        <span className="font-semibold text-white">
                            {hospitalsCount > 0 ? `${hospitalsCount} hospitais` : 'Não informado'}
                        </span>
                    </div>
                )}
            </div>

            {badges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {badges.map((badge) => (
                        <span
                            key={badge.label}
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                                badge.tone === 'info'
                                    ? 'bg-blue-500/15 text-blue-200'
                                    : badge.tone === 'success'
                                        ? 'bg-emerald-500/15 text-emerald-200'
                                        : 'bg-white/10 text-white/80'
                            }`}
                        >
                            {badge.label}
                        </span>
                    ))}
                </div>
            )}

            <div className="mt-auto flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 size={18} />
                    <span className="text-sm font-semibold">{statusLabel}</span>
                </div>
                <div className="text-xl font-bold text-white">{price}</div>
            </div>

            <button
                type="button"
                className="btn-light-outline mt-2 w-full justify-center"
                onClick={onDetails}
            >
                Ver detalhes
            </button>
        </div>
    );
}
