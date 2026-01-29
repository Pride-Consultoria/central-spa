import { useEffect, useState } from 'react';
import { Bell, User } from 'lucide-react';
import { get } from '../../services/api/client';

export default function Topbar() {
    const [userName, setUserName] = useState('Usuário');

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const res = await get('/me');
                const name = res.data?.user?.name || res.data?.name;
                if (mounted && name) setUserName(name);
            } catch (err) {
                // fallback silencioso
            }
        };
        load();
        return () => {
            mounted = false;
        };
    }, []);

    return (
        <header className="dash-topbar">
            <div className="flex items-center gap-3">
                <div className="hidden sm:block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                    Painel
                </div>
                <div className="hidden sm:block h-px w-10 bg-white/10" />
                <div className="hidden lg:block text-xs text-white/50">Experiência premium</div>
            </div>
            <div className="dash-topbar__actions">
                <button className="dash-icon-btn" aria-label="Notificações">
                    <Bell size={18} />
                </button>
                <div className="divider" />
                <div className="flex items-center gap-2">
                    <div className="dash-avatar">{userName?.[0]?.toUpperCase() || 'B'}</div>
                    <div className="hidden sm:flex flex-col leading-tight">
                        <span className="text-sm font-semibold text-white">{userName}</span>
                        <span className="text-xs text-white/60">Corretor</span>
                    </div>
                    <button className="dash-icon-btn" aria-label="Perfil">
                        <User size={18} />
                    </button>
                </div>
            </div>
        </header>
    );
}
