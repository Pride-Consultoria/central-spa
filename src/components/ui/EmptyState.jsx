export default function EmptyState({ title = 'Nenhum resultado', description = '' }) {
    return (
        <div className="ui-empty">
            <div className="ui-empty__title">{title}</div>
            {description && <div className="ui-empty__desc">{description}</div>}
        </div>
    );
}
