const Row = ({ label, value, accent }) => (
    <div className="flex items-center justify-between">
        <span className="text-white/60">{label}</span>
        <span className={`font-semibold text-white ${accent ? 'text-emerald-300' : ''}`}>
            {value}
        </span>
    </div>
);

export default function ComparisonSidePanel({
    distributionLabel = 'Geral',
    livesCount = 0,
    modality,
    region,
    typeLabel,
    cnpj = 'Não informado',
    contact = 'Nenhum',
    business = 'Nenhum',
    createdBy,
    createdAtRelative,
}) {
    return (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0f1a2b] p-4 shadow-[0_16px_60px_rgba(0,0,0,0.45)]">
            <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Distribuição</div>
                <div className="flex items-center justify-between">
                    <div className="text-base font-semibold text-white">{distributionLabel}</div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
                        {livesCount} vidas
                    </span>
                </div>
            </div>

            <div className="space-y-3 text-sm">
                <Row label="CNPJ" value={cnpj} />
                <Row label="Contato" value={contact} />
                <Row label="Negócio" value={business} />
                <div className="h-px bg-white/10" />
                <Row label="Modalidade" value={modality || '-'} />
                <Row label="Região" value={region || '-'} />
                <Row label="Tipo" value={typeLabel || '-'} />
            </div>

            <div className="h-px bg-white/10" />

            <div className="text-xs text-white/60">
                Criada por {createdBy || '-'} {createdAtRelative || ''}
            </div>
        </div>
    );
}
