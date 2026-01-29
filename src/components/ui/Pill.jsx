export default function Pill({ children, tone = 'default' }) {
    return <span className={`ui-pill ui-pill--${tone}`}>{children}</span>;
}
