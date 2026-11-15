/* Scroll suave (Lenis) como ÚNICO suavizado de la página.
   Lenis avanza con el reloj de GSAP y avisa a ScrollTrigger en cada movimiento, así las animaciones
   ligadas al scroll (relato con video) siguen la misma posición sin sumar otra inercia.
   En pantallas táctiles se mantiene el scroll nativo, y con "reducir movimiento" no se activa. */
(function () {
  'use strict';
  if (!window.Lenis || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var gsap = window.gsap, ST = window.ScrollTrigger;
  var conGsap = !!(gsap && ST);
  window.lenis = new window.Lenis({
    autoRaf: !conGsap,
    lerp: 0.1,            // valor estándar de Lenis
    wheelMultiplier: 1,
    smoothWheel: true,
    anchors: true
  });
  if (!conGsap) return;
  gsap.registerPlugin(ST);
  window.lenis.on('scroll', ST.update);
  gsap.ticker.add(function (t) { window.lenis.raf(t * 1000); });
  gsap.ticker.lagSmoothing(0);
})();
