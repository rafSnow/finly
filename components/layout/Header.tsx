'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/transacoes': 'Transações',
  '/contas': 'Contas',
  '/cartoes': 'Cartões',
  '/orcamento': 'Orçamento',
  '/metas': 'Metas',
  '/relatorios': 'Relatórios',
  '/familia': 'Família',
  '/importar': 'Importar',
  '/perfil': 'Perfil',
};

export interface HeaderProps {
  userName?: string;
  userPhoto?: string | null;
  notificationCount?: number;
}

function Header({ userName, userPhoto, notificationCount = 0 }: HeaderProps) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] || 'Finly';

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-4 lg:hidden">
      <h1 className="text-lg font-semibold text-neutral-900">{title}</h1>
      <div className="flex items-center gap-3">
        <button
          className="relative rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          aria-label={`Notificações${notificationCount > 0 ? `, ${notificationCount} não lidas` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger-500 text-[10px] font-bold text-white">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>
        <Link
          href="/perfil"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 overflow-hidden"
          aria-label="Perfil"
        >
          {userPhoto ? (
            <img src={userPhoto} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm font-medium">{userName?.charAt(0)?.toUpperCase() || 'U'}</span>
          )}
        </Link>
      </div>
    </header>
  );
}

export { Header };
