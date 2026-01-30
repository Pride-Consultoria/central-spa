export default function PublicLayout({ children, fullWidth = false }) {
    const shellClass = fullWidth ? 'public-shell public-shell--full' : 'public-shell';
    const contentClass = fullWidth ? 'public-content public-content--full' : 'public-content';

    return (
        <div className={shellClass}>
            <main className={contentClass}>
                {children}
            </main>
        </div>
    );
}
