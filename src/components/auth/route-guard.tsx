'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { UserRole } from '@/contexts/auth-context';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  allowedRoles?: UserRole[];
}

export function RouteGuard({ children, requiredRole, allowedRoles }: RouteGuardProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }

    // Check role-based access
    if (requiredRole && user.role !== requiredRole) {
      // Redirect based on user role
      if (user.role === 'seller') {
        router.push('/pos');
      } else {
        router.push('/');
      }
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect based on user role
      if (user.role === 'seller') {
        router.push('/pos');
      } else {
        router.push('/');
      }
      return;
    }
  }, [isAuthenticated, user, isLoading, router, pathname, requiredRole, allowedRoles]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // Check role-based access
  if (requiredRole && user.role !== requiredRole) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}

