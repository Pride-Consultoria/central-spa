import { useEffect } from 'react';
import { useDashboardLayout } from '../../layouts/DashboardLayout';

export default function RightPanel({ children }) {
    const { setRightPanel } = useDashboardLayout();

    useEffect(() => {
        setRightPanel(children);
        return () => setRightPanel(null);
    }, [children, setRightPanel]);

    return null;
}
