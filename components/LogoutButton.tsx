'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { logout } from '@/lib/auth-utils';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
    router.refresh(); // Refresh to update any auth-dependent UI
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      className="flex items-center gap-2"
    >
      <LogOut className="w-4 h-4" />
      Logout
    </Button>
  );
}

