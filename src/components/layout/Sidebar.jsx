import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Info, ListChecks, PlusCircle, LogOut, User } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
    { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/app/profile', label: 'Meu perfil', icon: User },
    { to: '/app/reference', label: 'Informações', icon: Info },
    { to: '/app/comparisons', label: 'Cotações', icon: ListChecks },
    { to: '/app/comparisons/create', label: 'Nova Cotação', icon: PlusCircle },
];

export default function Sidebar() {
    const items = useMemo(() => navItems, []);

    return (
        <aside className="dash-sidebar">
            <div className="dash-brand items-center">
                <img
                    src="/storage/logo-pride-branco.svg"
                    alt="Pride"
                    className="h-8 w-auto object-contain"
                />
                <small>Painel do corretor</small>
            </div>
            <nav className="dash-nav">
                {items.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) => clsx('dash-nav__item', isActive && 'is-active')}
                    >
                        <Icon size={18} />
                        <span className="hidden lg:inline">{label}</span>
                    </NavLink>
                ))}
            </nav>
            <div className="dash-nav__footer">
                <a href="/app/login" className="dash-nav__item">
                    <LogOut size={18} />
                    <span className="hidden lg:inline">Sair</span>
                </a>
            </div>
        </aside>
    );
}
