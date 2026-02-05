import { useState } from 'react';
import { Link } from 'react-router-dom';
import { post } from '../services/api/client';

const allowedDomain = 'pridecorretora.com.br';
const formFields = [
    { key: 'name', label: 'Nome completo', placeholder: 'Digite seu nome completo' },
    { key: 'email', label: 'E-mail corporativo', placeholder: 'seu.nome@pridecorretora.com.br', type: 'email' },
    { key: 'phone', label: 'Telefone', placeholder: '(00) 00000-0000' },
    { key: 'role', label: 'Cargo ou função', placeholder: 'Ex.: Consultor, Operações, Comercial' },
    { key: 'team', label: 'Equipe / projeto', placeholder: 'Equipe, filial ou produto' },
];

const infoItems = [
    'Nome completo e ramal/cargo para identificação.',
    'E-mail corporativo com domínio @pridecorretora.com.br.',
    'Telefone comercial ou celular corporativo.',
    'Equipe ou operação que usará a plataforma.',
    'Breve motivo do acesso (projeto, onboarding, etc).',
];

const emptyForm = formFields.reduce((acc, field) => ({ ...acc, [field.key]: '' }), { reason: '' });

export default function Register() {
    const [form, setForm] = useState(emptyForm);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess(false);
        setLoading(true);
        const normalizedEmail = (form.email || '').trim().toLowerCase();
        if (!normalizedEmail) {
            setError('Informe um e-mail corporativo.');
            setLoading(false);
            return;
        }
        if (!normalizedEmail.endsWith(`@${allowedDomain}`)) {
            setError(`Somente e-mails @${allowedDomain} são aceitos.`);
            setLoading(false);
            return;
        }
        try {
                await post('/registration-requests', {
                    ...form,
                    email: normalizedEmail,
                });
            setSuccess(true);
            setForm(emptyForm);
        } catch (err) {
            setError(err.message || 'Não foi possível enviar a solicitação.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="login-page">
            <div className="login-board">
                <div className="login-board__illustration register-illustration">
                    <img src="/storage/logo-pride-branco.svg" alt="Pride logo" className="login-logo" />
                    <p className="register-hint">
                        Preencha os dados solicitados. Um membro do time de sucesso analisará o cadastro e retornará
                        em até 24 horas úteis.
                    </p>
                </div>
                <section className="login-board__form">
                    <div className="login-form__header">
                        <h1>Criar conta</h1>
                        <p>Precisamos de algumas informações básicas para liberar o acesso ao sistema.</p>
                    </div>
                    <div className="register-info">
                        <p className="register-info__intro">Envie tudo que temos para usuários:</p>
                        <ul className="register-info__list">
                            {infoItems.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </div>
                    <form onSubmit={handleSubmit} className="login-form" autoComplete="off">
                        {formFields.map(({ key, label, placeholder, type = 'text' }) => (
                            <div className="login-form__input" key={key}>
                                <label>
                                    <span>{label}</span>
                                    <input
                                        type={type}
                                        placeholder={placeholder}
                                        value={form[key]}
                                        onChange={(event) => handleChange(key, event.target.value)}
                                        required={key === 'name' || key === 'email'}
                                    />
                                </label>
                            </div>
                        ))}
                        <div className="login-form__input">
                            <label>
                                <span>Motivo da solicitação</span>
                                <textarea
                                    placeholder="Conte brevemente para que precisa do acesso"
                                    className="login-textarea"
                                    value={form.reason || ''}
                                    onChange={(event) => handleChange('reason', event.target.value)}
                                />
                            </label>
                        </div>
                        {error && <div className="alert login-alert">{error}</div>}
                        {success && (
                            <div className="success login-alert">
                                Recebemos seu pedido. Em até 24 horas úteis avisaremos qualquer atualização.
                            </div>
                        )}
                        <button type="submit" className="login-submit" disabled={loading}>
                            {loading ? 'Enviando...' : 'Enviar solicitação'}
                        </button>
                    </form>
                    <div className="login-card__link">
                        <Link to="/app/login">Já tenho conta</Link>
                    </div>
                </section>
            </div>
        </main>
    );
}
