import MainLayoutClient from '@/components/main-layout-client';

export const dynamic = 'force-dynamic';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <MainLayoutClient>{children}</MainLayoutClient>;
}
