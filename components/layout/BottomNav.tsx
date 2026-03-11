'use client';

import { cn } from '@/lib/utils';
import {
  ArrowLeftRight,
  CreditCard,
  Landmark,
  LayoutDashboard,
  MoreHorizontal,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BottomNavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { href: '/dashboard', label: 'Home', icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: '/transacoes', label: 'Transações', icon: <ArrowLeftRight className="h-5 w-5" /> },
  { href: '/contas', label: 'Contas', icon: <Landmark className="h-5 w-5" /> },
  { href: '/cartoes', label: 'Cartões', icon: <CreditCard className="h-5 w-5" /> },
  { href: '/mais', label: 'Mais', icon: <MoreHorizontal className="h-5 w-5" /> },
];

function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white lg:hidden"
      aria-label="Navegação inferior"
    >
      <ul className="flex items-center justify-around">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-2 text-xs transition-colors',
                  isActive ? 'text-brand-500' : 'text-neutral-400'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export { BottomNav };
