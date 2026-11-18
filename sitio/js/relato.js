/* Relato con video: "Tu negocio ya trabaja duro".
   Un solo clip (constructora → minimarket → consulta de kinesiología), con su posición (currentTime)
   ligada LINEALMENTE al progreso del scroll dentro de la sección fijada: a la mitad del scroll de la
   sección se ve la mitad del clip, y al detenerse queda en ese cuadro exacto, en cualquier dirección.
   Una sola línea de tiempo de GSAP (pin + scrub), sin suavizado propio: el único suavizado de la
   página es Lenis (ver js/suave.js). El mecanismo del video —carga perezosa como Blob, 48 fps, espera
   a que termine un salto ("seeked") antes de pedir el cuadro más reciente— es el ya aprobado para
   Agencia KAI (commit 4d42b47, rama codex/storytelling-kai).

   Dos dispositivos, dos personas:
     · iPhone del CLIENTE (izquierda): abre una app desde su ícono por cada uno de los 5 resultados del
       sitio (Google, Maps, Perfil/reseñas, WhatsApp, búsqueda con IA) y hace la acción real.
     · iPad del DUEÑO (derecha): el video corre en su pantalla y, apenas el cliente actúa, le llega la
       notificación de eso mismo.

   Línea de tiempo (1 unidad = 1,8 altos de ventana, TOTAL = 14,8):
     0    – 0,55  el fondo aparece y los dispositivos crecen (iPad, luego iPhone)
     0,75 · 3,25 · 5,65 · 7,55 · 8,9   una escena por resultado (título + app + notificación)

   Se activa solo en pantallas ≥900px y sin "reducir movimiento" (gsap.matchMedia, reacciona a resize).
   Fuera de esa condición el contenido en flujo normal (imágenes AVIF + tarjeta de texto por negocio,
   ver CSS) es la página entera: el .mp4 nunca se solicita. */
