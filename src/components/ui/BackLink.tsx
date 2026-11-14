import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import styles from './BackLink.module.css';

/** "‹ Perfil": volta para a tela de onde as subpáginas de ajuste partem. */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className={styles.back}>
      <ChevronLeft size={20} aria-hidden />
      {label}
    </Link>
  );
}
