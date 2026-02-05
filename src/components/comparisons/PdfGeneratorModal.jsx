import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Share2, Mail, Download, RefreshCw, Copy } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { generateComparisonPdf, sendComparisonPdfEmail } from '../../services/comparisons';

const STATUS_TEXT = {
    idle: 'Pronto para gerar o PDF',
    loading: 'Gerando o PDF...',
    success: 'PDF pronto para compartilhar',
    error: 'Falha ao gerar o PDF',
};

export default function PdfGeneratorModal({ open, onClose, comparisonId, comparisonTitle }) {
    const [status, setStatus] = useState('idle');
    const [pdfInfo, setPdfInfo] = useState({
        url: '',
        createdAt: null,
        expiresAt: null,
        alreadyExisted: false,
    });
    const [error, setError] = useState('');
    const [emailPanelOpen, setEmailPanelOpen] = useState(false);
    const [emailForm, setEmailForm] = useState({ to: '', message: '' });
    const [emailStatus, setEmailStatus] = useState('idle');
    const [emailError, setEmailError] = useState('');
    const [copyFeedback, setCopyFeedback] = useState('');
    const [shareFeedback, setShareFeedback] = useState('');
    const abortRef = useRef(null);

    const isBusy = status === 'loading';
    const hasLink = Boolean(pdfInfo.url);

    const formattedCreatedAt = useMemo(() => {
        if (!pdfInfo.createdAt) return null;
        return new Date(pdfInfo.createdAt).toLocaleString('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'short',
        });
    }, [pdfInfo.createdAt]);

    const formattedExpiresAt = useMemo(() => {
        if (!pdfInfo.expiresAt) return null;
        return new Date(pdfInfo.expiresAt).toLocaleString('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'short',
        });
    }, [pdfInfo.expiresAt]);

    useEffect(() => {
        if (!emailPanelOpen) {
            setEmailStatus('idle');
            setEmailError('');
        }
    }, [emailPanelOpen]);

    useEffect(() => {
        if (!open) {
            setStatus('idle');
            setPdfInfo({ url: '', createdAt: null, expiresAt: null, alreadyExisted: false });
            setError('');
            setCopyFeedback('');
            setShareFeedback('');
            setEmailForm({ to: '', message: '' });
            setEmailPanelOpen(false);
            abortRef.current?.abort();
            abortRef.current = null;
            return;
        }

        triggerGenerate({ force: false });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, comparisonId]);

    useEffect(() => {
        if (hasLink && !emailForm.message) {
            setEmailForm((prev) => ({
                ...prev,
                message: `Olá!\nSegue o comparativo ${comparisonTitle || `#${comparisonId}`}:\n${pdfInfo.url}`,
            }));
        }
    }, [hasLink, comparisonId, comparisonTitle, emailForm.message, pdfInfo.url]);

    const cleanupAbort = () => {
        abortRef.current?.abort();
        abortRef.current = null;
    };

    const triggerGenerate = async ({ force = false } = {}) => {
        if (!comparisonId) return;
        cleanupAbort();
        const controller = new AbortController();
        abortRef.current = controller;
        setStatus('loading');
        setError('');

        try {
            const payload = await generateComparisonPdf(comparisonId, { force }, { signal: controller.signal });
            const url = payload.signedUrl ?? payload.url ?? '';
            setPdfInfo({
                url,
                createdAt: payload.createdAt ?? payload.created_at ?? null,
                expiresAt: payload.expiresAt ?? payload.expires_at ?? null,
                alreadyExisted: !!payload.alreadyExisted,
            });
            setStatus('success');
        } catch (err) {
            if (err.name === 'AbortError') return;
            setStatus('error');
            setError(err.message || 'Não foi possível gerar o PDF');
        } finally {
            if (abortRef.current === controller) {
                abortRef.current = null;
            }
        }
    };

    const handleCopyLink = async () => {
        if (!hasLink) return;
        try {
            await navigator.clipboard.writeText(pdfInfo.url);
            setCopyFeedback('Copiado');
            setTimeout(() => setCopyFeedback(''), 2000);
        } catch {
            setCopyFeedback('Não foi possível copiar');
            setTimeout(() => setCopyFeedback(''), 2000);
        }
    };

    const handleShareLink = async () => {
        if (!hasLink) return;
        if (navigator?.share) {
            try {
                await navigator.share({
                    title: `Comparativo ${comparisonTitle || `#${comparisonId}`}`,
                    text: 'Segue o comparativo gerado.',
                    url: pdfInfo.url,
                });
                setShareFeedback('Compartilhado');
                setTimeout(() => setShareFeedback(''), 2000);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setShareFeedback('Não foi possível compartilhar');
                    setTimeout(() => setShareFeedback(''), 2000);
                }
            }
        } else {
            await handleCopyLink();
            setShareFeedback('Link copiado');
            setTimeout(() => setShareFeedback(''), 2000);
        }
    };

    const handleEmailChange = (field, value) => {
        setEmailForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSendEmail = async () => {
        if (!hasLink) {
            setEmailError('Aguarde até que o PDF esteja pronto.');
            return;
        }
        if (!emailForm.to) {
            setEmailError('Informe um e-mail válido.');
            return;
        }
        setEmailStatus('loading');
        setEmailError('');

        try {
            await sendComparisonPdfEmail(comparisonId, {
                to: emailForm.to,
                message: emailForm.message,
                url: pdfInfo.url,
            });
            setEmailStatus('success');
        } catch (err) {
            setEmailStatus('error');
            setEmailError(err.message || 'Não foi possível enviar o e-mail');
        }
    };

    const handleDownload = () => {
        if (!hasLink) return;
        const anchor = document.createElement('a');
        anchor.href = pdfInfo.url;
        anchor.target = '_blank';
        anchor.rel = 'noreferrer noopener';
        anchor.download = `comparativo-${comparisonId}.pdf`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
    };

    if (!open) return null;

    return (
        <Modal open={open} onClose={onClose} title="Gerar PDF do Comparativo">
            <div className="pdf-modal">
                <div className={`pdf-modal__status pdf-modal__status--${status}`}>
                    <div>
                        <strong>{STATUS_TEXT[status] || 'Pronto para gerar o PDF'}</strong>
                        {status === 'error' && <p className="pdf-modal__status-error">{error || 'Tente novamente.'}</p>}
                    </div>
                    {formattedCreatedAt && (
                        <div className="pdf-modal__timestamps">
                            <span>Criado em {formattedCreatedAt}</span>
                            {formattedExpiresAt && <span>Expira em {formattedExpiresAt}</span>}
                        </div>
                    )}
                    {pdfInfo.alreadyExisted && (
                        <span className="pdf-modal__status-note">PDF reaproveitado (mesma assinatura).</span>
                    )}
                </div>

                <div className="pdf-modal__link-row">
                    <Input
                        value={pdfInfo.url}
                        readOnly
                        placeholder="Aguarde enquanto o PDF é gerado..."
                        label="Link público"
                    />
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleCopyLink}
                        disabled={!hasLink || isBusy}
                    >
                        <Copy size={16} />
                        Copiar link
                    </Button>
                </div>
                {copyFeedback && <p className="pdf-modal__feedback">{copyFeedback}</p>}

                <div className="pdf-modal__actions">
                    <Button variant="primary" onClick={handleShareLink} disabled={!hasLink || isBusy}>
                        <Share2 size={16} />
                        Compartilhar
                    </Button>
                    <Button variant="secondary" onClick={() => setEmailPanelOpen((prev) => !prev)} disabled={!hasLink}>
                        <Mail size={16} />
                        Enviar por e-mail
                    </Button>
                    <Button variant="secondary" onClick={handleDownload} disabled={!hasLink || isBusy}>
                        <Download size={16} />
                        Baixar PDF
                    </Button>
                    <Button variant="ghost" onClick={() => window.open(pdfInfo.url, '_blank')} disabled={!hasLink}>
                        <ArrowUpRight size={16} />
                        Abrir PDF
                    </Button>
                    <Button variant="ghost" onClick={() => triggerGenerate({ force: true })} disabled={isBusy}>
                        <RefreshCw size={16} />
                        {status === 'error' ? 'Tentar novamente' : 'Gerar novamente'}
                    </Button>
                </div>

                {shareFeedback && <p className="pdf-modal__feedback">{shareFeedback}</p>}

                {emailPanelOpen && (
                    <div className="pdf-modal__email">
                        <Input
                            label="E-mail do destinatário"
                            type="email"
                            value={emailForm.to}
                            onChange={(event) => handleEmailChange('to', event.target.value)}
                        />
                        <label className="ui-field">
                            <span className="ui-field__label">Mensagem</span>
                            <textarea
                                className="ui-input"
                                rows={4}
                                value={emailForm.message}
                                onChange={(event) => handleEmailChange('message', event.target.value)}
                            />
                        </label>
                        <div className="pdf-modal__email-actions">
                            <Button variant="primary" size="sm" onClick={handleSendEmail} disabled={!hasLink || emailStatus === 'loading'}>
                                {emailStatus === 'loading' ? 'Enviando...' : 'Enviar'}
                            </Button>
                            {emailStatus === 'success' && <span className="pdf-modal__feedback">E-mail enviado</span>}
                            {emailStatus === 'error' && <span className="pdf-modal__status-error">{emailError}</span>}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
