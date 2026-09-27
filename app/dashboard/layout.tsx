import { Suspense } from 'react';
import DashboardLayoutClient from './DashboardLayoutClient';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center">Loading...</div>}>
            <DashboardLayoutClient>
                {children}
            </DashboardLayoutClient>
        </Suspense>
    );
}
