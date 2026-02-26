import DashboardBoot from '@/components/ui/DashboardBoot';

export default function SessionLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <DashboardBoot>
            {children}
        </DashboardBoot>
    );
}
