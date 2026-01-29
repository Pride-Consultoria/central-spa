import { Link } from 'react-router-dom';

export default function NotFound() {
    return (
        <section className="card">
            <h1>404</h1>
            <p>Página não encontrada.</p>
            <Link to="/dashboard">Ir para o dashboard</Link>
        </section>
    );
}
