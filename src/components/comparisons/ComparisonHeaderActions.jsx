import IconButton from '../ui/IconButton';
import { DropdownContent, DropdownItem } from '../ui/Dropdown';
import { ArrowRight, MoreVertical, Pencil, Printer, Link as LinkIcon } from 'lucide-react';

export default function ComparisonHeaderActions({
    id,
    state,
    saving,
    onSave,
    onEditLives,
    onEditConfig,
    onEditPlans,
    headerMenuOpen,
    setHeaderMenuOpen,
    copyPresentationLink,
}) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-2">
                <button
                    className="rounded-lg border border-white/15 bg-[#0d1526] px-4 py-2 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-[#101a30]"
                    type="button"
                    onClick={onEditLives}
                >
                    Editar vidas
                </button>
                <button
                    className="rounded-lg border border-[#9fb5ff]/70 bg-[#1a2540] px-4 py-2 text-sm font-semibold text-[#dbe6ff] transition hover:border-[#c1d3ff] hover:bg-[#1f2c4d]"
                    type="button"
                    onClick={onEditConfig}
                >
                    Editar configurações
                </button>
                <button
                    className="rounded-lg border border-white/15 bg-[#0d1526] px-4 py-2 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-[#101a30]"
                    type="button"
                    onClick={onEditPlans}
                >
                    Escolher planos
                </button>
            </div>
            <button
                className="inline-flex items-center gap-2 rounded-lg bg-white text-slate-900 px-4 py-2 text-sm font-semibold border border-white/70 transition hover:border-white hover:bg-white/90 disabled:opacity-60"
                type="button"
                onClick={onSave}
                disabled={saving}
            >
                {saving ? 'Salvando...' : 'Continuar'}
                <ArrowRight size={16} />
            </button>
            <IconButton
                aria-label="Menu de ações"
                onClick={() => setHeaderMenuOpen((prev) => !prev)}
            >
                <MoreVertical size={18} />
            </IconButton>
            {headerMenuOpen && (
                <DropdownContent positionClass="absolute right-4 top-16 z-20" widthClass="w-56">
                    <div className="flex flex-col text-sm text-white/90">
                        <DropdownItem onClick={() => setHeaderMenuOpen(false)}>
                            <span className="flex items-center gap-2">
                                <Pencil size={16} />
                                Editar
                            </span>
                        </DropdownItem>
                        <DropdownItem
                            onClick={() => {
                                window.print();
                                setHeaderMenuOpen(false);
                            }}
                        >
                            <span className="flex items-center gap-2">
                                <Printer size={16} />
                                Imprimir
                            </span>
                        </DropdownItem>
                        <DropdownItem
                            onClick={() => {
                                copyPresentationLink();
                                setHeaderMenuOpen(false);
                            }}
                        >
                            <span className="flex items-center gap-2">
                                <LinkIcon size={16} />
                                Copiar link apresentação
                            </span>
                        </DropdownItem>
                    </div>
                </DropdownContent>
            )}
        </div>
    );
}
