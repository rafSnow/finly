'use client';

import { signOut } from '@/lib/firebase/auth';
import { cn } from '@/lib/utils';
import {
  ArrowLeftRight,
  BarChart3,
  CreditCard,
  Landmark,
  LayoutDashboard,
  LogOut,
  PiggyBank,
  Target,
  Upload,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: '/transacoes', label: 'Transações', icon: <ArrowLeftRight className="h-5 w-5" /> },
  { href: '/contas', label: 'Contas', icon: <Landmark className="h-5 w-5" /> },
  { href: '/cartoes', label: 'Cartões', icon: <CreditCard className="h-5 w-5" /> },
  { href: '/orcamento', label: 'Orçamento', icon: <PiggyBank className="h-5 w-5" /> },
  { href: '/metas', label: 'Metas', icon: <Target className="h-5 w-5" /> },
  { href: '/relatorios', label: 'Relatórios', icon: <BarChart3 className="h-5 w-5" /> },
  { href: '/familia', label: 'Família', icon: <Users className="h-5 w-5" /> },
  { href: '/importar', label: 'Importar', icon: <Upload className="h-5 w-5" /> },
];

export interface SidebarProps {
  userName?: string;
  userPhoto?: string | null;
}

function Sidebar({ userName, userPhoto }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-neutral-200">
      <div className="flex h-16 items-center px-6">
        <span className="text-xl font-bold text-brand-500">Finly</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Navegação principal">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-neutral-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-700 overflow-hidden">
            {userPhoto ? (
              <img src={userPhoto} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-medium">
                {userName?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-neutral-800">{userName || 'Usuário'}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
            aria-label="Sair da conta"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export { NAV_ITEMS, Sidebar };
