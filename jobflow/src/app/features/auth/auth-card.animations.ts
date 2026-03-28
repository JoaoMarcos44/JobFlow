import gsap from 'gsap';

/**
 * Entrada fluida para cartões de login / registo (seletores relativos a `root`).
 */
export function createAuthCardEntrance(root: HTMLElement): gsap.Context {
  return gsap.context(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.from('.auth-anim-card', {
      y: 32,
      opacity: 0,
      scale: 0.985,
      duration: 0.75,
    })
      .from(
        '.auth-anim-brand > *',
        { y: 20, opacity: 0, stagger: 0.09, duration: 0.5 },
        '-=0.48',
      )
      .from(
        '.auth-anim-field',
        { y: 16, opacity: 0, stagger: 0.065, duration: 0.42 },
        '-=0.32',
      );

    const optionsEl = root.querySelector('.auth-anim-options');
    if (optionsEl) {
      tl.from(optionsEl, { opacity: 0, y: 10, duration: 0.38 }, '-=0.22');
    }

    tl.from('.auth-anim-submit', { y: 12, opacity: 0, duration: 0.42 }, '-=0.28').from(
      '.auth-anim-footer',
      { opacity: 0, y: 8, duration: 0.4 },
      '-=0.22',
    );
  }, root);
}
