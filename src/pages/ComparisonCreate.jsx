import { useEffect, useState } from "react";
import { get, post } from "../services/api/client";
import { listClients, createClient } from "../services/clients";
import { Button, Input, Spinner, EmptyState } from "../components/ui";
import { UserCheck, UserPlus } from "lucide-react";

const MODALITIES = ["MEI", "PME", "EMPRESARIAL", "OPCIONAL"];
const TYPES = ["COM", "SEM", "PARC"];

export default function ComparisonCreate() {
    const [bootstrap, setBootstrap] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [form, setForm] = useState({
        title: "",
        modality: MODALITIES[0],
        region_id: "",
        lives_range: "0-0",
        type: TYPES[0],
        snapshot: {},
        clientId: "",
        clientName: "",
        clientExternalId: "",
    });
    const [clients, setClients] = useState([]);
    const [clientsLoading, setClientsLoading] = useState(true);
    const [clientsError, setClientsError] = useState(null);
    const [clientForm, setClientForm] = useState({
        name: "",
        phone: "",
        email: "",
        external_id: "",
    });
    const [creatingClient, setCreatingClient] = useState(false);
    const [clientActionError, setClientActionError] = useState(null);
    const [showAddClientModal, setShowAddClientModal] = useState(false);
    const [showNewClientModal, setShowNewClientModal] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await get("/comparisons/bootstrap");
                const b = res.data || {};
                const defaultRegion = b.regions?.[0]?.id || "";
                const defaultLives = b.livesRanges?.[0] || "0-0";
                const snapshot = Object.fromEntries(Object.keys(b.faixas || {}).map((k) => [k, 0]));
                setBootstrap(b);
                setForm((prev) => ({
                    ...prev,
                    region_id: defaultRegion,
                    lives_range: defaultLives,
                    snapshot,
                }));
            } catch (err) {
                setError(err.message || "Erro ao carregar");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        let active = true;
        const loadClients = async () => {
            setClientsLoading(true);
            setClientsError(null);
            try {
                const res = await listClients();
                if (!active) return;
                setClients(res.data || []);
            } catch (err) {
                if (!active) return;
                setClientsError(err.message || "Erro ao carregar clientes");
            } finally {
                if (!active) return;
                setClientsLoading(false);
            }
        };
        loadClients();
        return () => {
            active = false;
        };
    }, []);

    const handleClientSelect = (value) => {
        const selectedId = value || "";
        const client = clients.find((c) => String(c.id) === selectedId);
        setForm((prev) => ({
            ...prev,
            clientId: selectedId,
            clientName: client ? client.name : prev.clientName,
            clientExternalId: client ? client.external_id || "" : prev.clientExternalId,
        }));
    };

    const handleCreateClient = async () => {
        if (!clientForm.name) {
            setClientActionError("Informe o nome do cliente.");
            return;
        }
        setCreatingClient(true);
        setClientActionError(null);
        let success = false;
        try {
            const res = await createClient(clientForm);
            const created = res.data;
            if (created) {
                setClients((prev) => [...prev, created]);
                setForm((prev) => ({
                    ...prev,
                    clientId: String(created.id),
                    clientName: created.name,
                    clientExternalId: created.external_id || "",
                }));
                setClientForm({
                    name: "",
                    phone: "",
                    email: "",
                    external_id: "",
                });
                success = true;
            }
        } catch (err) {
            setClientActionError(err.message || "Erro ao criar cliente.");
        } finally {
            setCreatingClient(false);
        }
        return success;
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            const payload = {
                title: form.title || "Sem título",
                modality: form.modality || MODALITIES[0],
                region_id: form.region_id,
                lives_range: form.lives_range,
                type: form.type,
                snapshot: form.snapshot,
                client_id: form.clientId ? Number(form.clientId) : null,
                client_name: form.clientName || null,
                client_external_id: form.clientExternalId || null,
                comparisonPlans: [],
            };
            const res = await post("/comparisons", payload);
            const id = res?.data?.id;
            if (id) {
                window.location.href = `/app/comparisons/${id}/edit`;
            } else {
                setError("Não foi possível obter o ID criado.");
            }
        } catch (err) {
            setError(err.message || "Erro ao criar cotação");
        }
    };

    if (loading) return <Spinner />;
    if (error) return <div className="alert">{error}</div>;
    if (!bootstrap) return <EmptyState />;

    return (
        <section className="card mx-auto max-w-4xl space-y-6 px-6 py-6 lg:px-8 lg:py-8">
            <h1>Criar cotação</h1>
            <p className="muted">Informe um nome fácil para a cotação e siga para completar os dados.</p>
            <form className="form space-y-6" onSubmit={onSubmit}>
                <Input
                    label="Nome da cotação"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Ex: Empresa ABC - 10 vidas - SP"
                />
                <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0f172a] p-4 flex flex-col gap-3">
                    <div className="text-sm font-semibold text-white">Cliente</div>
                    <Button
                        type="button"
                        variant="outline"
                        className="justify-start flex items-center gap-2"
                        onClick={() => setShowAddClientModal(true)}
                    >
                        <UserCheck size={16} />
                        Adicionar cliente
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="justify-start flex items-center gap-2"
                        onClick={() => setShowNewClientModal(true)}
                    >
                        <UserPlus size={16} />
                        Criar novo cliente
                    </Button>
                    {(form.clientName || form.clientExternalId) && (
                        <div className="text-xs text-white/60">
                            {form.clientName && <div>Nome: {form.clientName}</div>}
                            {form.clientExternalId && <div>ID: {form.clientExternalId}</div>}
                        </div>
                    )}
                </div>
                <input type="hidden" value={form.modality} readOnly />
                <input type="hidden" value={form.region_id} readOnly />
                <input type="hidden" value={form.lives_range} readOnly />
                <input type="hidden" value={form.type} readOnly />
                {Object.keys(bootstrap.faixas || {}).map((key) => (
                    <input key={key} type="hidden" value={form.snapshot[key] || 0} readOnly />
                ))}
                <Button type="submit" style={{ marginTop: 14 }}>Continuar</Button>
                {error && <div className="alert" style={{ marginTop: 8 }}>{error}</div>}
            </form>

            {showAddClientModal && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f172a] p-6 text-left shadow-[0_20px_60px_rgba(2,6,23,0.8)]">
                        <div className="mb-3 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-white m-0">Selecionar cliente</h3>
                                <p className="text-xs text-white/60 m-0">Vincule um cliente já existente à cotação.</p>
                            </div>
                            <button
                                type="button"
                                className="text-white/60 transition hover:text-white"
                                onClick={() => setShowAddClientModal(false)}
                            >
                                Fechar
                            </button>
                        </div>
                        <label className="space-y-1 text-sm text-white/80">
                            <span className="font-semibold">Cliente existente</span>
                            <select
                                className="w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2.5 text-white outline-none focus:border-white/30"
                                value={form.clientId}
                                onChange={(e) => handleClientSelect(e.target.value)}
                            >
                                {clientsLoading ? (
                                    <option value="">Carregando clientes...</option>
                                ) : (
                                    <>
                                        <option value="">Selecione um cliente (opcional)</option>
                                        {clients.map((client) => (
                                            <option key={client.id} value={String(client.id)}>
                                                {client.name} {client.external_id ? `- ${client.external_id}` : ""}
                                            </option>
                                        ))}
                                    </>
                                )}
                            </select>
                        </label>
                        {clientsError && <div className="alert">{clientsError}</div>}
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40"
                                onClick={() => setShowAddClientModal(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="rounded-xl bg-gradient-to-r from-emerald-400 to-sky-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:opacity-90"
                                onClick={() => setShowAddClientModal(false)}
                            >
                                Aplicar cliente
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showNewClientModal && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f172a] p-6 text-left shadow-[0_20px_60px_rgba(2,6,23,0.8)]">
                        <div className="mb-3 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-white m-0">Criar cliente</h3>
                                <p className="text-xs text-white/60 m-0">Adicione um cliente novo e vincule-o à cotação.</p>
                            </div>
                            <button
                                type="button"
                                className="text-white/60 transition hover:text-white"
                                onClick={() => setShowNewClientModal(false)}
                            >
                                Fechar
                            </button>
                        </div>
                        <div className="space-y-3">
                            <Input
                                label="Nome"
                                value={clientForm.name}
                                onChange={(e) => setClientForm((prev) => ({ ...prev, name: e.target.value }))}
                                placeholder="Nome completo ou empresa"
                            />
                            <Input
                                label="Telefone"
                                value={clientForm.phone}
                                onChange={(e) => setClientForm((prev) => ({ ...prev, phone: e.target.value }))}
                                placeholder="(00) 90000-0000"
                            />
                            <Input
                                label="Email"
                                value={clientForm.email}
                                onChange={(e) => setClientForm((prev) => ({ ...prev, email: e.target.value }))}
                                placeholder="contato@empresa.com"
                            />
                            <Input
                                label="ID Externo"
                                value={clientForm.external_id}
                                onChange={(e) => setClientForm((prev) => ({ ...prev, external_id: e.target.value }))}
                                placeholder="Identificador do CRM"
                            />
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40"
                                onClick={() => setShowNewClientModal(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="rounded-xl bg-gradient-to-r from-emerald-400 to-sky-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:opacity-90"
                                onClick={async () => {
                                    const created = await handleCreateClient();
                                    if (created) {
                                        setShowNewClientModal(false);
                                    }
                                }}
                                disabled={creatingClient}
                            >
                                {creatingClient ? "Criando cliente..." : "Salvar cliente"}
                            </button>
                        </div>
                        {clientActionError && <div className="alert mt-3">{clientActionError}</div>}
                    </div>
                </div>
            )}
        </section>
    );
}

