import { useEffect, useMemo, useState } from 'react';
import { get } from '../services/api/client';
import { Button, Input, Table, Spinner, EmptyState, Pill } from '../components/ui';

const TABS = [
    { key: 'operators', label: 'Operadoras' },
    { key: 'plans', label: 'Planos' },
    { key: 'hospitals', label: 'Hospitais' },
];

export default function Reference() {
    const [tab, setTab] = useState('operators');
    const [search, setSearch] = useState('');
    const [operatorId, setOperatorId] = useState('');
    const [region, setRegion] = useState('');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [operators, setOperators] = useState([]);
    const [timer, setTimer] = useState(null);

    const debouncedSearch = useMemo(() => search, [search]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (tab === 'operators') {
                const res = await get('/reference/operators');
                setData(res.data || []);
                setOperators(res.data || []);
            } else if (tab === 'plans') {
                const params = new URLSearchParams();
                if (debouncedSearch) params.append('search', debouncedSearch);
                if (operatorId) params.append('operator_id', operatorId);
                const res = await get(`/reference/plans?${params.toString()}`);
                setData(res.data || []);
            } else if (tab === 'hospitals') {
                const params = new URLSearchParams();
                if (debouncedSearch) params.append('search', debouncedSearch);
                if (region) params.append('region', region);
                const res = await get(`/reference/hospitals?${params.toString()}`);
                setData(res.data || []);
            }
        } catch (err) {
            setError(err.message || 'Erro ao carregar');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, debouncedSearch, operatorId, region]);

    const onSearchChange = (val) => {
        if (timer) clearTimeout(timer);
        const t = setTimeout(() => setSearch(val), 300);
        setTimer(t);
    };

    const renderContent = () => {
        if (loading) return <Spinner />;
        if (error) return <div className="alert">{error}</div>;
        if (!data.length) return <EmptyState description="Nenhum resultado encontrado." />;

        if (tab === 'operators') {
            const columns = [
                { label: 'ID', accessor: 'id' },
                { label: 'Nome', accessor: 'name' },
                {
                    label: 'Logo',
                    accessor: (row) => (row.logo ? <img src={row.logo} alt={row.name} style={{ height: 28 }} /> : '-'),
                },
            ];
            return <Table columns={columns} data={data} />;
        }
        if (tab === 'plans') {
            const columns = [
                { label: 'ID', accessor: 'id' },
                { label: 'Plano', accessor: 'name' },
                { label: 'Operadora', accessor: (row) => row.operator?.name || row.operator_id },
                {
                    label: 'Imagem',
                    accessor: (row) => (row.image ? <img src={row.image} alt={row.name} style={{ height: 24 }} /> : '-'),
                },
            ];
            return <Table columns={columns} data={data} />;
        }
        // hospitals
        const columns = [
            { label: 'ID', accessor: 'id' },
            { label: 'Hospital', accessor: 'name' },
            { label: 'Região', accessor: 'region' },
            { label: 'Categoria', accessor: (row) => <Pill tone="info">{row.category || '-'}</Pill> },
        ];
        return <Table columns={columns} data={data} />;
    };

    return (
        <section className="card">
            <header className="section-header">
                <div>
                    <h1 style={{ margin: 0 }}>Referências</h1>
                    <p className="muted">Consulte operadoras, planos e hospitais.</p>
                </div>
            </header>
            <div className="tabs">
                {TABS.map((t) => (
                    <Button
                        key={t.key}
                        variant={tab === t.key ? 'primary' : 'secondary'}
                        onClick={() => setTab(t.key)}
                    >
                        {t.label}
                    </Button>
                ))}
            </div>
            <div className="filters">
                <Input
                    label="Busca"
                    placeholder="Digite para buscar"
                    defaultValue={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
                {tab === 'plans' && (
                    <label className="ui-field">
                        <span className="ui-field__label">Operadora</span>
                        <select
                            className="ui-input"
                            value={operatorId}
                            onChange={(e) => setOperatorId(e.target.value)}
                        >
                            <option value="">Todas</option>
                            {operators.map((op) => (
                                <option key={op.id} value={op.id}>
                                    {op.name}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
                {tab === 'hospitals' && (
                    <Input
                        label="Região"
                        placeholder="SP, RJ..."
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                    />
                )}
            </div>
            <div className="panel">{renderContent()}</div>
        </section>
    );
}
