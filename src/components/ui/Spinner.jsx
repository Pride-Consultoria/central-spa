export default function Spinner({ size = 32 }) {
    return (
        <div className="ui-spinner" style={{ width: size, height: size }}>
            <div className="ui-spinner__circle" />
        </div>
    );
}
