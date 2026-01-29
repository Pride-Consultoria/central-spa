export default function Input({ label, hint, error, ...props }) {
    return (
        <label className="ui-field">
            {label && <span className="ui-field__label">{label}</span>}
            <input className="ui-input" {...props} />
            {hint && !error && <span className="ui-field__hint">{hint}</span>}
            {error && <span className="ui-field__error">{error}</span>}
        </label>
    );
}
