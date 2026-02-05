import { useEffect, useState } from 'react';
import { Button, Input, Spinner } from '../components/ui';
import { fetchProfile, updateProfile, uploadProfilePhoto } from '../services/profile';

const initialState = {
    name: '',
    email: '',
    description: '',
};

export default function Profile() {
    const [form, setForm] = useState(initialState);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [photoUrl, setPhotoUrl] = useState('');
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [photoFeedback, setPhotoFeedback] = useState(null);

    useEffect(() => {
        let active = true;
        const loadProfile = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetchProfile();
                const payload = res.data?.data ?? res.data ?? res;
                if (!active) return;
                setForm({
                    name: payload?.name || '',
                    email: payload?.email || '',
                    description: payload?.description || '',
                });
                setPhotoUrl(payload?.photo_url || '');
            } catch (err) {
                if (!active) return;
                setError(err.message || 'Não foi possível carregar o perfil.');
            } finally {
                if (!active) return;
                setLoading(false);
            }
        };

        loadProfile();
        return () => {
            active = false;
        };
    }, []);

    const handlePhotoChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setUploadingPhoto(true);
        setPhotoFeedback(null);
        try {
            const res = await uploadProfilePhoto(file);
            const payload = res.data?.data ?? res.data ?? res;
            setPhotoUrl(payload?.photo_url || '');
            setPhotoFeedback({ type: 'success', text: 'Foto atualizada com sucesso.' });
        } catch (err) {
            setPhotoFeedback({ type: 'error', text: err.message || 'Erro ao enviar a foto.' });
        } finally {
            setUploadingPhoto(false);
            event.target.value = '';
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            const res = await updateProfile({
                name: form.name,
                email: form.email,
                description: form.description,
            });
            const payload = res.data?.data ?? res.data ?? res;
            setForm((prev) => ({
                ...prev,
                name: payload?.name || prev.name,
                email: payload?.email || prev.email,
                description: payload?.description ?? prev.description,
            }));
                setSuccess('Informações atualizadas com sucesso.');
            } catch (err) {
                setError(err.message || 'Não foi possível salvar.');
            } finally {
                setSaving(false);
            }
        };

    if (loading) {
        return (
            <section className="card profile-card">
                <Spinner />
            </section>
        );
    }

    return (
        <section className="card profile-card">
            <header className="profile-card__header">
                <div>
                    <h1>Meu perfil</h1>
                    <p className="muted">Atualize os dados pessoais visíveis nas cotações e escreva um breve resumo sobre você.</p>
                </div>
            </header>
            <form className="profile-form" onSubmit={handleSubmit}>
                <div className="profile-form__row profile-avatar-row">
                    <div className="profile-avatar">
                        {photoUrl ? (
                            <img src={photoUrl} alt="Avatar" className="profile-avatar__img" />
                        ) : (
                            <span className="profile-avatar__placeholder">Sem foto</span>
                        )}
                    </div>
                    <label className="profile-avatar__upload">
                        <span>{uploadingPhoto ? 'Enviando...' : 'Alterar foto'}</span>
                        <input type="file" accept="image/*" onChange={handlePhotoChange} />
                    </label>
                </div>
                {photoFeedback && (
                    <div className={photoFeedback.type === 'error' ? 'alert' : 'success'} style={{ marginTop: 10 }}>
                        {photoFeedback.text}
                    </div>
                )}
                <div className="profile-form__row">
                    <Input
                        label="Nome completo"
                        required
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                </div>
                <div className="profile-form__row">
                    <Input
                        label="E-mail"
                        required
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    />
                </div>
                <div className="profile-form__row">
                    <label className="profile-form__label">
                        Biografia
                        <textarea
                            className="profile-form__textarea"
                            rows="5"
                            value={form.description}
                            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                            placeholder="Conte aos prospects quem você é, quais valores entrega e para quem trabalha."
                        />
                    </label>
                </div>
                <div className="profile-form__actions">
                    <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar alterações'}</Button>
                </div>
                {error && <div className="alert" style={{ marginTop: 10 }}>{error}</div>}
                {success && <div className="success" style={{ marginTop: 10 }}>{success}</div>}
            </form>
        </section>
    );
}
