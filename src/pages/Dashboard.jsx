
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get } from '../services/api/client';
import { Spinner, EmptyState } from '../components/ui';

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [comparisons, setComparisons] = useState([]);
    const [comparisonsLoading, setComparisonsLoading] = useState(true);
    const [comparisonsError, setComparisonsError] = useState(null);
    const navigate = useNavigate();

    const totalComparisons = comparisons.length;
    const sortedComparisons = useMemo(
        () =>
            [...comparisons].sort(
                (a, b) => new Date(b.created_at ?? '') - new Date(a.created_at ?? ''),
            ),
        [comparisons],
    );
    const recentComparisons = useMemo(() => sortedComparisons.slice(0, 3), [sortedComparisons]);

    const modalityCounts = useMemo(() => {
        const counts = {};
        comparisons.forEach((cmp) => {
            const mod = cmp.modality || 'Outros';
            counts[mod] = (counts[mod] || 0) + 1;
        });
        return counts;
    }, [comparisons]);

    const regionCounts = useMemo(() => {
        const counts = {};
        comparisons.forEach((cmp) => {
            const region = cmp.region || 'Sem região';
            counts[region] = (counts[region] || 0) + 1;
        });
        return counts;
    }, [comparisons]);

    const topModality = useMemo(() => {
        const entries = Object.entries(modalityCounts);
        if (!entries.length) return null;
        return entries.sort((a, b) => b[1] - a[1])[0];
    }, [modalityCounts]);

    const topRegion = useMemo(() => {
        const entries = Object.entries(regionCounts);
        if (!entries.length) return null;
        return entries.sort((a, b) => b[1] - a[1])[0];
    }, [regionCounts]);

    const analysisLines = useMemo(() => {
        if (!totalComparisons) return ['Ainda não há cotações registradas.'];
        const lines = [
            `Você criou ${totalComparisons} ${totalComparisons === 1 ? 'cotação' : 'cotações'} até agora.`,
        ];
        if (topModality) {
            lines.push(`O perfil domina por ${topModality[0]} (${Math.round((topModality[1] / totalComparisons) * 100)}%).`);
        }
        if (topRegion) {
            lines.push(`A região mais frequente é ${topRegion[0]} com ${topRegion[1]} registros.`);
        }
        if (recentComparisons.length) {
            lines.push(`As últimas cotações foram para ${recentComparisons.map((cmp) => cmp.title || `#${cmp.id}`).join(', ')}.`);
        }
        return lines;
    }, [totalComparisons, topModality, topRegion, recentComparisons]);

    useEffect(() => {
        const fetchMe = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await get('/me');
                setUser(res.data?.user || res.data);
            } catch (err) {
                setError(err.message || 'Não autenticado');
                setTimeout(() => navigate('/app/login'), 400);
            } finally {
                setLoading(false);
            }
        };
        fetchMe();
    }, [navigate]);

    useEffect(() => {
        let active = true;
        const fetchComparisons = async () => {
            setComparisonsLoading(true);
            setComparisonsError(null);
            try {
                const res = await get('/comparisons');
                if (!active) return;
                const payload = res.data?.data ?? res.data ?? [];
                setComparisons(Array.isArray(payload) ? payload : []);
            } catch (err) {
                if (!active) return;
                setComparisonsError(err.message || 'Erro ao carregar cotações');
            } finally {
                if (!active) return;
                setComparisonsLoading(false);
            }
        };
        fetchComparisons();
        return () => {
            active = false;
        };
    }, []);

    if (loading) return <Spinner />;
    if (error) return <div className="alert">{error}</div>;
    if (!user) return <EmptyState description="Nenhum usuário carregado." />;

    return (
        <section className="card dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>Dashboard</h1>
                    <p>
                        Bem-vindo, {user.name || 'usuário'}. Essa visão consolida as cotações que você salvou,
                        permitindo entender quais segmentos mais aparecem e como anda o pipeline.
                    </p>
                </div>
                <div className="dashboard-meta">
                    <span className="muted">Protegido via /api/v1/me</span>
                    <span className="muted">Autenticação: Sanctum (cookies)</span>
                </div>
            </div>

            <div className="dashboard-grid">
                <article className="dashboard-panel">
                    <h2>Visão geral</h2>
                    <div className="metrics-row">
                        <div>
                            <p>Total de cotações</p>
                            <strong>{totalComparisons}</strong>
                        </div>
                        <div>
                            <p>Recentes</p>
                            <strong>{recentComparisons.length}</strong>
                        </div>
                    </div>
                    <p className="muted">
                        {comparisonsLoading && 'Carregando cotações...'}
                        {comparisonsError && `Erro: ${comparisonsError}`}
                        {!comparisonsLoading && !comparisonsError && `Última atualização: ${recentComparisons[0]?.created_at ? new Date(recentComparisons[0].created_at).toLocaleString('pt-BR') : '—'}`}
                    </p>
                </article>

                <article className="dashboard-panel">
                    <h2>Modalidades</h2>
                    <div className="bar-group">
                        {Object.entries(modalityCounts).map(([label, value]) => {
                            const pct = totalComparisons ? Math.round((value / totalComparisons) * 100) : 0;
                            return (
                                <div className="bar-row" key={label}>
                                    <div className="bar-row__labels">
                                        <span>{label}</span>
                                        <span>{value} ({pct}%)</span>
                                    </div>
                                    <div className="bar-row__track">
                                        <div className="bar-row__fill" style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                        {!Object.keys(modalityCounts).length && <p className="muted">Sem dados ainda.</p>}
                    </div>
                </article>

                <article className="dashboard-panel">
                    <h2>Regiões</h2>
                    <div className="bar-group">
                        {Object.entries(regionCounts).map(([label, value]) => {
                            const pct = totalComparisons ? Math.round((value / totalComparisons) * 100) : 0;
                            return (
                                <div className="bar-row" key={label}>
                                    <div className="bar-row__labels">
                                        <span>{label}</span>
                                        <span>{value} ({pct}%)</span>
                                    </div>
                                    <div className="bar-row__track">
                                        <div className="bar-row__fill" style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                        {!Object.keys(regionCounts).length && <p className="muted">Sem dados ainda.</p>}
                    </div>
                </article>
            </div>

            <article className="dashboard-panel dashboard-analysis">
                <h2>Análise rápida</h2>
                <p>Aqui estão alguns destaques para orientar suas próximas ações:</p>
                <ul>
                    {analysisLines.map((line) => (
                        <li key={line}>{line}</li>
                    ))}
                </ul>
            </article>

            <article className="dashboard-panel dashboard-recent">
                <h2>Últimas cotações</h2>
                {comparisonsLoading ? (
                    <Spinner size="sm" />
                ) : comparisonsError ? (
                    <div className="alert">{comparisonsError}</div>
                ) : (
                    <ul className="recent-list">
                        {recentComparisons.map((cmp) => (
                            <li key={cmp.id}>
                                <strong>{cmp.title || `#${cmp.id}`}</strong>
                                <span>
                                    {cmp.region || 'Sem região'} · {cmp.modality || '—'} ·{' '}
                                    {cmp.created_at ? new Date(cmp.created_at).toLocaleDateString('pt-BR') : '—'}
                                </span>
                            </li>
                        ))}
                        {!recentComparisons.length && <li className="muted">Ainda não há cotações.</li>}
                    </ul>
                )}
            </article>
        </section>
    );
}
