import { animate, stagger } from 'animejs';

export { animate, stagger };
export * from 'animejs';

/**
 * Animate a numeric counter (e.g. risk score numbers or statistics)
 */
export function animateCounter(
  target: HTMLElement | null,
  startVal: number,
  endVal: number,
  duration = 800
) {
  if (!target) return;
  const obj = { val: startVal };
  return animate(obj, {
    val: endVal,
    duration,
    ease: 'outExpo',
    onUpdate: () => {
      if (target) {
        target.textContent = Math.round(obj.val).toLocaleString();
      }
    },
  });
}

/**
 * Staggered entrance animation for cards or list items
 */
export function animateStaggerEntrance(selectorOrElements: any) {
  return animate(selectorOrElements, {
    opacity: [0, 1],
    translateY: [12, 0],
    duration: 500,
    delay: stagger(45),
    ease: 'outQuad',
  });
}
