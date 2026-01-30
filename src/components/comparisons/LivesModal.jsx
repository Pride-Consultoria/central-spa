import Modal from '../ui/Modal';

export default function LivesModal({ open, onClose, faixas = {}, snapshot = {}, updateSnapshot }) {
    return (
        <Modal open={open} onClose={onClose} title="Distribuição de vidas">
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
                                    value={snapshot[key] || 0}
                                    onChange={(e) => updateSnapshot(key, e.target.value)}
                                />
                            </label>
                        ))}
                    </div>
                    <div className="flex justify-start">
                        <button
                            className="rounded-lg border border-white/15 bg-white px-5 py-2.5 text-sm font-semibold text-[#0b1220] transition hover:border-white/30 hover:bg-white"
                            type="button"
                            onClick={onClose}
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
    );
}
