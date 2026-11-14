import Link from 'next/link';
import { ChevronRight, Gauge, LogOut, ShieldCheck, Tags, type LucideIcon } from 'lucide-react';
import { InstallAppRow } from '@/components/pwa/InstallAppRow';
import { logoutAction } from '@/server/actions/auth';
import styles from './Profile.module.css';

const LINKS: { href: string; title: string; text: string; icon: LucideIcon }[] = [
  {
    href: '/budgets',
    title: 'Limites de gasto',
    text: 'Quanto você quer gastar por categoria no mês',
    icon: Gauge,
  },
  {
    href: '/categories',
    title: 'Categorias',
    text: 'Crie e organize as categorias dos lançamentos',
    icon: Tags,
  },
  {
    href: '/goals',
    title: 'Reserva de emergência',
    text: 'Guarde e acompanhe seu dinheiro para imprevistos',
    icon: ShieldCheck,
  },
];

/** Tudo que é configuração mora aqui, longe do uso do dia a dia. */
export function ProfileView({ name, email }: { name: string; email: string }) {
  return (
    <div className={styles.page}>
      <header className={styles.user}>
        <span className={styles.avatar} aria-hidden>
          {name.charAt(0).toUpperCase()}
        </span>
        <div className={styles.userText}>
          <h1 className={styles.name}>{name}</h1>
          <p className={styles.email}>{email}</p>
        </div>
      </header>

      <InstallAppRow />

      <nav aria-label="Ajustes" className={styles.list}>
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className={styles.row}>
            <span className={styles.rowIcon} aria-hidden>
              <link.icon size={22} />
            </span>
            <span className={styles.rowText}>
              <span className={styles.rowTitle}>{link.title}</span>
              <span className={styles.rowSub}>{link.text}</span>
            </span>
            <ChevronRight size={20} aria-hidden className={styles.chevron} />
          </Link>
        ))}
      </nav>

      <form action={logoutAction}>
        <button type="submit" className={styles.logout}>
          <LogOut size={20} aria-hidden />
          Sair da conta
        </button>
      </form>
    </div>
  );
}
