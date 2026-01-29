export default function PublicLayout({ children }) {
    return (
        <div className="public-shell">
            <main className="public-content">
                {children}
            </main>
        </div>
    );
}
