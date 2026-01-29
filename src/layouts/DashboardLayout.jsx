import { createContext, useContext, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';

const DashboardLayoutContext = createContext({ setRightPanel: () => {}, rightPanel: null });

export const useDashboardLayout = () => useContext(DashboardLayoutContext);

export default function DashboardLayout() {
    const [rightPanel, setRightPanel] = useState(null);
    const contextValue = useMemo(() => ({ rightPanel, setRightPanel }), [rightPanel]);

    return (
        <DashboardLayoutContext.Provider value={contextValue}>
            <div className="dash-shell">
                <Sidebar />
                <div className="dash-main">
                    <Topbar />
                    <div className="flex flex-1 overflow-hidden">
                        <main className="dash-content flex-1 overflow-y-auto">
                            <Outlet />
                        </main>
                        {rightPanel && (
                            <aside className="hidden xl:block w-[340px] border-l border-white/10 bg-[#0f1a2b]/80 backdrop-blur-md px-5 py-6 overflow-y-auto">
                                {rightPanel}
                            </aside>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayoutContext.Provider>
    );
}
