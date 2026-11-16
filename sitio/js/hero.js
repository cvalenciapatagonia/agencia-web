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
    // Rótulo bajo el notebook: el título entra desde abajo con recorte y luego la frase; el anterior sale
    $$('.hs-rotulo [data-r]').forEach(function (r, j) {
      var tit = r.querySelector('.hs-ro-tit span'), txt = r.querySelector('.hs-ro-txt'), t1 = t + (t ? 0.12 : 0.3);
      if (j === i) {
        tl.set(r, { autoAlpha: 1, y: 0 }, t1)
          .fromTo(tit, { yPercent: 110 }, { yPercent: 0, duration: 0.55, ease: 'power4.out' }, t1)
          .fromTo(txt, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power3.out' }, t1 + 0.16);
      } else if (j === i - 1) tl.to(r, { autoAlpha: 0, y: -6, duration: 0.18, ease: 'power2.in' }, t);
    });
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

  // Estimación referencial de la constructora (entre "Enviar cotización" y la confirmación)
  var EST = 2.1;
  tl.shiftChildren(EST, true, 3.9);
  var est = $('.hs-estimacion');
  if (est) {
    var caja = est.firstElementChild;
    tl.set(est, { autoAlpha: 0 }, 0)
      .to(est, { autoAlpha: 1, duration: 0.2 }, 3.95)
      .fromTo(caja, { scale: 0.95, y: 12 }, { scale: 1, y: 0, duration: 0.35, ease: 'power3.out' }, 3.95)
      .fromTo(est.querySelectorAll('.hs-est-fila'), { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: 0.25, stagger: 0.18, ease: 'power2.out' }, 4.15)
      .fromTo(est.querySelectorAll('.hs-est-total, .hs-est-nota, .hs-est-boton'), { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.25, stagger: 0.12, ease: 'power2.out' }, 4.95);
    // Posición del botón dentro de la pantalla virtual (sin la proyección): suma de offsets hasta .hs-pc
    var boton = est.querySelector('.hs-est-boton');
    var bx = boton.offsetWidth / 2, by = boton.offsetHeight / 2, e = boton;
    while (e && e !== pc) { bx += e.offsetLeft; by += e.offsetTop; e = e.offsetParent; }
    var formal = { x: bx, y: by };
    ir(tl, formal, 5.3, 0.5);
    pulsar(tl, formal, 5.85);
    tl.to(est, { autoAlpha: 0, duration: 0.2 }, 6.0);
  }
  var tramos = $$('.hs-ro-barra b');
  if (tramos.length === 3) {
    tl.set(tramos, { scaleX: 0 }, 0)
      .to(tramos[0], { scaleX: 1, duration: 7.9, ease: 'none' }, 0.3)
      .to(tramos[1], { scaleX: 1, duration: 5.9, ease: 'none' }, 8.2)
      .to(tramos[2], { scaleX: 1, duration: 5.5, ease: 'none' }, 14.1);
  }
  tl.set($$('.hs-rotulo [data-r]'), { autoAlpha: 0 }, 0);

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
  // ---- Chips «qué desarrollamos»: empiezan apagados y se encienden cuando el notebook demuestra cada cosa.
  //      Al terminar cada demostración, el rótulo de esa pestaña vuela en curva hasta su chip (con una estela
  //      fina) y lo enciende. Sitio web se enciende con la primera página; Plataformas a medida, al final.
  var listaChips = document.querySelector('.chips-desarrollo');
  var chips = listaChips ? Array.prototype.slice.call(listaChips.querySelectorAll('a')) : [];
  var GANA = [[0, 0.6, null], [1, 6.7, 0], [2, 12.7, 1], [3, 18.7, 2], [4, 20.35, null], [5, 20.85, null]];   // [chip, momento, rótulo que vuela]
  function encender(i) {
    var c = chips[i];
    if (!c || c.classList.contains('ganado')) return;
    c.classList.add('ganado', 'llega');
    setTimeout(function () { c.classList.remove('llega'); }, 800);
  }
  function volar(i, r) {
    var c = chips[i];
    if (!c || c.classList.contains('ganado')) return;          // al repetir el hero, lo encendido queda encendido
    var origen = r == null ? null : $('.hs-rotulo [data-r="' + r + '"] .hs-ro-tit span');
    var destino = c.querySelector('svg');
    var a = origen && origen.getBoundingClientRect(), b = destino && destino.getBoundingClientRect();
    if (!a || !b || !a.width || !b.width) { encender(i); return; }
    // Si el hero ya no está a la vista (la persona bajó), no hay vuelo: el chip solo se enciende
    var alto = window.innerHeight;
    if (b.bottom < 0 || b.top > alto || a.bottom < 0 || a.top > alto || window.scrollY > alto * 0.5) { encender(i); return; }
    var x0 = a.left + a.width / 2, y0 = a.top + a.height / 2, x1 = b.left + b.width / 2, y1 = b.top + b.height / 2;
    var cx = (x0 + x1) / 2, cy = Math.min(y0, y1) - Math.max(80, Math.abs(x0 - x1) * 0.18);
    var copia = origen.cloneNode(true);
    copia.className = 'hs-vuelo';          // el título se vuelve una píldora oscura que vuela
    var NS = 'http://www.w3.org/2000/svg', traza = document.createElementNS(NS, 'svg'), camino = document.createElementNS(NS, 'path');
    traza.setAttribute('class', 'hs-vuelo-estela');
    traza.setAttribute('aria-hidden', 'true');
    // La capa de la estela mide solo lo que ocupa la curva (una capa de pantalla completa cuesta un cuadro)
    var mx = Math.min(x0, x1, cx) - 6, my = Math.min(y0, y1, cy) - 6;
    var ancho = Math.max(x0, x1, cx) + 6 - mx, alto = Math.max(y0, y1, cy) + 6 - my;
    traza.setAttribute('width', ancho); traza.setAttribute('height', alto);
    traza.setAttribute('viewBox', '0 0 ' + ancho + ' ' + alto);
    traza.style.left = mx + 'px'; traza.style.top = my + 'px';
    camino.setAttribute('d', 'M' + (x0 - mx) + ' ' + (y0 - my) + 'Q' + (cx - mx) + ' ' + (cy - my) + ' ' + (x1 - mx) + ' ' + (y1 - my));
    traza.appendChild(camino);
    document.body.appendChild(traza);
    document.body.appendChild(copia);
    var cw = copia.offsetWidth / 2, chh = copia.offsetHeight / 2;
    var largo = camino.getTotalLength(), k = { t: 0 };
    gsap.set(camino, { strokeDasharray: largo, strokeDashoffset: largo });
    gsap.set(copia, { x: x0 - cw, y: y0 - chh });
    gsap.timeline({ onComplete: function () { copia.remove(); traza.remove(); encender(i); } })
      .to(k, { t: 1, duration: 0.9, ease: 'power2.inOut', onUpdate: function () {
        var t = k.t, u = 1 - t;
        gsap.set(copia, { x: u * u * x0 + 2 * u * t * cx + t * t * x1 - cw,
                          y: u * u * y0 + 2 * u * t * cy + t * t * y1 - chh, scale: 1 - 0.45 * t });
      } }, 0)
      .to(camino, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, 0)
      .to(copia, { opacity: 0, duration: 0.18, ease: 'power2.in' }, 0.74)
      .to(traza, { opacity: 0, duration: 0.35, ease: 'power2.out' }, 0.82);
  }
  GANA.forEach(function (g) { tl.call(volar, [g[0], g[2]], g[1]); });

  var reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var fijo = location.hash.match(/t=([\d.]+)/);
  function repetir() { if (tl.progress() === 1 && (!tlEstela || !tlEstela.isActive())) tl.restart(); }
  if (listaChips && !reducido) listaChips.classList.add('coleccion');
  function listo() {
    if (fijo) {
      GANA.forEach(function (g) { if (g[1] <= parseFloat(fijo[1])) chips[g[0]] && chips[g[0]].classList.add('ganado'); });                                     // #t=segundos congela ese instante (incluye la estela)
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
      if (e[0].isIntersecting) { if (tl.progress() < 1) tl.play(); fuera = false; }   // al volver no se repite: queda en su cuadro final
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
