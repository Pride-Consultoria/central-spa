import Drawer from '../ui/Drawer';
import { ArrowRight } from 'lucide-react';

export default function ConfigDrawer({ open, onClose, state, updateField, data = {} }) {
    return (
        <Drawer open={open} onClose={onClose} title="Configuração do plano" side="left">
            <div className="space-y-3">
                <label className="space-y-1 text-sm text-white/80">
                    <span className="font-semibold">Modalidade*</span>
                    <select
                        className="w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2.5 text-white outline-none focus:border-white/30"
                        value={state.modality}
                        onChange={(e) => updateField('modality', e.target.value)}
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
                        onChange={(e) => updateField('region_id', e.target.value)}
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
                        onChange={(e) => updateField('lives_range', e.target.value)}
                    >
                        {data.livesRanges?.map((lr) => (
                            <option key={lr} value={lr}>
                                {lr}
                            </option>
                        ))}
                    </select>
                </label>
                <div className="pt-2">
                    <button
                        className="group w-full inline-flex items-center justify-center gap-2 rounded-lg bg-white text-slate-900 px-5 py-2.5 text-sm font-semibold border border-white/70 transition hover:border-white hover:bg-white/90 disabled:opacity-60"
                        type="button"
                        onClick={onClose}
                    >
                        Continuar
                        <ArrowRight size={16} className="opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                </div>
            </div>
        </Drawer>
    );
}
