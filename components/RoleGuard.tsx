'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/hooks/useRole';
import type { UserRole } from '@/types/database';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallbackUrl?: string;
}

export function RoleGuard({ children, allowedRoles, fallbackUrl = '/' }: RoleGuardProps) {
  const { role, loading } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!loading && role && !allowedRoles.includes(role)) {
      router.replace(fallbackUrl);
    }
  }, [loading, role, allowedRoles, fallbackUrl, router]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '14px', background: 'var(--bg-primary)' }}>
        Carregando...
      </div>
    );
  }

  if (!role || !allowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
}
