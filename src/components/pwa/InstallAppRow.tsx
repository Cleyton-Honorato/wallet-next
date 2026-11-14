'use client';

import { useEffect, useState } from 'react';
import { Download, Share, SquarePlus } from 'lucide-react';
import styles from './InstallAppRow.module.css';

/** Evento do Chrome/Edge/Android que permite disparar a instalação. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Mode = 'hidden' | 'prompt' | 'ios';

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // Safari iOS expõe isso no navigator em vez do media query.
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  const ua = navigator.userAgent;
  // iPadOS se apresenta como Mac; o toque denuncia.
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && navigator.maxTouchPoints > 1);
}

/**
 * "Instalar o app" — some quando já está instalado. No Chrome/Android usa o
 * prompt nativo; no iPhone, que não tem botão de instalar, explica o caminho.
 */
export function InstallAppRow() {
  const [mode, setMode] = useState<Mode>('hidden');
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    if (isIOS()) {
      // Detecção só existe no navegador; este efeito roda uma vez na montagem.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode('ios');
      return;
    }

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setMode('prompt');
    };
    const onInstalled = () => setMode('hidden');

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (mode === 'hidden') return null;

  const install = async () => {
    if (mode === 'ios') {
      setShowSteps((v) => !v);
      return;
    }
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === 'accepted') setMode('hidden');
  };

  return (
    <div className={styles.box}>
      <button type="button" className={styles.row} onClick={install} aria-expanded={mode === 'ios' ? showSteps : undefined}>
        <span className={styles.icon} aria-hidden>
          <Download size={22} />
        </span>
        <span className={styles.text}>
          <span className={styles.title}>Instalar o app</span>
          <span className={styles.sub}>Abra o Wallet direto da tela inicial, em tela cheia</span>
        </span>
      </button>

      {mode === 'ios' && showSteps && (
        <ol className={styles.steps}>
          <li>
            Toque em <Share size={16} aria-label="Compartilhar" className={styles.inline} /> na barra do Safari
          </li>
          <li>
            Escolha <strong>Adicionar à Tela de Início</strong>{' '}
            <SquarePlus size={16} aria-hidden className={styles.inline} />
          </li>
          <li>Toque em <strong>Adicionar</strong></li>
        </ol>
      )}
    </div>
  );
}
