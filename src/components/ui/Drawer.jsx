import Button from './Button';

export default function Drawer({ open, title, children, onClose, side = 'right', width }) {
    return (
        <div className={`ui-drawer__backdrop ${open ? 'is-open' : ''}`} onClick={onClose}>
            <div
                className={`ui-drawer ui-drawer--${side} ${open ? 'is-open' : ''}`}
                role="dialog"
                aria-modal="true"
                style={width ? { width } : undefined}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="ui-drawer__header">
                    <h3>{title}</h3>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        Fechar
                    </Button>
                </div>
                <div className="ui-drawer__body">{children}</div>
            </div>
        </div>
    );
}
