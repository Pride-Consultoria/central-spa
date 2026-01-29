export default function Table({ columns = [], data = [], renderEmpty }) {
    if (!data.length && renderEmpty) return renderEmpty();
    return (
        <div className="ui-table__wrapper">
            <table className="ui-table">
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key || col.accessor || col.label}>{col.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, idx) => (
                        <tr key={row.id || idx}>
                            {columns.map((col) => {
                                const value = typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor];
                                return <td key={col.key || col.accessor || col.label}>{value}</td>;
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
