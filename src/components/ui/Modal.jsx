import Button from './Button';

export default function Modal({ open, title, children, onClose, footer }) {
    if (!open) return null;
    return (
        <div className="ui-modal__backdrop" onClick={onClose}>
            <div className="ui-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                <div className="ui-modal__header">
                    <h3>{title}</h3>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        Fechar
                    </Button>
                </div>
                <div className="ui-modal__body">{children}</div>
                {footer && <div className="ui-modal__footer">{footer}</div>}
            </div>
        </div>
    );
}
