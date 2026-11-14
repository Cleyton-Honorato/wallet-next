/**
 * Trava a rolagem da página por trás de um modal — inclusive no iPhone.
 *
 * `overflow: hidden` no body não basta no Safari do iOS: o dedo continua
 * rolando a página de fundo. O jeito que funciona em todo celular é fixar o
 * body no lugar (`position: fixed` com `top` negativo igual à rolagem atual)
 * e, ao destravar, devolver a página exatamente onde estava.
 *
 * Conta quantos travamentos estão ativos: um modal aberto por cima de outro
 * não destrava a página ao fechar.
 */

let locks = 0;
let savedScrollY = 0;
let savedStyles: Partial<CSSStyleDeclaration> = {};

export function lockScroll(): () => void {
  if (typeof document === 'undefined') return () => {};

  if (locks === 0) {
    const { body, documentElement } = document;
    savedScrollY = window.scrollY;
    savedStyles = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: documentElement.style.overflow,
    };

    // Compensa a barra de rolagem do desktop, para o conteúdo não "pular".
    const scrollbar = window.innerWidth - documentElement.clientWidth;

    documentElement.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${savedScrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
  }
  locks += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks -= 1;
    if (locks > 0) return;

    const { body, documentElement } = document;
    body.style.position = savedStyles.position ?? '';
    body.style.top = savedStyles.top ?? '';
    body.style.left = savedStyles.left ?? '';
    body.style.right = savedStyles.right ?? '';
    body.style.width = savedStyles.width ?? '';
    body.style.paddingRight = '';
    documentElement.style.overflow = savedStyles.overflow ?? '';
    // `instant`: o reset.css liga scroll suave, e a página não pode deslizar
    // de volta do topo — ela tem que reaparecer onde estava.
    window.scrollTo({ top: savedScrollY, behavior: 'instant' });
  };
}
