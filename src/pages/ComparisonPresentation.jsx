import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { get } from '../services/api/client';
import Spinner from '../components/ui/Spinner';
import '../styles/presentation.css';

const HERO_FEATURES = [
    'Pós-vendas especializado',
    'Consultoria especializada',
    'Seguro para portáteis',
    'Redução de custos',
    'Seguro auto, vida e residencial',
];

const currency = (value) =>
    Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

const COPART_LABELS = {
    consulta: 'Consulta (reembolso)',
    reembolso: 'Consulta (reembolso)',
    emergencia: 'Emergência',
    primeiros_socorros: 'Emergência',
    exames_basicos: 'Exames básicos',
    exames_especiais: 'Exames especiais',
    terapias: 'Terapias',
    internacao: 'Internação',
    coparticipacao_consulta: 'Coparticipação consulta',
};

const SLIDES = [
    { id: 'slide-1', label: 'Hero' },
    { id: 'slide-2', label: 'Planos' },
    { id: 'slide-3', label: 'Contexto' },
    { id: 'slide-4', label: 'Valores' },
    { id: 'slide-5', label: 'Diferenciais' },
    { id: 'slide-6', label: 'Rede' },
];

function NetworkModal({ open, type, plan, onClose }) {
    const [category, setCategory] = useState('__all');
    const list = plan ? plan[type] || [] : [];
    const categories = useMemo(() => {
        const set = new Set();
        list.forEach((item) => {
            if (item.category) set.add(item.category);
            (item.types || []).forEach((value) => value && set.add(value));
        });
        return ['__all', ...Array.from(set)];
    }, [list]);
    const filtered = useMemo(() => {
        if (category === '__all') return list;
        return list.filter((item) =>
            item.category === category || (item.types || []).includes(category),
        );
    }, [category, list]);

    if (!open || !plan) return null;

    return (
        <div className="network-modal open" role="dialog" aria-modal="true" onClick={onClose}>
            <div className="modal-card" onClick={(event) => event.stopPropagation()}>
                <div className="stack">
                    <div className="heading-with-tools" style={{ gap: '8px' }}>
                        <div className="badge">{type === 'hospitals_with_types' ? 'Hospitais' : 'Laboratórios'}</div>
                        <h3 style={{ margin: 0 }}>{plan.name}</h3>
                        <p style={{ margin: 0, color: 'var(--muted)' }}>{plan.operator}</p>
                    </div>
                    <div className="grid-2" style={{ gap: '10px' }}>
                        <select value={category} onChange={(event) => setCategory(event.target.value)}>
                            {categories.map((option) => (
                                <option key={option} value={option}>
                                    {option === '__all' ? 'Todas as categorias' : option}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="list">
                        {filtered.length
                            ? filtered.map((item, index) => (
                                  <div className="list-item" key={`network-${type}-${plan.id}-${index}`}>
                                      <strong>{item.name}</strong>
                                      <div style={{ color: 'var(--muted)', marginTop: 6 }}>
                                          Categoria: {item.category ?? '-'}
                                      </div>
                                      <div style={{ color: 'var(--muted)', marginTop: 4 }}>
                                          Tipos: {(item.types || []).join(', ') || '-'}
                                      </div>
                                  </div>
                              ))
                            : (
                                <div className="list-item">
                                    <strong>Nenhum registro encontrado</strong>
                                </div>
                              )}
                    </div>
                    <button className="pill featured" type="button" onClick={onClose} style={{ justifyContent: 'center' }}>
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ComparisonPresentation({ isPublic = false, comparisonId, signature }) {
    const params = useParams();
    const [searchParams] = useSearchParams();
    const id = comparisonId || params.id;
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [networkState, setNetworkState] = useState({ open: false, planId: null, type: 'hospitals_with_types' });
    const containerRef = useRef(null);
    const slideRefs = useRef({});
    const [activeSlide, setActiveSlide] = useState(SLIDES[0].id);

    const signatureParam = signature || searchParams.get('signature');
    const endpoint = `/public/comparisons/${id}/presentation?signature=${encodeURIComponent(signatureParam || '')}`;

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setError(null);
            try {
                const res = await get(endpoint);
                setData(res.data);
            } catch (err) {
                setError(err.message || 'Erro ao carregar apresentação.');
            } finally {
                setLoading(false);
            }
        }
        if (signatureParam) {
            fetchData();
        } else {
            setError('Assinatura obrigatória para acessar esta apresentação.');
            setLoading(false);
        }
    }, [endpoint, signatureParam]);

    const plans = data?.plans || [];
    const clientPlan = useMemo(() => plans.find((plan) => plan.is_client_plan), [plans]);
    const featuredPlan = useMemo(() => plans.find((plan) => plan.is_featured), [plans]);
    const typeLabel = {
        COM: 'Com Coparticipação',
        SEM: 'Sem Coparticipação',
        PARC: 'Parcial',
    }[data?.type] || data?.type;
    const advisors = useMemo(() => data?.userProfile || {}, [data]);
    const heroTitle = data?.title || `Comparação #${data?.id ?? id}`;
    const hashtag = `Apresentação personalizada`;

    const openNetwork = (planId, type) => {
        setNetworkState({ open: true, planId, type });
    };

    const closeNetwork = () => {
        setNetworkState((prev) => ({ ...prev, open: false }));
    };

    const navToSlide = (slideId) => {
        const target = slideRefs.current[slideId];
        if (target && containerRef.current) {
            containerRef.current.scrollTo({
                top: target.offsetTop,
                behavior: 'smooth',
            });
            setActiveSlide(slideId);
        }
    };

    useEffect(() => {
        if (!containerRef.current) return undefined;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const id = entry.target.getAttribute('data-slide-id');
                        if (id) {
                            setActiveSlide(id);
                        }
                    }
                });
            },
            {
                root: containerRef.current,
                threshold: 0.4,
            },
        );

        SLIDES.forEach(({ id }) => {
            const el = slideRefs.current[id];
            if (el) {
                observer.observe(el);
            }
        });

        return () => observer.disconnect();
    }, [data]);

    const networkPlan = plans.find((plan) => plan.id === networkState.planId);

    if (loading) {
        return <Spinner />;
    }

    if (error) {
        return (
            <div className="presentation-shell" style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
                <div className="panel" style={{ maxWidth: '480px', textAlign: 'center' }}>
                    <h2>Erro</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="presentation-shell" style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
                <div className="panel">
                    <p>Sem dados.</p>
                </div>
            </div>
        );
    }

    const networkSlides = plans.map((plan) => ({
        ...plan,
        hospitals_with_types: plan.hospitals_with_types || [],
        labs_detailed: plan.labs_detailed || [],
    }));

    return (
        <div className="presentation-shell">
            <div className="nav-dots" aria-label="Navegação por seções">
                {SLIDES.map((slide) => (
                    <button
                        key={slide.id}
                        type="button"
                        className={activeSlide === slide.id ? 'active' : ''}
                        aria-label={slide.label}
                        onClick={() => navToSlide(slide.id)}
                    />
                ))}
            </div>
            <div className="snap-container" ref={containerRef}>
                <section
                    id="slide-1"
                    className="slide"
                    data-slide-id="slide-1"
                    ref={(el) => {
                        if (el) slideRefs.current['slide-1'] = el;
                    }}
                >
                    <div className="slide-content hero-grid">
                        <div className="hero-left">
                            <div className="hero-brand">
                                <img
                                    src="/storage/logo-pride-branco.svg"
                                    alt="Logo Pride"
                                    className="hero-company-logo"
                                />
                                <div className="hero-badge">{hashtag}</div>
                            </div>
                            <div className="stack hero-copy">
                                <h1 className="title-lg">Bem-vindo(a), {heroTitle}</h1>
                                <p className="hero-subtitle">Você está sendo atendido pela corretora mais bem avaliada do Brasil!</p>
                                <p className="hero-subtitle">Além de planos de saúde, oferecemos outros produtos e serviços como:</p>
                            <div className="feature-list hero-features">
                                {HERO_FEATURES.map((feature) => (
                                    <div key={feature} className="feature-item">
                                        <span className="feature-icon">✓</span>
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>
                            </div>
                        </div>
                        <div className="panel advisor-card">
                            <div className="advisor-top">
                                <span className="avatar">
                                    {advisors.photo ? (
                                        <img src={advisors.photo} alt="Foto do consultor" />
                                    ) : (
                                        (advisors.name || 'P')[0]?.toUpperCase()
                                    )}
                                </span>
                                <div>
                                    <h3 className="title-md">{advisors.name || 'Consultor Pride'}</h3>
                                    {advisors.whatsapp && (
                                        <p style={{ margin: '4px 0 0' }}>
                                            WhatsApp:{' '}
                                            <a href={`https://wa.me/${(advisors.whatsapp || '').replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                                                {advisors.whatsapp}
                                            </a>
                                        </p>
                                    )}
                                </div>
                            </div>
                            {advisors.bio && <div className="rich-text" dangerouslySetInnerHTML={{ __html: advisors.bio }} />}
                            {advisors.video && (
                                <div className="video-card">
                                    <video className="video-frame" src={advisors.video} controls playsInline />
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <section
                    id="slide-2"
                    className="slide"
                    data-slide-id="slide-2"
                    ref={(el) => {
                        if (el) slideRefs.current['slide-2'] = el;
                    }}
                >
                    <div className="slide-content">
                        <div className="heading-with-tools">
                            <div className="stack">
                                <div className="badge">Plano atual vs Indicação Pride</div>
                                <h2 className="title-md">Comparação rápida</h2>
                                <p>Vidas, valores por faixa e totais lado a lado.</p>
                            </div>
                        </div>
                        <div className="grid-2">
                            {[
                                { title: 'Plano do cliente', plan: clientPlan },
                                { title: 'Indicação Pride', plan: featuredPlan },
                            ].map(({ title, plan }) => (
                                <div key={title} className={`panel stack ${plan?.is_client_plan ? 'client' : ''} ${plan?.is_featured ? 'featured' : ''}`}>
                                    <h4>{title}</h4>
                                    {plan ? (
                                        <>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', gap: '10px' }}>
                                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                    {plan.image_url && (
                                                        <img src={plan.image_url} alt={plan.name} className="plan-logo" />
                                                    )}
                                                    <div>
                                                        <div className="faixa-row" style={{ border: 'none', padding: 0 }}><span>Plano</span><strong>{plan.name || 'Não informado'}</strong></div>
                                                        <div className="faixa-row" style={{ border: 'none', padding: 0 }}><span>Operadora</span><strong>{plan.operator || 'Não informado'}</strong></div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    {plan.is_client_plan && <span className="pill client">Plano do cliente</span>}
                                                    {plan.is_featured && <span className="pill featured">Indicação Pride</span>}
                                                </div>
                                            </div>
                                            <div className="stack">
                                                {plan.faixaResumo?.filter((faixa) => faixa.qty > 0).map((faixa) => (
                                                    <div className="faixa-row" key={faixa.key}>
                                                        <span>{faixa.label} <small>({faixa.qty} vidas)</small></span>
                                                        <strong>{currency(faixa.subtotal)}</strong>
                                                    </div>
                                                ))}
                                                {plan.faixaResumo?.some((faixa) => faixa.qty > 0) && (
                                                    <div className="faixa-row">
                                                        <span>Total</span>
                                                        <strong>{currency(plan.total)}</strong>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                className="pill featured"
                                                onClick={() => openNetwork(plan.id, 'hospitals_with_types')}
                                                style={{ width: 'fit-content', justifyContent: 'center', marginTop: '12px' }}
                                            >
                                                Ver todos
                                            </button>
                                        </>
                                    ) : (
                                        <p>Plano não encontrado.</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="scroll-hint">
                        <span>Role para a próxima seção</span>
                        <span className="scroll-arrow" />
                    </div>
                </section>

                <section
                    id="slide-3"
                    className="slide"
                    data-slide-id="slide-3"
                    ref={(el) => {
                        if (el) slideRefs.current['slide-3'] = el;
                    }}
                >
                    <div className="slide-content">
                        <div className="heading-with-tools">
                            <div className="stack">
                                <div className="badge">Cotações personalizadas</div>
                                <h2 className="title-md">Contexto da sua oferta</h2>
                                <p>Os dados abaixo direcionam a comparação que você verá nas próximas seções.</p>
                            </div>
                        </div>
                        <div className="grid-2">
                            <div className="panel stack">
                                <h4>Resumo</h4>
                                <div className="stack">
                                    <div className="faixa-row"><span>Região</span><strong>{data.region || '-'}</strong></div>
                                    <div className="faixa-row"><span>Modalidade</span><strong>{data.modality || '-'}</strong></div>
                                    <div className="faixa-row"><span>Faixa de vidas</span><strong>{data.lives_range || '-'}</strong></div>
                                    <div className="faixa-row"><span>Tipo</span><strong>{typeLabel || '-'}</strong></div>
                                </div>
                            </div>
                            {data.savingsMonthly != null && (
                                <div className="panel stack">
                                    <h4>Economia estimada</h4>
                                    <div className="faixa-row"><span>Por mês</span><strong>{currency(data.savingsMonthly)}</strong></div>
                                    <div className="faixa-row"><span>Por ano</span><strong>{currency(data.savingsYearly)}</strong></div>
                                </div>
                            )}
                        </div>
                        <div className="plans-grid">
                            {plans.map((plan) => (
                                <div
                                    key={plan.id}
                                    className={`plan-card${plan.is_client_plan ? ' client' : ''}${plan.is_featured ? ' featured' : ''}`}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            {plan.image_url && <img src={plan.image_url} alt={plan.name} className="plan-logo" />}
                                            <div>
                                                <h4 style={{ margin: 0 }}>{plan.name}</h4>
                                                <p style={{ margin: 0, color: 'var(--muted)' }}>{plan.operator}</p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {plan.is_client_plan && <span className="pill client">Plano do cliente</span>}
                                            {plan.is_featured && <span className="pill featured">Indicação Pride</span>}
                                        </div>
                                    </div>
                                    <div className="faixa-row" style={{ marginTop: '8px' }}>
                                        <span>Total</span>
                                        <strong>{currency(plan.total)}</strong>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="scroll-hint">
                        <span>Role para a próxima seção</span>
                        <span className="scroll-arrow" />
                    </div>
                </section>

                <section
                    id="slide-4"
                    className="slide"
                    data-slide-id="slide-4"
                    ref={(el) => {
                        if (el) slideRefs.current['slide-4'] = el;
                    }}
                >
                    <div className="slide-content">
                        <div className="heading-with-tools">
                            <div className="stack">
                                <div className="badge">Valores</div>
                                <h2 className="title-md">Quanto custa cada opção</h2>
                                <p>Os valores abaixo consideram a quantidade de vidas por faixa etária definida na sua cotação.</p>
                            </div>
                        </div>
                        <div className="plans-grid">
                            {plans.map((plan) => (
                                <div
                                    key={`value-${plan.id}`}
                                    className={`plan-card${plan.is_client_plan ? ' client' : ''}${plan.is_featured ? ' featured' : ''}`}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            {plan.image_url && <img src={plan.image_url} alt={plan.name} className="plan-logo" />}
                                            <div>
                                                <h3 style={{ margin: 0 }}>{plan.name}</h3>
                                                <p style={{ margin: 0, color: 'var(--muted)' }}>{plan.operator}</p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {plan.is_client_plan && <span className="pill client">Plano do cliente</span>}
                                            {plan.is_featured && <span className="pill featured">Indicação Pride</span>}
                                            <span className="pill">Total</span>
                                        </div>
                                    </div>
                                    <div className="total" style={{ margin: '12px 0', fontWeight: 600 }}>{currency(plan.total)}</div>
                                    <div className="stack">
                                        {plan.faixaResumo
                                            ?.filter((faixa) => (faixa.qty ?? 0) > 0)
                                            .map((faixa) => (
                                                <div className="faixa-row" key={`value-${plan.id}-${faixa.key}`}>
                                                    <span>
                                                        {faixa.label} <small>({faixa.qty || 0} vidas)</small>
                                                    </span>
                                                    <strong>{currency(faixa.subtotal)}</strong>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="scroll-hint">
                        <span>Role para a próxima seção</span>
                        <span className="scroll-arrow" />
                    </div>
                </section>

                <section
                    id="slide-5"
                    className="slide"
                    data-slide-id="slide-5"
                    ref={(el) => {
                        if (el) slideRefs.current['slide-5'] = el;
                    }}
                >
                    <div className="slide-content">
                        <div className="heading-with-tools">
                            <div className="stack">
                                <div className="badge">Coparticipação e diferenciais</div>
                                <h2 className="title-md">O que você recebe em cada plano</h2>
                                <p>Resumo dos principais pontos comparativos para apoio na decisão.</p>
                            </div>
                        </div>
                        <div className="plans-grid">
                            {plans.map((plan) => (
                                <div
                                    key={`diff-${plan.id}`}
                                    className={`panel stack${plan.is_client_plan ? ' client' : ''}${plan.is_featured ? ' featured' : ''}`}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            {plan.image_url && <img src={plan.image_url} alt={plan.name} className="plan-logo" />}
                                            <div>
                                                <h3 style={{ margin: 0 }}>{plan.name}</h3>
                                                <p style={{ margin: 0, color: 'var(--muted)' }}>{plan.operator}</p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {plan.is_client_plan && <span className="pill client">Plano do cliente</span>}
                                            {plan.is_featured && <span className="pill featured">Indicação Pride</span>}
                                        </div>
                                    </div>
                                    <div className="stack">
                                        {plan.differentials?.map((item) => (
                                            <div key={`${plan.id}-diff-${item.label}`} className="faixa-row">
                                                <span>{item.label}</span>
                                                <strong>
                                                    {item.value == null || item.value === ''
                                                        ? '-'
                                                        : typeof item.value === 'number'
                                                            ? currency(item.value)
                                                            : item.value}
                                                </strong>
                                            </div>
                                        ))}
                                        {(plan.coparticipation || plan.coparticipacoes || plan.coparticipations) && (
                                            <div className="copart-grid">
                                                {Object.entries(plan.coparticipation || plan.coparticipacoes || plan.coparticipations).map(
                                                    ([key, value]) => (
                                                        <div className="faixa-row copart-row" key={`${plan.id}-copart-${key}`}>
                                                            <span>{COPART_LABELS[key] || key.replace(/_/g, ' ')}</span>
                                                            <strong>{currency(value)}</strong>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="scroll-hint">
                        <span>Role para a próxima seção</span>
                        <span className="scroll-arrow" />
                    </div>
                </section>

                <section
                    id="slide-6"
                    className="slide final"
                    data-slide-id="slide-6"
                    ref={(el) => {
                        if (el) slideRefs.current['slide-6'] = el;
                    }}
                >
                    <div className="slide-content stack">
                        <div className="heading-with-tools" style={{ width: '100%' }}>
                            <div className="stack">
                                <div className="badge">Rede credenciada</div>
                                <h2 className="title-md">Hospitais e laboratórios por plano</h2>
                                <p>Consulte os principais parceiros de cada opção.</p>
                                <a className="link-ghost" href={`/app/comparisons/${data.id}/presentation`}>
                                    Ver versão SPA
                                </a>
                            </div>
                        </div>
                        <div className="plans-grid">
                            {networkSlides.map((plan) => {
                                const hospitalPreview = (plan.hospitals_with_types || []).slice(0, 5);
                                const labPreview = (plan.labs_detailed || []).slice(0, 5);
                                const hasHospitals = hospitalPreview.length > 0;
                                const hasLabs = labPreview.length > 0;
                                return (
                                <div
                                    key={`net-${plan.id}`}
                                    className={`panel stack network-card${plan.is_client_plan ? ' client' : ''}${plan.is_featured ? ' featured' : ''}`}
                                >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                {plan.image_url && <img src={plan.image_url} alt={plan.name} className="plan-logo" />}
                                                <div>
                                                    <h4 style={{ margin: 0 }}>{plan.name}</h4>
                                                    <p style={{ margin: 0, color: 'var(--muted)' }}>{plan.operator}</p>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                {plan.is_client_plan && <span className="pill client">Plano do cliente</span>}
                                                {plan.is_featured && <span className="pill featured">Indicação Pride</span>}
                                            </div>
                                        </div>
                                        <div className="list-block">
                                            <div className="list-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span>Hospitais</span>
                                                {hasHospitals && (
                                                    <button className="link-ghost" type="button" onClick={() => openNetwork(plan.id, 'hospitals_with_types')}>
                                                        Ver todos
                                                    </button>
                                                )}
                                            </div>
                                            {hasHospitals ? (
                                                <div className="network-preview">
                                                    {hospitalPreview.map((hospital, idx) => (
                                                        <span className="pill-compact" key={`${plan.id}-hospital-${idx}`}>
                                                            <strong>{hospital.name}</strong>
                                                            {hospital.types?.length ? <span className="tag">{hospital.types.join(', ')}</span> : null}
                                                            <span className="tag" style={{ background: '#eef2ff', color: '#4338ca' }}>
                                                                {hospital.category || 'Sem categoria'}
                                                            </span>
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="list-item">
                                                    <span className="pill-compact">Nenhum hospital informado</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="list-block">
                                            <div className="list-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span>Laboratórios</span>
                                                {hasLabs && (
                                                    <button className="link-ghost" type="button" onClick={() => openNetwork(plan.id, 'labs_detailed')}>
                                                        Ver todos
                                                    </button>
                                                )}
                                            </div>
                                            {hasLabs ? (
                                                <div className="network-preview">
                                                    {labPreview.map((lab, idx) => (
                                                        <span className="pill-compact" key={`${plan.id}-lab-${idx}`}>
                                                            <strong>{lab.name}</strong>
                                                            <span className="tag" style={{ background: '#ecfeff', color: '#0ea5e9' }}>
                                                                {lab.category || 'Sem categoria'}
                                                            </span>
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="list-item">
                                                    <span className="pill-compact">Nenhum laboratório informado</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="scroll-hint">
                        <span>Role para a próxima seção</span>
                        <span className="scroll-arrow" />
                    </div>
                </section>
            </div>

            <NetworkModal
                open={networkState.open}
                plan={networkPlan}
                type={networkState.type}
                onClose={closeNetwork}
            />
        </div>
    );
}
