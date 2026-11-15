/* Hero: notebook con 3 sitios web en pestañas (constructora, almacén, consulta) y estela final
   que subraya el subtítulo. Copiado de pruebas/hero-sitios.html, que sigue siendo el banco de pruebas. */
(function () {
  'use strict';
  if (!document.querySelector('.hs-hero') || !window.gsap) return;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = $('.hs-esc'), pc = $('.hs-pc');
  // Vidrio del notebook en fracciones de la foto (la misma máscara del hero actual): sup-izq, sup-der, inf-izq, inf-der.
  var VIDRIO = [[.612, .319], [.924, .298], [.587, .718], [.909, .735]];

  function adj(m) { return [m[4]*m[8]-m[5]*m[7], m[2]*m[7]-m[1]*m[8], m[1]*m[5]-m[2]*m[4], m[5]*m[6]-m[3]*m[8], m[0]*m[8]-m[2]*m[6], m[2]*m[3]-m[0]*m[5], m[3]*m[7]-m[4]*m[6], m[1]*m[6]-m[0]*m[7], m[0]*m[4]-m[1]*m[3]]; }
  function mm(a, b) { var c = []; for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) { var s = 0; for (var k = 0; k < 3; k++) s += a[3*i+k] * b[3*k+j]; c[3*i+j] = s; } return c; }
  function mv(m, v) { return [m[0]*v[0]+m[1]*v[1]+m[2]*v[2], m[3]*v[0]+m[4]*v[1]+m[5]*v[2], m[6]*v[0]+m[7]*v[1]+m[8]*v[2]]; }
  function base(p) { var m = [p[0][0], p[1][0], p[2][0], p[0][1], p[1][1], p[2][1], 1, 1, 1]; var v = mv(adj(m), [p[3][0], p[3][1], 1]); return mm(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]]); }
  function proyectar() {
    var w = esc.clientWidth, h = esc.clientHeight;
    var t = mm(base(VIDRIO.map(function (p) { return [p[0] * w, p[1] * h]; })), adj(base([[0, 0], [1512, 0], [0, 982], [1512, 982]])));
    for (var i = 0; i < 9; i++) t[i] /= t[8];
    pc.style.transform = 'matrix3d(' + [t[0], t[3], 0, t[6], t[1], t[4], 0, t[7], 0, 0, 1, 0, t[2], t[5], 0, t[8]].join(',') + ')';
  }
  proyectar();
  window.addEventListener('resize', proyectar);

  var ESC = 1512 / 1024, TOPE = 114;            // escala de las capturas y alto del Chrome
  gsap.set('.hs-lienzo', { scale: ESC });
  var BAJA = [1400, 520, 1080];                   // cuánto baja cada página
  function punto(x, y, p) { return { x: x * ESC, y: TOPE + y * ESC - BAJA[p] }; }
  var TABS = [{ x: 217, y: 52 }, { x: 471, y: 52 }, { x: 725, y: 52 }];
  var URLS = ['constructorakai.cl', 'buenvecino.cl', 'kinesiologiavital.cl'];

  var cursor = $('.hs-cursor'), clic = $('.hs-clic');
  function ir(tl, p, t, d) { tl.to(cursor, { x: p.x, y: p.y, duration: d || 0.5, ease: 'power2.inOut' }, t); }
  function pulsar(tl, p, t) {
    tl.to(cursor, { scale: 0.85, duration: 0.07, yoyo: true, repeat: 1, transformOrigin: '0 0' }, t)
      .fromTo(clic, { x: p.x, y: p.y, scale: 0, opacity: 0.8 }, { scale: 1.6, opacity: 0, duration: 0.4, ease: 'power2.out', immediateRender: false }, t);
  }
  function pestana(tl, i, t) {
    tl.call(function () {
      $$('.hs-tab').forEach(function (e, j) { e.classList.toggle('on', j === i); });
      $('.hs-url').textContent = URLS[i];
    }, null, t);
    $$('.hs-pag').forEach(function (p, j) { tl.set(p, { opacity: j === i ? 1 : 0 }, t); });
  }
  function modal(tl, i, t, sale) {
    var m = $('.hs-modal[data-m="' + i + '"]');
    tl.to(m, { autoAlpha: 1, duration: 0.2 }, t)
      .fromTo(m.firstElementChild, { scale: 0.95, y: 12 }, { scale: 1, y: 0, duration: 0.35, ease: 'power3.out' }, t)
      .to(m, { autoAlpha: 0, duration: 0.2 }, sale);
  }

  // Corre una sola vez; al terminar queda en la consulta con la hora elegida y lanza la estela (solo la primera vez).
  var tl = gsap.timeline({ paused: true, onComplete: function () { if (!marcado) estela().play(); } });
  // Estado inicial de cada vuelta
  pestana(tl, 0, 0);
  tl.set('.hs-lienzo', { y: 0 }, 0)
    .set('.hs-campo', { clipPath: 'inset(0 100% 0 0)' }, 0)
    .set('.hs-agregado, .hs-sel', { opacity: 0 }, 0)
    .set('.hs-carro', { x: 0, xPercent: 105 }, 0)
    .set('.hs-modal', { autoAlpha: 0 }, 0)
    .set(cursor, { x: 1040, y: 640, opacity: 0, scale: 1 }, 0);

  // 1) Constructora: baja a "Cotiza tu proyecto", se completa el formulario y se envía
  var L = $$('.hs-lienzo');
  tl.to(L[0], { y: -BAJA[0], duration: 1.4, ease: 'power2.inOut' }, 0.5)
    .to(cursor, { opacity: 1, duration: 0.2 }, 1.8)
    .to('.hs-pag[data-p="0"] .hs-campo', { clipPath: 'inset(0 0% 0 0)', duration: 0.28, ease: 'steps(10)', stagger: 0.26 }, 2.0);
  var enviar = punto(158, 1406, 0);
  ir(tl, enviar, 3.2, 0.55);
  pulsar(tl, enviar, 3.8);
  modal(tl, 0, 3.95, 5.4);

  // 2) Almacén: cambia de pestaña, baja a los productos, agrega dos y compra
  ir(tl, TABS[1], 5.5, 0.5);
  pulsar(tl, TABS[1], 6.05);
  pestana(tl, 1, 6.1);
  tl.to(L[1], { y: -BAJA[1], duration: 1.0, ease: 'power2.inOut' }, 6.3);
  var a1 = punto(112, 834, 1), a2 = punto(349, 834, 1);
  ir(tl, a1, 7.3, 0.45); pulsar(tl, a1, 7.8); tl.to('.hs-agr-1', { opacity: 1, duration: 0.12 }, 7.85);
  ir(tl, a2, 8.0, 0.4); pulsar(tl, a2, 8.45); tl.to('.hs-agr-2', { opacity: 1, duration: 0.12 }, 8.5);
  tl.to('.hs-carro', { xPercent: 0, duration: 0.45, ease: 'power3.out' }, 8.7);
  var pagar = { x: 1512 - 215, y: TOPE + 324 };
  ir(tl, pagar, 9.2, 0.5); pulsar(tl, pagar, 9.75);
  modal(tl, 1, 9.9, 11.3);
  tl.to('.hs-carro', { xPercent: 105, duration: 0.3, ease: 'power2.inOut' }, 11.3);

  // 3) Consulta: cambia de pestaña, baja a la agenda, elige servicio, día y hora, y confirma
  ir(tl, TABS[2], 11.4, 0.5);
  pulsar(tl, TABS[2], 11.95);
  pestana(tl, 2, 12.0);
  tl.to(L[2], { y: -BAJA[2], duration: 1.0, ease: 'power2.inOut' }, 12.2);
  var s1 = punto(195, 882, 2), d19 = punto(511, 949, 2), h1030 = punto(837, 870, 2), conf = punto(838, 974, 2);
  ir(tl, s1, 13.2, 0.45); pulsar(tl, s1, 13.7); tl.to('.hs-sel--chip', { opacity: 1, duration: 0.12 }, 13.75);
  ir(tl, d19, 13.9, 0.45); pulsar(tl, d19, 14.4); tl.to('.hs-sel--dia', { opacity: 1, duration: 0.12 }, 14.45);
  ir(tl, h1030, 14.6, 0.45); pulsar(tl, h1030, 15.1); tl.to('.hs-sel--hora', { opacity: 1, duration: 0.12 }, 15.15);
  ir(tl, conf, 15.3, 0.45); pulsar(tl, conf, 15.8);
  modal(tl, 2, 15.95, 17.6);
  tl.to(cursor, { opacity: 0, duration: 0.3 }, 17.4);

  // ---- Estela final: un trazo de luz sale del borde de la pantalla y llega al inicio del subtítulo,
  //      donde se dibuja un subrayado tipo marcador (un rectángulo por línea, solo scaleX).
  var hero = $('.hs-hero'), sub = $('.hero-sub'), marca = $('.hs-marca');
  var svg = $('.hs-estela'), halo = $('.hs-estela-halo'), luz = $('.hs-estela-luz');
  var marcado = false, tlEstela = null, trazos = [];

  function lineas() {                               // rectángulos de cada línea del texto, relativos al subtítulo
    var r = document.createRange(); r.selectNodeContents(marca);
    var s = sub.getBoundingClientRect(), fs = parseFloat(getComputedStyle(sub).fontSize);
    return Array.prototype.map.call(r.getClientRects(), function (q) {
      return { x: q.left - s.left - fs * .06, y: q.bottom - s.top - fs * .5, w: q.width + fs * .12, h: fs * .42 };
    });
  }
  function colocarTrazos() {
    var L = lineas();
    while (trazos.length < L.length) { var t = document.createElement('span'); t.className = 'hs-trazo'; sub.appendChild(t); trazos.push(t); }
    trazos.forEach(function (t, i) {
      var q = L[i]; t.style.display = q ? '' : 'none';
      if (q) { t.style.left = q.x + 'px'; t.style.top = q.y + 'px'; t.style.width = q.w + 'px'; t.style.height = q.h + 'px'; }
    });
    return trazos.slice(0, L.length);
  }
  function camino() {                               // del borde izquierdo del vidrio al inicio de la 1.ª línea
    var h = hero.getBoundingClientRect(), e = esc.getBoundingClientRect(), s = sub.getBoundingClientRect();
    var L = lineas()[0];
    var sx = e.left - h.left + (VIDRIO[0][0] + VIDRIO[2][0]) / 2 * e.width - 6;
    var sy = e.top - h.top + (VIDRIO[0][1] + VIDRIO[2][1]) / 2 * e.height;
    var ex = s.left - h.left + L.x, ey = s.top - h.top + L.y + L.h / 2, dx = sx - ex;
    svg.setAttribute('viewBox', '0 0 ' + h.width + ' ' + h.height);
    return 'M' + sx + ' ' + sy + 'C' + (sx - dx * .35) + ' ' + sy + ' ' + (ex + dx * .45) + ' ' + ey + ' ' + ex + ' ' + ey;
  }
  var geo = null;                                   // medidas precalculadas (fuera del cuadro en que parte la estela)
  function preparar() {
    var d = camino(); halo.setAttribute('d', d); luz.setAttribute('d', d);
    var largo = luz.getTotalLength(), seg = Math.min(140, largo * .25);
    geo = { largo: largo, seg: seg, T: colocarTrazos(), y: window.scrollY };
    gsap.set([halo, luz], { strokeDasharray: seg + ' ' + (largo + seg), strokeDashoffset: seg });
  }
  function estela() {
    if (tlEstela) return tlEstela;
    if (!geo || Math.abs(window.scrollY - geo.y) > 2) preparar();   // con scroll (hero fijado) las medidas cambian
    var largo = geo.largo, seg = geo.seg, T = geo.T;
    tlEstela = gsap.timeline({ paused: true, onStart: function () { marcado = true; } })
      .set(svg, { visibility: 'visible' }, 0)                 // solo existe mientras corre (si no, es una capa enorme)
      .to([halo, luz], { opacity: 1, duration: 0.15, ease: 'power2.out' }, 0)
      .to([halo, luz], { strokeDashoffset: seg - largo, duration: 0.85, ease: 'power3.inOut' }, 0)
      .to([halo, luz], { opacity: 0, duration: 0.18, ease: 'power2.out' }, 0.72)
      .to(T, { scaleX: 1, duration: 0.6, ease: 'power3.out', stagger: 0.32 }, 0.74)
      .set(svg, { visibility: 'hidden' }, 0.95);
    return tlEstela;
  }
  window.addEventListener('resize', function () { if (marcado) colocarTrazos(); else if (geo) { geo = null; tlEstela = null; } });
  // Precalcular cuando termina la entrada del texto (sus transform cambian las medidas)
  setTimeout(function () {                          // la entrada CSS del texto dura ~1,25 s
    (window.requestIdleCallback || setTimeout)(function () { if (!geo && !marcado) preparar(); });
  }, 1400);

  // Solo corre mientras el hero está a la vista. Una sola vez; se repite (sin estela) al volver al hero
  // o al pasar el mouse sobre el notebook. Con "reducir movimiento": estado final y subrayado por fundido.
  var reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var fijo = location.hash.match(/t=([\d.]+)/);
  function repetir() { if (tl.progress() === 1 && (!tlEstela || !tlEstela.isActive())) tl.restart(); }
  function listo() {
    if (fijo) {                                     // #t=segundos congela ese instante (incluye la estela)
      var t = parseFloat(fijo[1]), D = tl.duration();
      if (t <= D) tl.pause(t);
      else {                                        // termina la entrada del texto para medir en su lugar final
        document.getAnimations().forEach(function (a) { a.finish(); });
        tl.progress(1).pause(); estela().pause(Math.min(t - D, estela().duration()));
      }
      return;
    }
    if (reducido) {
      tl.progress(1).pause(); marcado = true;
      gsap.fromTo(colocarTrazos(), { scaleX: 1, opacity: 0 }, { opacity: 1, duration: 0.2, delay: 0.3 });
      return;
    }
    var fuera = false;
    new IntersectionObserver(function (e) {
      if (e[0].isIntersecting) { if (fuera) repetir(); if (tl.progress() < 1) tl.play(); fuera = false; }
      else { tl.pause(); fuera = true; }
    }).observe(hero);
    if (conMouse) {                                 // pasar el mouse sobre la pantalla del notebook
      var dentro = false;
      hero.addEventListener('pointermove', function (ev) {
        var r = pc.getBoundingClientRect();
        var hit = ev.clientX > r.left && ev.clientX < r.right && ev.clientY > r.top && ev.clientY < r.bottom;
        if (hit && !dentro) repetir();
        dentro = hit;
      });
    }
  }
  var imgs = $$('.hs-lienzo img'), faltan = imgs.length;
  imgs.forEach(function (i) { if (i.complete) { if (--faltan === 0) listo(); } else i.addEventListener('load', function () { if (--faltan === 0) listo(); }); });
})();
