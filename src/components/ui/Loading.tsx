import Image from 'next/image';
import styles from './Loading.module.css';

export type LoadingVariant = 'page' | 'brand';

/**
 * O carregamento do app — o ÚNICO lugar que define como "esperando" aparece.
 * Todo `loading.tsx` usa este componente; para mudar o visual, mude aqui.
 *
 * - `page`  (padrão): esqueleto com o formato de uma tela — cabeçalho, cartão
 *   de saldo, os dois botões grandes e uma lista — e um brilho passando. Fica
 *   dentro da casca do app, então a barra de abas continua no lugar.
 * - `brand`: tela cheia com o logo e um anel girando. Para telas fora do app
 *   (login, cadastro), onde não há layout para esboçar.
 *
 * Os dois só aparecem depois de ~150ms: carregamento rápido não pisca.
 */
export function Loading({ variant = 'page' }: { variant?: LoadingVariant }) {
  return (
    <div
      className={variant === 'brand' ? styles.brand : styles.page}
      role="status"
      aria-live="polite"
    >
      <span className={styles.srOnly}>Carregando…</span>
      {variant === 'brand' ? <BrandMark /> : <PageSkeleton />}
    </div>
  );
}

function BrandMark() {
  return (
    <div className={styles.mark} aria-hidden>
      <span className={styles.ring} />
      <Image src="/icons/icon-192.png" alt="" width={56} height={56} className={styles.logo} priority />
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className={styles.skeleton} aria-hidden>
      <div className={styles.header}>
        <div className={styles.stack}>
          <span className={`${styles.bone} ${styles.lineSm}`} />
          <span className={`${styles.bone} ${styles.lineLg}`} />
        </div>
        <span className={`${styles.bone} ${styles.pill}`} />
      </div>

      <div className={`${styles.bone} ${styles.hero}`} />

      <div className={styles.actions}>
        <span className={`${styles.bone} ${styles.action}`} />
        <span className={`${styles.bone} ${styles.action}`} />
      </div>

      <div className={styles.card}>
        {[0, 1, 2].map((row) => (
          <div key={row} className={styles.row}>
            <span className={`${styles.bone} ${styles.avatar}`} />
            <div className={styles.rowText}>
              <span className={`${styles.bone} ${styles.lineMd}`} />
              <span className={`${styles.bone} ${styles.lineXs}`} />
            </div>
            <span className={`${styles.bone} ${styles.amount}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
