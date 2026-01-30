import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil } from "lucide-react";
import { Input, Table, Spinner, EmptyState, DropdownContent, DropdownItem } from "../components/ui";
import IconButton from "../components/ui/IconButton";
import useComparisonsList from "../utils/useComparisonsList";

export default function ComparisonsList() {
    const [openMenuId, setOpenMenuId] = useState(null);
    const { data, loading, error, debounceSearch } = useComparisonsList();

    useEffect(() => () => setOpenMenuId(null), []);

    const columns = [
        { label: "ID", accessor: "id" },
        { label: "Título", accessor: "title" },
        { label: "Região", accessor: "region" },
        { label: "Faixa de vidas", accessor: "lives_range" },
        { label: "Tipo", accessor: "type" },
        { label: "Criado em", accessor: (row) => new Date(row.created_at).toLocaleDateString("pt-BR") },
        {
            label: "Ações",
            accessor: (row) => (
                <div className="relative inline-block text-left">
                    <IconButton
                        aria-label="Abrir ações"
                        onClick={() => setOpenMenuId(openMenuId === row.id ? null : row.id)}
                    >
                        &#8942;
                    </IconButton>
                    {openMenuId === row.id && (
                        <DropdownContent className="shadow-lg">
                            <DropdownItem
                                as={Link}
                                to={`/app/comparisons/${row.id}/edit`}
                                onClick={() => setOpenMenuId(null)}
                            >
                                <Pencil size={16} />
                                <span>Editar</span>
                            </DropdownItem>
                        </DropdownContent>
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
            <Link to="/app/comparisons/create" className="fab-create" aria-label="Nova comparação">
                <Plus size={22} />
            </Link>
        </section>
    );
}