(function () {
  'use strict';
  var seccion = document.getElementById('relato');
  if (!seccion) return;
  var gsap = window.gsap, ST = window.ScrollTrigger, Split = window.SplitText;
  var marco = seccion.querySelector('.relato-marco');
  var pin = seccion.querySelector('.relato-pin');
  if (!marco || !pin || !gsap || !ST) return;
  gsap.registerPlugin(ST);
  if (Split) gsap.registerPlugin(Split);

  var $ = function (s) { return seccion.querySelector(s); };
  var porIndice = function (atributo, n) {
    var lista = [];
    for (var i = 0; i < n; i++) lista.push($('[' + atributo + '="' + i + '"]'));
    return lista;
  };
  var caps = porIndice('data-cap', 3);
  var ideas = porIndice('data-idea', 2);
  var telefono = $('.relato-telefono');
  var pantallas = porIndice('data-pantalla', 6);
  var apps = porIndice('data-app', 6);
  var notifs = porIndice('data-notif', 5);
  var vistas = porIndice('data-vista', 4);   // apps del dueño: Analytics, Perfil de Empresa, WhatsApp Business, Analytics
  function animarMapa(linea, pantalla, t) {
    var texto = pantalla.querySelector('.rp-maps-consulta');
    var pin = pantalla.querySelector('.rp-pin');
    var ficha = pantalla.querySelector('.rp-ficha');
    var boton = pantalla.querySelector('.rp-boton');
    var panel = pantalla.querySelector('.rp-ruta-panel');
    var trazos = pantalla.querySelectorAll('.rp-ruta-linea');
    var origen = pantalla.querySelector('.rp-ruta-origen');
    animarTeclado(linea, pantalla, texto, t, 0.35);
    linea.fromTo(texto, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.35, ease: 'none' }, t);
    linea.fromTo(pin, { autoAlpha: 0, y: -18 }, { autoAlpha: 1, y: 0, duration: 0.22, ease: 'back.out(1.4)' }, t + 0.55);
    linea.fromTo(ficha, { autoAlpha: 0, yPercent: 100 }, { autoAlpha: 1, yPercent: 0, duration: 0.24, ease: 'power2.out' }, t + 0.8);
    linea.to(boton, { scale: 0.95, duration: 0.07, yoyo: true, repeat: 1 }, t + 1.5);
    linea.to(ficha, { autoAlpha: 0, yPercent: 80, duration: 0.16 }, t + 1.62);
    linea.fromTo(panel, { autoAlpha: 0, yPercent: 35 }, { autoAlpha: 1, yPercent: 0, duration: 0.24, ease: 'power2.out' }, t + 1.66);
    linea.fromTo(trazos, { autoAlpha: 1, strokeDasharray: 300, strokeDashoffset: 300 }, { strokeDashoffset: 0, duration: 0.46, ease: 'power2.inOut' }, t + 1.65);
    linea.fromTo(origen, { autoAlpha: 0, scale: 0.5, transformOrigin: 'center' }, { autoAlpha: 1, scale: 1, duration: 0.18 }, t + 1.66);
  }

  function crearTeclado(pantalla) {
    var teclado = document.createElement('div');
    teclado.className = 'rp-teclado';
    teclado.setAttribute('aria-hidden', 'true');
    ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'].forEach(function (fila) {
      var grupo = document.createElement('div');
      grupo.className = 'rp-teclado-fila';
      Array.from(fila).forEach(function (letra) {
        var tecla = document.createElement('span');
        tecla.className = 'rp-tecla';
        tecla.dataset.letra = letra;
        tecla.textContent = letra.toUpperCase();
        grupo.appendChild(tecla);
      });
      teclado.appendChild(grupo);
    });
    var inferior = document.createElement('div');
    inferior.className = 'rp-teclado-fila rp-teclado-inferior';
    inferior.innerHTML = '<span>123</span><span>☺</span><span class="rp-espacio">espacio</span><span>↵</span>';
    teclado.appendChild(inferior);
    pantalla.appendChild(teclado);
  }
  [0, 1, 2, 3, 4].forEach(function (i) { if (pantallas[i]) crearTeclado(pantallas[i]); });

  function animarTeclado(linea, pantalla, texto, inicio, duracion) {
    var teclado = pantalla.querySelector('.rp-teclado');
    if (!teclado || !texto) return;
    linea.fromTo(teclado, { autoAlpha: 0, yPercent: 100 }, { autoAlpha: 1, yPercent: 0, duration: 0.16, ease: 'power2.out' }, inicio);
    Array.from(texto.textContent.toLowerCase()).forEach(function (letra, i, letras) {
      var tecla = teclado.querySelector('[data-letra="' + letra + '"]');
      if (!tecla) return;
      var momento = inicio + 0.14 + i * duracion / Math.max(1, letras.length);
      linea.to(tecla, { backgroundColor: '#a7b4c5', duration: 0.025, yoyo: true, repeat: 1 }, momento);
    });
    linea.to(teclado, { autoAlpha: 0, yPercent: 100, duration: 0.16, ease: 'power2.in' }, inicio + duracion + 0.2);
    var campo = pantalla.querySelector('.rp-envio');
    if (campo) {
      linea.fromTo(campo, { y: 0 }, { y: function () { return -teclado.offsetHeight; }, duration: 0.16 }, inicio);
      linea.to(campo, { y: 0, duration: 0.16 }, inicio + duracion + 0.2);
    }
  }

  var TOTAL = 29.8;                               // pantallas de scroll mientras la sección está fijada

  // Entrada de cada negocio en pantallas, calculada desde los segundos reales de cada uno en el clip
  // (0–14,92 s) repartidos linealmente: constructora ≈1,7–2,5, minimarket ≈5,4–5,9, consulta ≈9,3–10,0.
  
  // Tarjetas interpretativas, en los tramos donde la cámara solo viaja entre un negocio y otro.
  
  // Cuándo le llega al iPad la notificación de cada escena, contado desde que se abre la app: justo
  // después de la acción del cliente (tocar el resultado, pedir la ruta, publicar, enviar, citar).
  var AVISO = [1.96, 2.16, 1.56, 1.06, 2.26, 1.6];
  var ENTRADA_APP = [0.75, 4.3, 8.0, 13.6, 19.5, 23.6];   // rama relato-panel: tres pasos por capítulo
  // Momento de cada paso de la explicación (columna izquierda), por capítulo.
  var PASOS = [[0.62, 1.8, 2.65], [4.17, 5.4, 6.4], [7.87, 9.5, 11.95], [13.47, 14.6, 17.81], [19.37, 20.52, 21.7], [23.47, 24.35, 25.15]];

  /* ---------- Coreografía (solo ≥900px y sin "reducir movimiento") ---------- */
  var mm = gsap.matchMedia();
  mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', function () {
    var tocados = [];

    seccion.classList.add('relato-activo');

    /* Fotos reales (columna del cliente y del negocio): la foto cubre su columna (background-size:cover,
       centrada) y la pantalla de cada equipo se coloca sobre el rectángulo blanco de la foto, medido en
       píxeles de la imagen original. */
    var FOTOS = {
      cliente: { w: 1024, h: 1536, x: 319, y: 333, sw: 394, sh: 840, r: 48 },
      negocio: { w: 1122, h: 1402, x: 116, y: 435, sw: 891, sh: 600, r: 18 }
    };
    function colocarFotos() {
      var m = marco.getBoundingClientRect();
      Object.keys(FOTOS).forEach(function (k) {
        var z = seccion.querySelector('.relato-zona--' + k), F = FOTOS[k];
        if (!z) return;
        var r = z.getBoundingClientRect();
        if (!r.width || !r.height) return;
        var e = Math.max(r.width / F.w, r.height / F.h);
        var ox = r.left - m.left + (r.width - F.w * e) / 2, oy = r.top - m.top + (r.height - F.h * e) / 2;
        marco.style.setProperty('--f-' + k + '-x', (ox + F.x * e).toFixed(1) + 'px');
        marco.style.setProperty('--f-' + k + '-y', (oy + F.y * e).toFixed(1) + 'px');
        marco.style.setProperty('--f-' + k + '-w', (F.sw * e).toFixed(1) + 'px');
        marco.style.setProperty('--f-' + k + '-h', (F.sh * e).toFixed(1) + 'px');
        marco.style.setProperty('--f-' + k + '-r', (F.r * e).toFixed(1) + 'px');
      });
      marco.classList.add('con-fotos');
    }
    colocarFotos();
    window.addEventListener('resize', colocarFotos);
    ST.addEventListener('refresh', colocarFotos);
    var rotulos = $('.relato-rotulos');
    var contenedorRotulos = rotulos && rotulos.parentNode;
    // Con el panel, los títulos de cada escena quedan sobre el iPhone (no dentro del iPad).
    if (rotulos) marco.appendChild(rotulos);   // subtítulo centrado bajo los dos dispositivos

    var hero = document.getElementById('inicio');
    var introRecorrido = document.querySelector('.intro-recorrido');
    var introLugar = document.createComment('posición de la introducción');
    if (introRecorrido) {
      introRecorrido.parentNode.insertBefore(introLugar, introRecorrido);
      hero.appendChild(introRecorrido);
    }
    var entrada = gsap.timeline({ paused: true });
    var introVista = false, CUADRO_FINAL_INTRO = 4.45;   // canales unidos al sitio + "Te mostramos…"
    entrada.scrollTrigger = ST.create({
      trigger: hero, start: 'top top', end: function () { return '+=' + Math.round(window.innerHeight * (introRecorrido && introRecorrido.querySelector('.ib') ? 3 : 1.7)); },
      pin: true, invalidateOnRefresh: true,
      onUpdate: function (self) {
        if (!introVista) { entrada.progress(self.progress); return; }
        // Ya vista: el contenido queda en su cuadro final (no se repite), pero las transiciones sí se animan con
        // el scroll, hacia adelante y hacia atrás: la intro entra desde el hero y, en su último tramo, se funde con
        // el escenario del relato (teléfono y tablet).
        if (Math.abs(entrada.time() - CUADRO_FINAL_INTRO) > 0.001) entrada.time(CUADRO_FINAL_INTRO);
        var pr = self.progress, cruce = Math.max(0, Math.min(1, (pr - 0.8) / 0.2));
        // el fondo crema de la intro se mantiene sólido durante el cruce (así no se trasluce el hero): se funde
        // solo su contenido, mientras aparece el escenario
        if (introRecorrido) {
          gsap.set(introRecorrido, { autoAlpha: Math.min(1, pr / 0.12) });
          var ibc = introRecorrido.querySelector('.ib');
          if (ibc) gsap.set(ibc, { autoAlpha: 1 - cruce });
        }
        gsap.set(marco, { autoAlpha: cruce });
      }
    });
    if (introRecorrido) {
      var introTexto = introRecorrido.querySelectorAll('.relato-cierre-antes, .relato-h, .relato-p');
      var introLinea = introRecorrido.querySelector('.relato-cierre-linea');
      var ib = introRecorrido.querySelector('.ib');
      entrada.fromTo(introRecorrido, { autoAlpha: 0, yPercent: 8 }, { autoAlpha: 1, yPercent: 0, duration: 0.5, ease: 'power2.out' }, 0);
      if (ib) { introRecorrido.classList.add('ib-activo'); coreografiaIntro(ib); }
      else {
        entrada.fromTo(introTexto, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.22, ease: 'power3.out' }, 0.45)
          .fromTo(introLinea, { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: 'power2.inOut' }, 0.8)
          .to({}, { duration: 0.6 });
      }
    }

    /* Motion graphics de la introducción (todo ligado al scroll del hero fijado):
         1) la pregunta: "Ya tienes tu sitio." + una ventana de navegador sola + "¿Basta con tenerlo?" palabra a palabra
         2) la respuesta: la pregunta se achica y sube, entra "No." y el sitio se pierde entre cientos de puntos
         3) el puente: se encienden los 6 canales unidos al sitio y luego vuelan a su lugar en el índice del relato */
    function coreografiaIntro(ib) {
      var q = function (s) { return ib.querySelector(s); }, qa = function (s) { return Array.prototype.slice.call(ib.querySelectorAll(s)); };
      var lienzo = q('.ib-puntos'), sitio = q('.ib-sitio'), lineas = qa('.ib-lineas line'), canales = qa('.ib-canal');
      var marcoIndice = seccion.querySelector('.relato-indice');
      var botones = Array.prototype.slice.call(seccion.querySelectorAll('.relato-indice [data-indice]'));
      // Geometría: centro del sitio, anillo de canales, puntos de fondo y líneas (se recalcula al cambiar el tamaño)
      var geo = {};
      function medir() {
        var W = ib.clientWidth, H = ib.clientHeight, cx = W / 2, cy = H * 0.63, R = Math.min(W * 0.18, H * 0.24);
        geo = { W: W, H: H, cx: cx, cy: cy };
        canales.forEach(function (c, i) {
          var a = -Math.PI / 2 + i * Math.PI / 3;
          c.style.left = (cx + R * Math.cos(a)) + 'px'; c.style.top = (cy + R * Math.sin(a)) + 'px';
          var l = lineas[i];
          if (l) { l.setAttribute('x1', cx); l.setAttribute('y1', cy); l.setAttribute('x2', cx + R * Math.cos(a)); l.setAttribute('y2', cy + R * Math.sin(a)); }
        });
        q('.ib-lineas').setAttribute('viewBox', '0 0 ' + W + ' ' + H);
        var dpr = Math.min(window.devicePixelRatio || 1, 2), ctx = lienzo.getContext('2d');
        lienzo.width = W * dpr; lienzo.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
        var semilla = 7; function azar() { semilla = (semilla * 9301 + 49297) % 233280; return semilla / 233280; }
        for (var n = 0; n < 420; n++) {
          var x = azar() * W, y = H * 0.18 + azar() * H * 0.8, d = Math.hypot(x - cx, y - cy);
          if (d < Math.min(W, H) * 0.16) continue;               // el sitio queda visible en su hueco
          ctx.fillStyle = 'rgba(110,96,82,' + (0.18 + azar() * 0.32).toFixed(2) + ')';
          ctx.beginPath(); ctx.arc(x, y, 1.6 + azar() * 2.4, 0, Math.PI * 2); ctx.fill();
        }
      }
      medir();
      ST.addEventListener('refreshInit', medir);
      // Hacia dónde vuela cada canal: al botón del índice (posición del índice cuando el relato queda fijado arriba)
      function destino(i, eje) {
        var b = botones[i], c = canales[i];
        if (!b || !c || !marcoIndice) return 0;
        var m = marco.getBoundingClientRect(), r = b.getBoundingClientRect();
        var bx = r.left - m.left + r.width / 2, by = r.top - m.top + r.height / 2;
        var ox = parseFloat(c.style.left), oy = parseFloat(c.style.top);
        return eje === 'x' ? bx - ox : by - oy;
      }
      var e = entrada;
      var palabras = qa('.ib-pregunta > span > span');
      // 1) La pregunta
      e.fromTo(q('.ib-eti'), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power3.out' }, 0.2)
        .fromTo(sitio, { autoAlpha: 0, scale: 0.88, y: 24 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.4, ease: 'power3.out' }, 0.3)
        .fromTo(palabras, { yPercent: 110 }, { yPercent: 0, duration: 0.45, stagger: 0.12, ease: 'power4.out' }, 0.55)
        .to({}, { duration: 0.3 }, 1.15)
      // 2) La respuesta
        .to(q('.ib-pregunta'), { scale: 0.42, y: function () { return -geo.H * 0.1; }, duration: 0.4, ease: 'power3.inOut' }, 1.45)
        .to(q('.ib-eti'), { autoAlpha: 0, duration: 0.2 }, 1.45)
        .fromTo(q('.ib-no'), { autoAlpha: 0, scale: 1.3 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'power4.out' }, 1.7)
        .fromTo(lienzo, { autoAlpha: 0, scale: 1.12 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'power2.out' }, 1.85)
        .to(sitio, { scale: 0.62, duration: 0.6, ease: 'power2.inOut' }, 1.85)
        .fromTo(q('.ib-frase1'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power3.out' }, 2.05)
        .to({}, { duration: 0.5 }, 2.45)
      // 3) El puente: los canales
        .to([q('.ib-no'), q('.ib-frase1')], { autoAlpha: 0, y: -14, duration: 0.25, stagger: 0.05, ease: 'power2.in' }, 2.95)
        .to(lienzo, { autoAlpha: 0.22, duration: 0.4 }, 3.0)
        .to(sitio, { scale: 1, duration: 0.45, ease: 'power3.out' }, 3.05)
        .fromTo(lineas, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.3, stagger: 0.08, ease: 'power2.out' }, 3.15)
        .fromTo(canales, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.3, stagger: 0.08, ease: 'back.out(1.6)' }, 3.25)
        .fromTo(q('.ib-frase2'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power3.out' }, 3.4)
        .to({}, { duration: 0.6 }, 3.9)
      // 4) Los canales vuelan a su lugar en el índice; lo demás se va
        .to([q('.ib-pregunta'), q('.ib-frase2'), sitio], { autoAlpha: 0, y: '-=18', duration: 0.3, stagger: 0.04, ease: 'power2.in' }, 4.5)
        .to(lienzo, { autoAlpha: 0, duration: 0.3 }, 4.5)
        .to(lineas, { autoAlpha: 0, duration: 0.2 }, 4.5)
        .to(canales, { x: function (i) { return destino(i, 'x'); }, y: function (i) { return destino(i, 'y'); }, scale: 0.7,
                       duration: 0.7, stagger: 0.04, ease: 'power3.inOut' }, 4.55)
        .to(canales, { autoAlpha: 0, duration: 0.12, ease: 'power1.in' }, 5.42);   // el índice real aparece en el mismo lugar
    }



    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      paused: true   // se reproduce por capítulos (ver bloque 8); ya no va ligada al scroll
    });
    // Entrada del escenario (primeras ~0,9 pantallas fijadas): aparece el fondo y los dispositivos crecen
    // hasta su tamaño, primero el iPad del negocio y, con un leve desfase, el iPhone del cliente.
    // Con opacity (no visibility) el navegador pinta las capas mientras la sección sube transparente,
    // y no todas juntas en el cuadro en que aparecen.
    tl.fromTo(marco, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.06, ease: 'power2.out' }, 0)
      .fromTo($('.relato-escena'), { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'power2.out' }, 0.04)
      .fromTo($('.relato-historia'), { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'power2.out' }, 0.08)
      .fromTo($('.relato-rol-negocio'), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: 'power2.out' }, 0.3);
    tl.set({}, {}, TOTAL);   // la línea de tiempo dura exactamente TOTAL pantallas

    /* ---------- Utilidades de la coreografía (todo vive en la misma línea de tiempo con scrub) ---------- */
    // Escritura real: las letras (o palabras, para la IA) aparecen una por una, sin fundido.
    function escribir(el, inicio, dur, porPalabra) {
      if (!el) return;
      if (!el.classList.contains("rp-stream")) animarTeclado(tl, el.closest(".relato-pantalla"), el, inicio, dur);
      var unidades = [el];
      if (Split) {
        var s = Split.create(el, { type: porPalabra ? 'words' : 'words, chars' });
        unidades = porPalabra ? s.words : s.chars;
      }
      tocados.push.apply(tocados, unidades);
      tl.fromTo(unidades, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.001, ease: 'none',
        stagger: unidades.length > 1 ? dur / (unidades.length - 1) : 0 }, inicio);
    }
    function teclear(el, inicio, dur) {
      if (!el) return;
      var unidades = [el];
      if (Split) unidades = Split.create(el, { type: 'words, chars' }).chars;
      tocados.push.apply(tocados, unidades);
      tl.fromTo(unidades, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.001, ease: 'none',
        stagger: unidades.length > 1 ? dur / (unidades.length - 1) : 0 }, inicio);
    }
    function aparecer(el, inicio, desde, dur) {
      if (!el) return;
      tocados.push(el);
      var origen = { autoAlpha: 0 };
      for (var k in desde) origen[k] = desde[k];
      tl.fromTo(el, origen, { autoAlpha: 1, x: 0, y: 0, yPercent: 0, scale: 1, duration: dur || 0.18, ease: 'power3.out' }, inicio);
    }
    // Toque del dedo: se hunde apenas y vuelve.
    function tocar(el, t) {
      if (!el) return;
      tocados.push(el);
      tl.to(el, { scale: 0.95, duration: 0.05, ease: 'power2.out' }, t);
      tl.to(el, { scale: 1, duration: 0.08, ease: 'power2.out' }, t + 0.05);
    }

    // 2) Títulos: uno a la vez, revelado por líneas con máscara (sin blur ni letras fantasma).
    function revelarTitulo(cap, entra, sale) {
      tl.set(cap, { autoAlpha: 1 }, entra);
      if (sale != null) tl.set(cap, { autoAlpha: 0 }, sale + 0.24);
      var titular = cap.querySelector('.relato-h');
      if (!titular) return;
      var previas = [];
      function animar(lineas) {
        previas.forEach(function (a) { a.kill(); });
        previas = [];
        var a = gsap.fromTo(lineas, { yPercent: 105, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.55, stagger: 0.06, ease: 'power4.out' });
        tl.add(a, entra); previas.push(a);
        if (sale != null) {
          var b = gsap.to(lineas, { yPercent: -75, opacity: 0, duration: 0.32, stagger: 0.03, ease: 'power2.inOut', immediateRender: false });
          tl.add(b, sale); previas.push(b);
        }
      }
      if (!Split) { animar([titular]); return; }
      Split.create(titular, { type: 'lines', mask: 'lines', linesClass: 'relato-linea', autoSplit: true,
        onSplit: function (self) { animar(self.lines); } });
    }
    var orden = [
      { entra: ENTRADA_APP[0], cap: caps[0] },
      { entra: ENTRADA_APP[1], cap: ideas[0] },
      { entra: ENTRADA_APP[2], cap: caps[1] },
      { entra: ENTRADA_APP[3], cap: ideas[1] },
      { entra: ENTRADA_APP[4], cap: caps[2] },
      { entra: ENTRADA_APP[5], cap: null }
    ];
    orden.forEach(function (o, i) {
      var siguiente = orden[i + 1];
      if (o.cap) revelarTitulo(o.cap, o.entra, siguiente ? siguiente.entra - 0.24 : null);
    });

    // 3) Lo que hace el cliente dentro de cada app (t = la app ya terminó de abrirse).
    var ESCENAS = [
      function (p, t) {   // Google: escribe, aparecen los resultados y toca el sitio
        escribir(p.querySelector('.rp-escribe'), t, 0.3);
        aparecer(p.querySelector('.rp-resultados'), t + 0.75, { y: 8 }, 0.25);
        var tuyo = p.querySelector('.rp-fila--tuyo');
        if (tuyo) {
          tocados.push(tuyo);
          tl.fromTo(tuyo, { backgroundColor: 'rgba(74,99,120,0)' }, { backgroundColor: 'rgba(74,99,120,.16)', duration: 0.06 }, t + 1.35);
          tocar(tuyo, t + 1.32);
        }
      },
      function (p, t) {   // Maps: cae el pin, sube la ficha y pide la ruta
        animarMapa(tl, p, t);
        tocados.push.apply(tocados, p.querySelectorAll('.rp-maps-consulta, .rp-pin, .rp-ficha, .rp-boton, .rp-ruta-panel, .rp-ruta-linea, .rp-ruta-origen'));
      },
      function (p, t) {   // Perfil: marca 5 estrellas, escribe la reseña y publica
        var estrellas = p.querySelectorAll('.rp-estrellas-in i');
        tocados.push.apply(tocados, estrellas);
        tl.fromTo(estrellas, { color: '#d8d2c6' }, { color: '#e0a93b', duration: 0.03, stagger: 0.05 }, t);
        tl.fromTo(estrellas, { scale: 1 }, { scale: 1.28, duration: 0.035, stagger: 0.05, yoyo: true, repeat: 1, ease: 'power2.out' }, t);
        escribir(p.querySelector('.rp-escribe'), t + 0.5, 0.3);
        tocar(p.querySelector('.rp-boton--publicar'), t + 1.0);
      },
      function (p, t) {   // WhatsApp: escribe, envía y llegan los dos tics azules
        var texto = p.querySelector('.rp-envio .rp-escribe');
        escribir(texto, t, 0.3);
        tocar(p.querySelector('.rp-envio-boton'), t + 0.34);
        if (texto) tl.to(texto, { autoAlpha: 0, duration: 0.01 }, t + 0.38);
        aparecer(p.querySelector('.rp-enviado'), t + 0.38, { scale: 0.86, y: 6 }, 0.16);
        var tics = p.querySelector('.rp-ticks');
        if (tics) { tocados.push(tics); tl.fromTo(tics, { color: '#9a9a9a' }, { color: '#34b7f1', duration: 0.04 }, t + 0.62); }
      },
      function (p, t) {   // IA: pregunta, el agente busca y lee el sitio, responde citándolo
        var consulta = p.querySelector('.rp-ia-compositor .rp-escribe');
        escribir(consulta, t, 0.3);
        tl.to(p.querySelector('.rp-ia-compositor'), { autoAlpha: 0, duration: 0.08 }, t + 0.48);
        aparecer(p.querySelector('.rp-burbuja--yo'), t + 0.5, { y: 6 }, 0.14);
        aparecer(p.querySelector('.rp-agente'), t + 0.66, { y: 4 }, 0.1);
        var ico = p.querySelector('.rp-agente-ico');
        if (ico) { tocados.push(ico); tl.fromTo(ico, { rotation: 0 }, { rotation: 360, duration: 0.56 }, t + 0.66); }
        var paso1 = p.querySelector('.rp-paso--1'), paso2 = p.querySelector('.rp-paso--2');
        if (paso1 && paso2) {
          tocados.push(paso1, paso2);
          tl.to(paso1, { autoAlpha: 0, duration: 0.04 }, t + 0.92);
          tl.fromTo(paso2, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04 }, t + 0.92);
        }
        tl.to(p.querySelector('.rp-agente'), { autoAlpha: 0, duration: 0.1 }, t + 1.18);
        aparecer(p.querySelector('.rp-burbuja--ia'), t + 1.22, { y: 6 }, 0.1);
        escribir(p.querySelector('.rp-stream'), t + 1.24, 0.5, true);
        aparecer(p.querySelector('.rp-ia-detalles'), t + 1.76, { y: 7 }, 0.25);
      },
      function (p, t) {   // Instagram: recorre las obras del perfil (pequeño scroll) y toca "Ver sitio web"
        var grilla = p.querySelector('.rp-ig-grilla'), boton = p.querySelector('.rp-ig-btn--sitio');
        if (grilla) {
          tocados.push(grilla);
          tl.fromTo(grilla, { yPercent: 0 }, { yPercent: -38, duration: 0.45, ease: 'power2.inOut' }, t + 0.05)
            .to(grilla, { yPercent: -14, duration: 0.3, ease: 'power2.inOut' }, t + 0.6);
        }
        if (boton) {
          tocados.push(boton);
          tocar(boton, t + 1.0);
          tl.fromTo(boton, { backgroundColor: '#efefef', color: '#111' }, { backgroundColor: '#0095f6', color: '#fff', duration: 0.08 }, t + 1.02);
        }
      }
    ];

    // 4) iPhone: ya está en su pantalla de inicio cuando llega la sección; cada app se abre DESDE su
    // ícono (toque + zoom) y se cierra de vuelta hacia él antes de abrir la siguiente.
    if (telefono) {
      var abierta = null;
      orden.forEach(function (o, i) {
        var p = pantallas[i];
        if (!p) return;
        var E = ENTRADA_APP[i];
        if (abierta) tl.to(abierta, { scale: 0.16, borderRadius: '24%', autoAlpha: 0, duration: 0.26, ease: 'power2.inOut' }, E - 0.3);
        if (apps[i]) {
          tl.to(apps[i], { scale: 0.93, duration: 0.05, ease: 'power2.out' }, E - 0.07);
          tl.to(apps[i], { scale: 1, duration: 0.1, ease: 'power2.out' }, E + 0.25);
        }
        tl.fromTo(p, { scale: 0.16, borderRadius: '24%', autoAlpha: 0 },
          { scale: 1, borderRadius: '0%', autoAlpha: 1, duration: 0.34, ease: 'power3.out' }, E);
        if (ESCENAS[i]) ESCENAS[i](p, E + 0.36);
        abierta = p;
      });
    }

    // 5) iPad del dueño: cada acción del cliente llega a la app real donde la vería. La app cambia con el
    //    negocio (fundido corto, como al cambiar de app) y, justo después de la acción, cambia lo que
    //    corresponde: sube una cifra, aparece una fila o se abre el chat.
    var VISTA_DE = [0, 1, 1, 2, 3, 0];
    var telResena = pantallas[2], telWa = pantallas[3];
    var FOCO_EXTRA = [];   // cambios de turno dentro de una conversación: [quién habla, momento]
    var DIALOGO = {
      2: function (abre) {   // Reseña: el dueño toca Responder, escribe y publica; María lo ve en su iPhone
        var resp = seccion.querySelector('.rpa-respuesta');
        tocar(seccion.querySelector('.rpa-boton--responder'), abre + 0.5);
        tl.set(seccion.querySelector('.rpa-boton--responder'), { display: 'none' }, abre + 0.6);   // sin dejar hueco
        aparecer(resp, abre + 0.6, { y: -6 }, 0.22);
        teclear(resp && resp.querySelector('.rpa-teclea'), abre + 0.78, 0.6);
        tocar(resp && resp.querySelector('.rpa-boton--publicar'), abre + 1.45);
        tl.to(resp && resp.querySelector('.rpa-boton--publicar'), { autoAlpha: 0, duration: 0.12 }, abre + 1.56);
        FOCO_EXTRA.push(['cliente', abre + 1.66]);
        aparecer(telResena && telResena.querySelector('.rp-respuesta-dueno'), abre + 1.78, { y: 18 }, 0.3);
      },
      3: function (abre) {   // WhatsApp: el dueño responde, Camila recibe y contesta, el dueño lo ve
        var campo = seccion.querySelector('.rpa-wa-escribir');
        tl.to(campo && campo.querySelector('.rpa-wa-placeholder'), { autoAlpha: 0, duration: 0.05 }, abre + 0.42);
        teclear(campo && campo.querySelector('.rpa-teclea'), abre + 0.45, 0.6);
        tocar(campo && campo.querySelector('.rpa-wa-enviar'), abre + 1.1);
        tl.to(campo && campo.querySelector('.rpa-teclea'), { autoAlpha: 0, duration: 0.03 }, abre + 1.15)
          .to(campo && campo.querySelector('.rpa-wa-placeholder'), { autoAlpha: 1, duration: 0.05 }, abre + 1.18);
        aparecer(seccion.querySelector('[data-ipad-envia="3"]'), abre + 1.15, { y: 8, scale: 0.96 }, 0.2);
        FOCO_EXTRA.push(['cliente', abre + 1.36]);
        if (telWa) {
          aparecer(telWa.querySelector('.rp-wa-entrante'), abre + 1.48, { y: 6, scale: 0.96 }, 0.18);
          var segundo = telWa.querySelector('.rp-escribe--2');
          escribir(segundo, abre + 1.85, 0.4);
          tocar(telWa.querySelector('.rp-envio-boton'), abre + 2.3);
          if (segundo) tl.to(segundo, { autoAlpha: 0, duration: 0.01 }, abre + 2.34);
          aparecer(telWa.querySelector('.rp-enviado-2'), abre + 2.34, { scale: 0.86, y: 6 }, 0.16);
        }
        FOCO_EXTRA.push(['negocio', abre + 2.56]);
        aparecer(seccion.querySelector('[data-ipad-recibe="3"]'), abre + 2.66, { y: 6, scale: 0.96 }, 0.2);
      }
    };
    var $$ = function (sel) { return Array.prototype.slice.call(seccion.querySelectorAll(sel)); };
    vistas.forEach(function (v, k) { if (v) { tocados.push(v); tl.set(v, { autoAlpha: k === 0 ? 1 : 0 }, 0); } });
    orden.forEach(function (o, i) {
      var v = VISTA_DE[i];
      var t = ENTRADA_APP[i] + AVISO[i];
      var aviso = seccion.querySelector('[data-banner="' + i + '"]');
      var abre = aviso ? t + 0.65 : t;   // con aviso: baja, el dueño lo toca y se abre
      if (aviso) {
        tocados.push(aviso);
        tl.fromTo(aviso, { autoAlpha: 0, yPercent: -130 }, { autoAlpha: 1, yPercent: 0, duration: 0.28, ease: 'power3.out' }, t);
        tocar(aviso, t + 0.48);
        tl.to(aviso, { autoAlpha: 0, yPercent: -130, duration: 0.18, ease: 'power2.in' }, t + 0.6);
      }
      // La app anterior sigue en pantalla mientras el cliente actúa; cambia justo antes del resultado.
      if (i > 0 && v !== VISTA_DE[i - 1] && vistas[v]) {
        tl.to(vistas[VISTA_DE[i - 1]], { autoAlpha: 0, scale: 0.985, duration: 0.16, ease: 'power2.in' }, t - 0.42)
          .fromTo(vistas[v], { autoAlpha: 0, scale: 1.015 }, { autoAlpha: 1, scale: 1, duration: 0.22, ease: 'power3.out' }, t - 0.3);
      }
      // Cifras que suben un número (el nuevo entra desde abajo)
      $$('.rpa-cifra[data-escena="' + i + '"]').forEach(function (c) {
        var b = c.querySelectorAll('b');
        tocados.push(b[0], b[1]);
        tl.fromTo([b[0], b[1]], { yPercent: 0 }, { yPercent: -100, duration: 0.22, ease: 'power3.inOut' }, abre);
      });
      // Cifras que suben por segunda vez (tercer número)
      $$('.rpa-cifra[data-escena2="' + i + '"]').forEach(function (c) {
        var b = c.querySelectorAll('b');
        tl.to(b, { yPercent: -200, duration: 0.22, ease: 'power3.inOut' }, abre);
      });
      // Filas que se marcan un momento sin aparecer (ya estaban)
      $$('[data-resalta="' + i + '"]').forEach(function (el) {
        tocados.push(el);
        tl.fromTo(el, { outlineColor: 'rgba(26,115,232,.6)' }, { outlineColor: 'rgba(26,115,232,0)', duration: 0.6, ease: 'power2.out', immediateRender: false }, abre + 0.3);   // la fila ya está a la vista: sin marcar antes de tiempo
      });
      // Barra del minuto actual en Analytics
      $$('[data-crece="' + i + '"]').forEach(function (barra) {
        tocados.push(barra);
        tl.fromTo(barra, { scaleY: 0 }, { scaleY: 1, duration: 0.25, ease: 'power3.out' }, abre);
      });
      // Lo que aparece (fila nueva, reseña, chat de Camila)
      $$('[data-aparece="' + i + '"]').forEach(function (el) {
        tocados.push(el);
        var hueco = el.parentNode.classList.contains('rpa-wa-hueco') ? el.parentNode : null;
        if (hueco) { tocados.push(hueco); tl.fromTo(hueco, { gridTemplateRows: '0fr' }, { gridTemplateRows: '1fr', duration: 0.24, ease: 'power3.out' }, abre); }
        tl.fromTo(el, { autoAlpha: 0, y: hueco ? 0 : -10 }, { autoAlpha: 1, y: 0, duration: 0.26, ease: 'power3.out' }, abre + (hueco ? 0.06 : 0));
        if (el.classList.contains('rpa-resalta')) {
          tl.fromTo(el, { outlineColor: 'rgba(26,115,232,.6)' }, { outlineColor: 'rgba(26,115,232,0)', duration: 0.6, ease: 'power2.out' }, abre + 0.55);
        }
      });
      DIALOGO[i] && DIALOGO[i](abre);
    });

    // 6) Foco: habla uno a la vez. Mientras el cliente actúa, un velo crema cubre el iPad; cuando le llega
    //    el resultado al negocio, el velo pasa al iPhone. El dispositivo sigue sólido (no se transparenta
    //    el fondo): solo cambia la opacidad del velo.
    function velo(contenedor) {
      if (!contenedor) return null;
      var v = document.createElement('span');
      v.className = 'relato-velo';
      v.setAttribute('aria-hidden', 'true');
      contenedor.appendChild(v);
      tocados.push(v);
      return v;
    }
    var veloCliente = velo(telefono), veloNegocio = velo($('.relato-escena'));
    var ladoCliente = [veloCliente].filter(Boolean);
    var ladoNegocio = [veloNegocio].filter(Boolean);
    var rolNegocio = $('.relato-zona--negocio') || $('.relato-rol-negocio'), rolCliente = $('.relato-zona--cliente') || $('.relato-rol-cliente');
    function foco(veloHabla, veloCalla, rolHabla, rolCalla, t) {
      tl.to(veloCalla, { opacity: 1, duration: 0.2, ease: 'power2.inOut' }, t)
        .to(veloHabla, { opacity: 0, duration: 0.2, ease: 'power2.inOut' }, t);
      if (rolCalla) tl.to(rolCalla, { opacity: 0.45, duration: 0.2, ease: 'power2.inOut' }, t);
      if (rolHabla) tl.to(rolHabla, { opacity: 1, duration: 0.2, ease: 'power2.inOut' }, t);
    }
    var turnos = FOCO_EXTRA.slice();
    orden.forEach(function (o, i) {
      turnos.push(['cliente', Math.max(0.56, ENTRADA_APP[i] - 0.12)]);   // empieza el cliente (al tocar la app)
      turnos.push(['negocio', ENTRADA_APP[i] + AVISO[i] - 0.06]);        // le llega al negocio
    });
    turnos.sort(function (a, b) { return a[1] - b[1]; }).forEach(function (q) {
      if (q[0] === 'cliente') foco(ladoCliente, ladoNegocio, rolCliente, rolNegocio, q[1]);
      else foco(ladoNegocio, ladoCliente, rolNegocio, rolCliente, q[1]);
    });
    var finFoco = ENTRADA_APP[ENTRADA_APP.length - 1] + AVISO[AVISO.length - 1] + 1.2;
    tl.to(ladoCliente.concat(ladoNegocio), { opacity: 0, duration: 0.2, ease: 'power2.inOut' }, finFoco)
      .to([rolCliente, rolNegocio].filter(Boolean), { opacity: 1, duration: 0.2, ease: 'power2.inOut' }, finFoco);

    // 7) Explicación paso a paso (columna izquierda): un capítulo a la vez; cada paso aparece cuando
    //    ocurre en los equipos y el anterior queda atenuado, para leer la secuencia completa.
    var guionCaps = porIndice('data-guion', 6);
    var indice = Array.prototype.slice.call(document.querySelectorAll('.relato-indice [data-indice]'));
    var ESTADO_HECHO = { opacity: 1, backgroundColor: '#ffffff', color: '#16120f', scale: 1,
      boxShadow: 'inset 0 0 0 1px rgba(62,88,112,.16)', duration: 0.24, ease: 'power2.out' };
    PASOS.forEach(function (momentos, c) {
      var cap = guionCaps[c];
      if (!cap) return;
      var entra = momentos[0] - 0.14;
      tocados.push(cap);
      if (c > 0 && guionCaps[c - 1]) tl.to(guionCaps[c - 1], { autoAlpha: 0, y: -16, duration: 0.18, ease: 'power2.in' }, entra - 0.04);
      tl.fromTo(cap, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.32, ease: 'power3.out' }, entra);
      if (indice[c]) {   // índice: el capítulo en curso se destaca; el anterior queda en color (ya pasó)
        tocados.push(indice[c], indice[c].querySelector('svg'));
        tl.to(indice[c], { opacity: 1, backgroundColor: '#16120f', color: '#faf5ef', scale: 1.06,
          boxShadow: '0 12px 26px -12px rgba(22,18,15,.65)', duration: 0.24, ease: 'power3.out' }, entra)
          .to(indice[c].querySelector('svg'), { filter: 'grayscale(0)', duration: 0.24 }, entra);
        if (c > 0 && indice[c - 1]) tl.to(indice[c - 1], ESTADO_HECHO, entra);
      }
      var ico = cap.querySelector('.rg-ico');   // el ícono del canal entra primero, con un pequeño rebote
      if (ico) { tocados.push(ico); tl.fromTo(ico, { scale: 0.35, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.55, ease: 'back.out(2)' }, entra + 0.06); }
      var pasos = cap.querySelectorAll('.rg-paso');
      // "Cómo lo logramos": aparece poco después del último paso y queda hasta el capítulo siguiente
      var como = cap.querySelector('.rg-como');
      if (como) { tocados.push(como); tl.fromTo(como, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.32, ease: 'power3.out' }, momentos[2] + 0.4); }
      momentos.forEach(function (m, k) {
        if (!pasos[k]) return;
        tocados.push(pasos[k]);
        tl.fromTo(pasos[k], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power3.out' }, m);
        if (k > 0) tl.to(pasos[k - 1], { opacity: 0.4, duration: 0.2, ease: 'power2.out' }, m);
      });
    });
    // Cada ícono del índice reproduce su capítulo desde el inicio.
    var repetir = Array.prototype.slice.call(seccion.querySelectorAll('[data-repetir]'));
    function irACapitulo(ev) { reproducirCap(+ev.currentTarget.getAttribute('data-repetir')); }
    repetir.forEach(function (b) { b.addEventListener('click', irACapitulo); });

    // 8) Reproducción automática por capítulos. La sección ocupa una pantalla (no se fija): al llegar parte el
    //    capítulo 1; al terminar cada uno espera unos segundos (para leer "Cómo lo logramos") y sigue con el
    //    siguiente; después del 6 aparece el cierre. Pausar/Reproducir, anterior y siguiente junto a los íconos.
    //    Se pausa si la sección sale de la pantalla y se retoma al volver.
    var resumen = document.querySelector('.relato-resumen');
    var VEL = 1.4, ESPERA = 3.6, FIN_RELATO = 28.9;   // segundos por unidad de la línea de tiempo; pausa entre capítulos
    var reproduccion = null, esperaSiguiente = null, capEnCurso = 0, enPausa = false, empezado = false, aLaVista = false;
    var control = seccion.querySelector('.relato-control');
    var btnPausa = control && control.querySelector('.rc-pausa'), btnAntCap = control && control.querySelector('.rc-ant'), btnSigCap = control && control.querySelector('.rc-sig');
    function inicioCap(c) { return Math.max(0.3, PASOS[c][0] - 0.2); }
    function finCap(c) { return c < PASOS.length - 1 ? PASOS[c + 1][0] - 0.3 : PASOS[c][2] + 1.85; }
    // Vuelo del ícono del capítulo: al terminar, sale de su lugar junto a «Capítulo N» y viaja en curva (con una
    // estela fina, la misma técnica del hero) hasta su botón del índice, que late al recibirlo. Solo se lanza
    // en reproducción continua; con pausa, saltos o navegación manual no hay vuelo (se ve el estado final).
    var vuelo = { espera: null, tl: null, copia: null, traza: null, destino: null };
    var DURACION_VUELO = 0.95;
    function terminarVuelo() {
      if (vuelo.tl) { vuelo.tl.kill(); vuelo.tl = null; }
      if (vuelo.copia) { vuelo.copia.remove(); vuelo.copia = null; }
      if (vuelo.traza) { vuelo.traza.remove(); vuelo.traza = null; }
      if (vuelo.destino) { vuelo.destino.classList.remove('ri-llega'); vuelo.destino = null; }
    }
    function limpiarVuelo() {
      if (vuelo.espera) { vuelo.espera.kill(); vuelo.espera = null; }
      terminarVuelo();
      guionCaps.forEach(function (g) { if (g) g.classList.remove('vuela'); });
    }
    function lanzarVuelo(c) {
      var cap = guionCaps[c], ico = cap && cap.querySelector('.rg-ico'), boton = indice[c], dest = boton && boton.querySelector('svg');
      if (!ico || !dest || enPausa || !aLaVista) return;
      var a = ico.getBoundingClientRect(), b = dest.getBoundingClientRect();
      if (!a.width || !b.width) return;
      terminarVuelo();
      var x0 = a.left + a.width / 2, y0 = a.top + a.height / 2, x1 = b.left + b.width / 2, y1 = b.top + b.height / 2;
      var cx = Math.min(x0, x1) - 70, cy = (y0 + y1) / 2;   // el índice está abajo: la curva baja abriéndose hacia el margen izquierdo
      var copia = ico.cloneNode(true), NS = 'http://www.w3.org/2000/svg';
      copia.className = 'rg-vuelo';
      copia.style.width = a.width + 'px'; copia.style.height = a.height + 'px';
      var svgIco = ico.querySelector('svg'), svgCopia = copia.querySelector('svg');
      if (svgIco && svgCopia) svgCopia.style.color = getComputedStyle(svgIco).color;
      var traza = document.createElementNS(NS, 'svg'), camino = document.createElementNS(NS, 'path');
      traza.setAttribute('class', 'rg-vuelo-estela'); traza.setAttribute('aria-hidden', 'true');
      var mx = Math.min(x0, x1, cx) - 6, my = Math.min(y0, y1) - 6;
      var ancho = Math.max(x0, x1, cx) + 6 - mx, alto = Math.max(y0, y1) + 6 - my;   // la capa mide solo lo que ocupa la curva
      traza.setAttribute('width', ancho); traza.setAttribute('height', alto); traza.setAttribute('viewBox', '0 0 ' + ancho + ' ' + alto);
      traza.style.left = mx + 'px'; traza.style.top = my + 'px';
      camino.setAttribute('d', 'M' + (x0 - mx) + ' ' + (y0 - my) + 'Q' + (cx - mx) + ' ' + (cy - my) + ' ' + (x1 - mx) + ' ' + (y1 - my));
      traza.appendChild(camino);
      document.body.appendChild(traza); document.body.appendChild(copia);
      var largo = camino.getTotalLength(), k = { t: 0 }, fin = b.width / a.width, mw = a.width / 2, mh = a.height / 2;
      gsap.set(camino, { strokeDasharray: largo, strokeDashoffset: largo });
      gsap.set(copia, { x: x0 - mw, y: y0 - mh });
      cap.classList.add('vuela');
      vuelo.copia = copia; vuelo.traza = traza;
      vuelo.tl = gsap.timeline({ onComplete: function () {
        terminarVuelo();
        boton.classList.add('ri-llega'); vuelo.destino = boton;
        setTimeout(function () { boton.classList.remove('ri-llega'); }, 650);
      } })
        .to(k, { t: 1, duration: DURACION_VUELO, ease: 'power2.inOut', onUpdate: function () {
          var t = k.t, u = 1 - t;
          gsap.set(copia, { x: u * u * x0 + 2 * u * t * cx + t * t * x1 - mw, y: u * u * y0 + 2 * u * t * cy + t * t * y1 - mh, scale: 1 + (fin - 1) * t });
        } }, 0)
        .to(camino, { strokeDashoffset: 0, duration: DURACION_VUELO, ease: 'power2.inOut' }, 0)
        .to(copia, { opacity: 0, duration: 0.16, ease: 'power2.in' }, DURACION_VUELO - 0.16)
        .to(traza, { opacity: 0, duration: 0.4, ease: 'power2.out' }, DURACION_VUELO - 0.1);
    }
    function detener() {
      if (reproduccion) { reproduccion.kill(); reproduccion = null; }
      if (esperaSiguiente) { esperaSiguiente.kill(); esperaSiguiente = null; }
      limpiarVuelo();
    }
    function actualizarControl() {
      if (!control) return;
      control.classList.toggle('en-pausa', enPausa);
      if (btnPausa) { btnPausa.setAttribute('aria-label', enPausa ? 'Reproducir' : 'Pausar'); btnPausa.title = enPausa ? 'Reproducir' : 'Pausar'; }
      if (btnAntCap) btnAntCap.disabled = capEnCurso === 0;
      if (btnSigCap) btnSigCap.disabled = capEnCurso >= PASOS.length;
    }
    function reproducirCap(c) {
      detener();
      empezado = true;
      if (saltado) enPausa = true;   // tras saltar: cada capítulo se muestra completo, listo para leer
      capEnCurso = Math.max(0, Math.min(PASOS.length, c));
      seccion.classList.toggle('relato-en-cierre', capEnCurso === PASOS.length);
      if (capEnCurso === PASOS.length) {   // el cierre
        reproduccion = tl.tweenFromTo(finCap(PASOS.length - 1), FIN_RELATO, { duration: 2.4, ease: 'none' });
        saltado = true; marcarSalto();   // terminada: aviso y luego scroll libre
        mostrarPista();
        liberarTrasAviso();
      } else {
        reproduccion = tl.tweenFromTo(inicioCap(capEnCurso), finCap(capEnCurso),
          { duration: (finCap(capEnCurso) - inicioCap(capEnCurso)) * VEL, ease: 'none', onComplete: alTerminarCap });
      }
      if (enPausa || !aLaVista) {
        reproduccion.pause();
        // En pausa, el capítulo elegido se muestra completo (listo para leer); al reproducir, parte desde su inicio
        if (enPausa) tl.time(capEnCurso === PASOS.length ? FIN_RELATO : finCap(capEnCurso) - 0.02);
      }
      actualizarControl();
    }
    function alTerminarCap() {
      var c = capEnCurso;
      esperaSiguiente = gsap.delayedCall(ESPERA, function () { reproducirCap(capEnCurso + 1); });
      if (enPausa || !aLaVista) { esperaSiguiente.pause(); return; }
      vuelo.espera = gsap.delayedCall(ESPERA - DURACION_VUELO - 0.5, function () { lanzarVuelo(c); });   // sale tras leer «Cómo lo logramos»
    }
    function pausar() {
      if (reproduccion) reproduccion.pause(); if (esperaSiguiente) esperaSiguiente.pause();
      if (vuelo.espera) vuelo.espera.pause(); terminarVuelo();   // un vuelo en curso se cierra: no queda nada flotando
      guionCaps.forEach(function (g) { if (g) g.classList.remove('vuela'); });
    }
    function reanudar() {
      if (reproduccion) reproduccion.resume(); if (esperaSiguiente) esperaSiguiente.resume();
      if (vuelo.espera) vuelo.espera.resume();
    }
    function alternarPausa() {
      enPausa = !enPausa;
      if (enPausa) pausar(); else if (!empezado) reproducirCap(0); else reanudar();
      actualizarControl();
    }
    function capAnterior() { reproducirCap(capEnCurso - 1); }
    function capSiguiente() { reproducirCap(capEnCurso + 1); }
    // "Saltar animación": detiene la reproducción y muestra el cierre, con los íconos destacados y el mensaje
    // "Recorre la solución paso a paso con estos botones"; el botón desaparece y el scroll se libera tras el aviso.
    var saltado = false, btnSaltarAnim = seccion.querySelector('.relato-saltar-anim');
    function mostrarPista() {   // aviso breve junto a los íconos: aparece y se difumina
      seccion.classList.remove('pista-aviso'); void seccion.offsetWidth; seccion.classList.add('pista-aviso');
    }
    function marcarSalto() {
      seccion.classList.toggle('relato-saltado', saltado);
    }
    // Tras saltar (o al terminar sola): aviso destacado ~2,5 s y luego el scroll queda libre (sin botón "Continuar")
    var timerLibre = null;
    function liberarTrasAviso() { clearTimeout(timerLibre); timerLibre = setTimeout(liberar, 2500); }
    function saltarOContinuar() {   // "Saltar animación": se queda en la sección, capítulo 1 completo + aviso
      if (saltado) return;
      saltado = true; enPausa = true;
      marcarSalto();
      reproducirCap(0);
      mostrarPista();
      liberarTrasAviso();
      var primero = seccion.querySelector('.relato-indice [data-indice]');
      if (primero) primero.focus({ preventScroll: true });
    }
    if (btnSaltarAnim) btnSaltarAnim.addEventListener('click', saltarOContinuar);
    if (btnPausa) btnPausa.addEventListener('click', alternarPausa);
    if (btnAntCap) btnAntCap.addEventListener('click', capAnterior);
    if (btnSigCap) btnSigCap.addEventListener('click', capSiguiente);
    // La sección se fija un tramo corto (2 pantallas) para que no se pase de largo con el scroll: el escenario
    // se queda quieto mientras los capítulos se reproducen; si la persona sigue bajando, pasa a Servicios.
    var fijacion = ST.create({
      trigger: seccion, start: 'top top', end: function () { return '+=' + Math.round(window.innerHeight * 2); },
      pin: true, invalidateOnRefresh: true
    });
    // Bloqueo: mientras la animación está en curso no se puede bajar más allá de la sección. Se libera al tocar
    // "Saltar animación", cuando la animación termina sola o al usar un enlace del menú. Subir siempre se puede.
    var libre = false;
    function liberar() { if (libre) return; libre = true; seccion.classList.add('relato-libre'); }
    function avisarBloqueo() {
      if (!btnSaltarAnim || avisarBloqueo._t || saltado) return;   // tras saltar ya se ve el aviso
      btnSaltarAnim.classList.remove('llama'); void btnSaltarAnim.offsetWidth; btnSaltarAnim.classList.add('llama');
      avisarBloqueo._t = setTimeout(function () { avisarBloqueo._t = null; }, 900);
    }
    function sujetar() {
      if (libre || !fijacion) return;
      var tope = fijacion.start + 2;
      if (window.scrollY > tope + 1) {
        if (window.lenis) window.lenis.scrollTo(tope, { immediate: true, force: true }); else window.scrollTo(0, tope);
        avisarBloqueo();
      }
    }
    if (window.lenis) window.lenis.on('scroll', sujetar);
    window.addEventListener('scroll', sujetar, { passive: true });
    function alClicMenu(ev) { var a = ev.target.closest && ev.target.closest('a[href^="#"]'); if (a && a.getAttribute('href') !== '#inicio') liberar(); }
    document.addEventListener('click', alClicMenu, true);
    // Parte cuando la sección llega arriba (justo cuando terminan de volar los íconos de la introducción). Si se
    // vuelve a subir, la línea de tiempo vuelve a 0 (escenario oculto) para que la introducción se vea igual.
    function volverCargada() {
      enPausa = true;
      // Queda en el cuadro final de donde iba; si había llegado al cierre, en el final del capítulo 6
      reproducirCap(Math.min(capEnCurso, PASOS.length - 1));
      mostrarPista();
    }
    var tramoRelato = ST.create({
      trigger: seccion, start: 'top 2px',
      onEnter: function () {
        aLaVista = true; seccion.classList.add('relato-en-curso');
        introVista = true;   // desde ahora la introducción queda en su cuadro final
        if (saltado) { volverCargada(); return; }   // ya la vio o la saltó: queda en su cuadro final
        if (!empezado) reproducirCap(0); else if (!enPausa) reanudar();
      },
      onEnterBack: function () { aLaVista = true; seccion.classList.add('relato-en-curso'); if (saltado) volverCargada(); },
      onLeaveBack: function () {
        aLaVista = false; seccion.classList.remove('relato-en-curso'); pausar();
        // Si ya saltó la animación, no se reinicia en esta visita (solo al recargar la página): se oculta el
        // escenario para que la introducción se vea limpia, pero se conserva el capítulo y el modo lectura.
        // nada se rebobina: el escenario se desvanece con el scroll (fundido con la intro)
      }
    });
    // Si la sección sale de la pantalla hacia abajo (o vuelve), pausa y retoma
    var vigia = new IntersectionObserver(function (e) {
      var visible = e[0].isIntersecting;
      if (!empezado) return;
      aLaVista = visible;
      if (visible && !enPausa) reanudar(); else pausar();
    }, { threshold: 0.35 });
    vigia.observe(seccion);
    actualizarControl();
    function abrirResumen() {
      if (!resumen) return;
      var lista = resumen.querySelector('.rr-capitulos'), pestanas = resumen.querySelector('.rr-pestanas');
      if (!lista.childElementCount) {
        // Un capítulo a la vez (sin scroll): pestañas con los íconos del índice + el capítulo completo, grande
        var iconos = Array.prototype.slice.call(seccion.querySelectorAll('.relato-indice [data-indice] svg'));
        guionCaps.forEach(function (cap, i) {
          if (!cap) return;
          var tab = document.createElement('button');
          tab.type = 'button'; tab.className = 'rr-tab'; tab.setAttribute('role', 'tab'); tab.id = 'rr-tab-' + i;
          tab.setAttribute('aria-controls', 'rr-cap-' + i);
          tab.innerHTML = (iconos[i] ? iconos[i].outerHTML : '') + '<span>' + cap.querySelector('.rg-eti').textContent.split('·').pop().trim() + '</span>';
          tab.addEventListener('click', function () { verCapitulo(i, true); });
          pestanas.appendChild(tab);
          var art = document.createElement('article');
          art.className = 'rr-cap'; art.id = 'rr-cap-' + i; art.setAttribute('role', 'tabpanel'); art.setAttribute('aria-labelledby', 'rr-tab-' + i);
          var pasos = Array.prototype.map.call(cap.querySelectorAll('.rg-paso'), function (p, k) {
            var quien = p.querySelector('.rg-quien');
            return '<li><span class="rr-n">' + (k + 1) + '</span><div><p class="rr-quien ' + quien.className.replace('rg-quien', 'rr-q') + '">' + quien.textContent +
              '</p><p class="rr-txt">' + p.querySelector('.rg-txt').textContent + '</p></div></li>';
          }).join('');
          var como = cap.querySelector('.rg-como-txt');
          art.innerHTML = '<p class="rr-cap-eti">' + cap.querySelector('.rg-eti').textContent + '</p>' +
            '<h3>' + cap.querySelector('.rg-titulo').textContent + '</h3><div class="rr-cap-grilla"><ol>' + pasos + '</ol>' +
            (como ? '<div class="rr-como"><p class="rr-como-eti">Cómo lo logramos</p><p>' + como.textContent + '</p></div>' : '') + '</div>';
          lista.appendChild(art);
        });
        pestanas.addEventListener('keydown', function (ev) {
          if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
          ev.preventDefault();
          verCapitulo((capActual + (ev.key === 'ArrowRight' ? 1 : -1) + guionCaps.length) % guionCaps.length, true);
        });
      }
      verCapitulo(capActual, false);
      if (window.lenis) window.lenis.stop();
      if (resumen.showModal) resumen.showModal(); else resumen.setAttribute('open', '');
    }
    var capActual = 0;
    function verCapitulo(i, enfocar) {
      capActual = i;
      Array.prototype.forEach.call(resumen.querySelectorAll('.rr-tab'), function (t, k) {
        t.setAttribute('aria-selected', k === i ? 'true' : 'false'); t.tabIndex = k === i ? 0 : -1;
        if (k === i && enfocar) t.focus();
      });
      Array.prototype.forEach.call(resumen.querySelectorAll('.rr-cap'), function (c, k) { c.hidden = k !== i; });
      var ant = resumen.querySelector('.rr-ant'), sig = resumen.querySelector('.rr-sig');
      if (ant) ant.disabled = i === 0;
      if (sig) sig.disabled = i === guionCaps.length - 1;
    }
    function alCerrarResumen() { if (window.lenis) window.lenis.start(); }
    function cerrarResumen() { if (resumen.close) resumen.close(); else resumen.removeAttribute('open'); alCerrarResumen(); }
    var btnCerrar = resumen && resumen.querySelector('.rr-cerrar');
    var btnLeer = seccion.querySelector('.relato-leer-btn');
    function leerDesdeCierre() { capActual = 0; abrirResumen(); }
    if (btnLeer) btnLeer.addEventListener('click', leerDesdeCierre);
    if (btnCerrar) btnCerrar.addEventListener('click', cerrarResumen);
    var btnAnt = resumen && resumen.querySelector('.rr-ant'), btnSig = resumen && resumen.querySelector('.rr-sig');
    function anterior() { if (capActual > 0) verCapitulo(capActual - 1, false); }
    function siguiente() { if (capActual < guionCaps.length - 1) verCapitulo(capActual + 1, false); }
    if (btnAnt) btnAnt.addEventListener('click', anterior);
    if (btnSig) btnSig.addEventListener('click', siguiente);
    if (resumen) resumen.addEventListener('close', alCerrarResumen);

    var cierre = $('.relato-final');
    var cierreTexto = cierre && cierre.querySelectorAll('.relato-cierre-antes, .relato-h, .relato-p, .relato-puente, .relato-leer');
    var cierreLinea = cierre && cierre.querySelector('.relato-cierre-linea');
    if (indice[5]) tl.to(indice[5], ESTADO_HECHO, 27.2);
    // (el aviso "Recorre la solución…" no va en la línea de tiempo: ver mostrarPista)
    if (cierre) {
      tl.fromTo(cierre, { autoAlpha: 0, yPercent: 8 }, { autoAlpha: 1, yPercent: 0, duration: 0.8, ease: 'power2.inOut' }, 27.2);
      tl.fromTo(cierreTexto, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.22, ease: 'power3.out' }, 27.65);
      tl.fromTo(cierreLinea, { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: 'power2.inOut' }, 28.0);
    }

    // El panel de respuesta de WhatsApp ya no se muestra: la notificación ampliada trae el mismo
    // mensaje y su botón "Responder".
    var respuesta = $('.relato-respuesta');

    return function () {
      if (entrada.scrollTrigger) entrada.scrollTrigger.kill();
      entrada.kill();
      if (introRecorrido && introLugar.parentNode) {
        introLugar.parentNode.insertBefore(introRecorrido, introLugar);
        introLugar.remove();
        gsap.set([introRecorrido, introLinea].concat(Array.from(introTexto)), { clearProps: 'all' });
        introRecorrido.classList.remove('ib-activo');
      }
      gsap.set([hero.querySelector('.hero-texto'), hero.querySelector('.hero-media'), $('.relato-historia'), $('.relato-escena'), $('.relato-rol-negocio')], { clearProps: 'all' });
      if (rotulos && contenedorRotulos) contenedorRotulos.insertBefore(rotulos, telefono);
      Array.prototype.forEach.call(seccion.querySelectorAll('.relato-velo'), function (v) { v.remove(); });
      repetir.forEach(function (b) { b.removeEventListener('click', irACapitulo); });
      detener();
      tramoRelato.kill();
      if (window.lenis) window.lenis.off('scroll', sujetar);
      window.removeEventListener('scroll', sujetar);
      document.removeEventListener('click', alClicMenu, true);
      seccion.classList.remove('relato-libre');
      fijacion.kill(true);
      vigia.disconnect();
      if (btnPausa) btnPausa.removeEventListener('click', alternarPausa);
      if (btnSaltarAnim) btnSaltarAnim.removeEventListener('click', saltarOContinuar);
      clearTimeout(timerLibre);
      seccion.classList.remove('relato-en-curso', 'relato-saltado', 'relato-en-cierre', 'pista-aviso');
      if (btnAntCap) btnAntCap.removeEventListener('click', capAnterior);
      if (btnSigCap) btnSigCap.removeEventListener('click', capSiguiente);
      if (btnLeer) btnLeer.removeEventListener('click', leerDesdeCierre);
      if (btnCerrar) btnCerrar.removeEventListener('click', cerrarResumen);
      window.removeEventListener('resize', colocarFotos);
      ST.removeEventListener('refresh', colocarFotos);
      marco.classList.remove('con-fotos');
      seccion.classList.remove('relato-activo');
      gsap.set([marco, telefono].concat(caps, ideas, pantallas, apps, notifs, tocados, [respuesta, cierre, cierreLinea], Array.from(cierreTexto || [])).filter(Boolean), { clearProps: 'all' });
    };
  });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
})();
