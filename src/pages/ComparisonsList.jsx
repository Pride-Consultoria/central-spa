import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { get } from '../services/api/client';
import { Button, Input, Table, Spinner, EmptyState } from '../components/ui';

export default function ComparisonsList() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [timer, setTimer] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);

    const fetchData = async (q = {}) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (q.search) params.append('search', q.search);
            const res = await get(`/comparisons?${params.toString()}`);
            setData(res.data || []);
        } catch (err) {
            setError(err.message || 'Erro ao carregar');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const debounceSearch = (val) => {
        if (timer) clearTimeout(timer);
        const t = setTimeout(() => {
            setSearch(val);
            fetchData({ search: val });
        }, 300);
        setTimer(t);
    };

    const columns = [
        { label: 'ID', accessor: 'id' },
        { label: 'Título', accessor: 'title' },
        { label: 'Região', accessor: 'region' },
        { label: 'Faixa de vidas', accessor: 'lives_range' },
        { label: 'Tipo', accessor: 'type' },
        { label: 'Criado em', accessor: (row) => new Date(row.created_at).toLocaleDateString('pt-BR') },
        {
            label: 'Ações',
            accessor: (row) => (
                <div className="relative inline-block text-left">
                    <button
                        type="button"
                        className="dash-icon-btn"
                        aria-label="Abrir ações"
                        onClick={() => setOpenMenuId(openMenuId === row.id ? null : row.id)}
                    >
                        &#8942;
                    </button>
                    {openMenuId === row.id && (
                        <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-white/10 bg-[#0f172a] shadow-lg">
                            <div className="flex flex-col text-sm text-white/80">
                                <Link
                                    to={`/app/comparisons/${row.id}/presentation`}
                                    className="px-3 py-2 hover:bg-white/5"
                                    onClick={() => setOpenMenuId(null)}
                                >
                                    Apresentação SPA
                                </Link>
                                <Link
                                    to={`/app/comparisons/${row.id}/edit`}
                                    className="px-3 py-2 hover:bg-white/5"
                                    onClick={() => setOpenMenuId(null)}
                                >
                                    Editar SPA
                                </Link>
                                <a
                                    href={`/comparisons/${row.id}/edit`}
                                    className="px-3 py-2 hover:bg-white/5"
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={() => setOpenMenuId(null)}
                                >
                                    Editar legacy
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            ),
        },
    ];

    return (
        <section className="card">
            <header className="section-header">
                <div>
                    <h1 style={{ margin: 0 }}>Comparações</h1>
                    <p className="muted">Lista de comparações disponíveis.</p>
                </div>
                <div className="cta">
                    <Link className="btn secondary" to="/app/comparisons/create">
                        Nova comparação (SPA)
                    </Link>
                    <a className="btn ghost" href="/comparisons/create">
                        Fluxo legacy
                    </a>
                </div>
            </header>
            <div className="filters">
                <Input label="Busca" placeholder="Título" onChange={(e) => debounceSearch(e.target.value)} />
            </div>
            {loading ? (
                <Spinner />
            ) : error ? (
                <div className="alert">{error}</div>
            ) : !data.length ? (
                <EmptyState description="Nenhuma comparação encontrada." />
            ) : (
                <Table columns={columns} data={data} />
            )}
        </section>
    );
}
