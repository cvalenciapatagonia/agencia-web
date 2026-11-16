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
  var film = seccion.querySelector('.relato-film');
  if (!marco || !pin || !gsap || !ST) return;
  if (film && (!film.canPlayType || !film.canPlayType('video/mp4'))) film = null;   // rama relato-panel: sin video
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
    var pantallaIpad = $('.relato-ipad-pantalla');
    // Con el panel, los títulos de cada escena quedan sobre el iPhone (no dentro del iPad).
    if (rotulos && pantallaIpad && film) pantallaIpad.appendChild(rotulos);
    else if (rotulos) marco.appendChild(rotulos);   // sin video: subtítulo centrado bajo los dos dispositivos

    var hero = document.getElementById('inicio');
    var introRecorrido = document.querySelector('.intro-recorrido');
    var introLugar = document.createComment('posición de la introducción');
    if (introRecorrido) {
      introRecorrido.parentNode.insertBefore(introLugar, introRecorrido);
      hero.appendChild(introRecorrido);
    }
    var entrada = gsap.timeline({
      scrollTrigger: {
        trigger: hero, start: 'top top', end: function () { return '+=' + Math.round(window.innerHeight * (introRecorrido && introRecorrido.querySelector('.ib') ? 4.6 : 1.7)); },
        pin: true, scrub: true,
        invalidateOnRefresh: true
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



    /* ---------- Video: posición ligada linealmente al scroll ----------
       Se descarga como Blob cuando la sección está cerca (búsquedas exactas por cuadro, sin
       depender de range-requests). Nunca se pide un cuadro nuevo mientras el anterior sigue en
       curso: se espera a que "seeked" resuelva antes de solicitar el cuadro más reciente. */
    var FPS = 48;
    var avance = 0, solicitado = -1, cerca = false, cargando = false, terminado = false;
    var descarga = new AbortController(), fuente = null;

    function sincronizar() {
      if (!film || !cerca || film.seeking || film.readyState < 2 || !Number.isFinite(film.duration)) return;
      var ultimo = Math.round(film.duration * FPS) - 1;
      var cuadro = Math.round(avance * ultimo);
      if (cuadro === solicitado) return;
      solicitado = cuadro;
      film.currentTime = (cuadro + 0.25) / FPS;
    }
    function mostrarCuadro() { film.style.opacity = '1'; sincronizar(); }

    // Barra y tiempos del reproductor del iPad: siguen la posición real del clip (14,92 s).
    var reproductor = $('.relato-reproductor');
    var relojActual = $('.rr-tiempo--actual'), relojResta = $('.rr-tiempo--resta');
    var DURACION = 14.9167, segundoMostrado = -1;
    function mmss(s) { return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
    function moverReproductor() {
      if (!reproductor) return;
      reproductor.style.setProperty('--avance', (avance * 100).toFixed(2) + '%');
      var s = Math.floor(avance * DURACION);
      if (s === segundoMostrado || !relojActual || !relojResta) return;
      segundoMostrado = s;
      relojActual.textContent = mmss(s);
      relojResta.textContent = '-' + mmss(Math.max(0, Math.ceil(DURACION) - s));
    }
    function actualizarAvance(p) {
      // Correspondencia entre el tiempo del relato y los cortes reales del video (14,92 s).
      // Así Google, Maps/reseñas y WhatsApp/IA coinciden con su respectivo negocio.
      var puntos = [[0, 0], [0.75, 2.07], [2.8, 4.8], [3.25, 5.15], [5.65, 7.5], [7.0, 8.7], [7.55, 10.2], [8.9, 11.2], [12.5, 14.9167]];
      var tiempo = Math.min(12.5, Math.max(0, p * 12.5));
      for (var i = 1; i < puntos.length; i++) {
        if (tiempo <= puntos[i][0]) {
          var anterior = puntos[i - 1], siguiente = puntos[i];
          var fraccion = (tiempo - anterior[0]) / (siguiente[0] - anterior[0]);
          avance = (anterior[1] + fraccion * (siguiente[1] - anterior[1])) / 14.9167;
          break;
        }
      }
      moverReproductor();
      sincronizar();
    }
    function cargarFilm() {
      cargando = true;
      fetch('assets/video/relato-scroll-1080.mp4', { signal: descarga.signal }).then(function (r) {
        if (!r.ok) throw new Error('Video no disponible');
        return r.blob();
      }).then(function (clip) {
        if (terminado) return;
        fuente = URL.createObjectURL(clip);
        film.preload = 'auto';
        film.src = fuente;
      }).catch(function () { /* queda la pantalla negra del iPad */ });
    }
    var observador = new IntersectionObserver(function (entradas) {
      if (terminado) return;
      cerca = entradas[0].isIntersecting;
      if (cerca && !cargando) cargarFilm();
      sincronizar();
    }, { rootMargin: '100% 0px' });

    if (film) {
      film.style.opacity = '0';
      film.addEventListener('loadeddata', sincronizar);
      film.addEventListener('seeked', mostrarCuadro);
      observador.observe(pin);
    }

    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      onUpdate: function () { if (this.scrollTrigger) actualizarAvance(Math.min(1, this.time() / 12.5)); },
      scrollTrigger: { trigger: seccion, start: 'top top', end: '+=' + TOTAL * 180 + '%', pin: true, scrub: true, invalidateOnRefresh: true }
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
    // Al terminar: cada botón vuelve al inicio de su capítulo (salto directo; el scrub lo deja en ese punto).
    var repetir = Array.prototype.slice.call(seccion.querySelectorAll('[data-repetir]'));
    function irACapitulo(ev) {
      var c = +ev.currentTarget.getAttribute('data-repetir'), st = tl.scrollTrigger;
      if (!st) return;
      var y = st.start + Math.max(0, (PASOS[c][0] + 0.32) / TOTAL) * (st.end - st.start);   // ya con el título y el paso 1
      if (window.lenis) window.lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y);
    }
    repetir.forEach(function (b) { b.addEventListener('click', irACapitulo); });

    // 8) Saltar o leer en resumen: aviso fijo al comenzar la introducción (texto + 2 botones) que, ya dentro del
    //    relato, se reduce a un botón "Saltar" en la esquina. "Saltar" lleva al final del relato (cierre con el
    //    índice para volver a ver); "Leer en resumen" abre un panel con los 6 capítulos en texto.
    var aviso = document.querySelector('.relato-saltar'), resumen = document.querySelector('.relato-resumen');
    var FIN_RELATO = 27.6;   // momento en que el cierre ya está a la vista
    function irAlFinal() {
      var st = tl.scrollTrigger;
      if (!st) return;
      var y = st.start + (FIN_RELATO / TOTAL) * (st.end - st.start);
      if (window.lenis) window.lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y);
      var primero = seccion.querySelector('.relato-indice [data-indice]');
      if (primero) primero.focus({ preventScroll: true });
    }
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
    var btnSaltar = aviso && aviso.querySelector('.rs-saltar'), btnResumen = aviso && aviso.querySelector('.rs-resumen');
    var btnCerrar = resumen && resumen.querySelector('.rr-cerrar');
    if (btnSaltar) btnSaltar.addEventListener('click', irAlFinal);
    if (btnResumen) btnResumen.addEventListener('click', abrirResumen);
    if (btnCerrar) btnCerrar.addEventListener('click', cerrarResumen);
    var btnAnt = resumen && resumen.querySelector('.rr-ant'), btnSig = resumen && resumen.querySelector('.rr-sig');
    function anterior() { if (capActual > 0) verCapitulo(capActual - 1, false); }
    function siguiente() { if (capActual < guionCaps.length - 1) verCapitulo(capActual + 1, false); }
    if (btnAnt) btnAnt.addEventListener('click', anterior);
    if (btnSig) btnSig.addEventListener('click', siguiente);
    if (resumen) resumen.addEventListener('close', alCerrarResumen);
    // Visible desde que empieza la introducción hasta que aparece el cierre; compacto dentro del relato
    var tramoAviso = aviso && ST.create({
      start: function () { return entrada.scrollTrigger.start + window.innerHeight * 0.3; },
      end: function () { var st = tl.scrollTrigger; return st.start + ((FIN_RELATO - 0.6) / TOTAL) * (st.end - st.start); },
      onToggle: function (s) { aviso.classList.toggle('visible', s.isActive); },
      onUpdate: function () { aviso.classList.toggle('compacto', window.scrollY > tl.scrollTrigger.start + 40); }
    });

    var cierre = $('.relato-final');
    var cierreTexto = cierre && cierre.querySelectorAll('.relato-cierre-antes, .relato-h, .relato-p, .relato-puente');
    var cierreLinea = cierre && cierre.querySelector('.relato-cierre-linea');
    if (indice[5]) tl.to(indice[5], ESTADO_HECHO, 27.2);
    var pista = document.querySelector('.ri-pista');
    if (pista) { tocados.push(pista); tl.fromTo(pista, { autoAlpha: 0, x: -8 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: 'power3.out' }, 27.6); }
    if (cierre) {
      tl.fromTo(cierre, { autoAlpha: 0, yPercent: 8 }, { autoAlpha: 1, yPercent: 0, duration: 0.8, ease: 'power2.inOut' }, 27.2);
      tl.fromTo(cierreTexto, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.22, ease: 'power3.out' }, 27.65);
      tl.fromTo(cierreLinea, { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: 'power2.inOut' }, 28.0);
    }

    // El panel de respuesta de WhatsApp ya no se muestra: la notificación ampliada trae el mismo
    // mensaje y su botón "Responder", y el panel tapaba la barra del reproductor.
    var respuesta = $('.relato-respuesta');

    return function () {
      terminado = true;
      descarga.abort();
      observador.disconnect();
      if (film) {
        film.removeEventListener('loadeddata', sincronizar);
        film.removeEventListener('seeked', mostrarCuadro);
        film.removeAttribute('src');
        film.load();
      }
      if (fuente) URL.revokeObjectURL(fuente);
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
      if (tramoAviso) tramoAviso.kill();
      if (aviso) aviso.classList.remove('visible', 'compacto');
      if (btnSaltar) btnSaltar.removeEventListener('click', irAlFinal);
      if (btnResumen) btnResumen.removeEventListener('click', abrirResumen);
      if (btnCerrar) btnCerrar.removeEventListener('click', cerrarResumen);
      window.removeEventListener('resize', colocarFotos);
      ST.removeEventListener('refresh', colocarFotos);
      marco.classList.remove('con-fotos');
      seccion.classList.remove('relato-activo');
      if (reproductor) reproductor.style.removeProperty('--avance');
      gsap.set([marco, film, telefono, reproductor, reproductor && reproductor.querySelector('.rr-pausa')].concat(caps, ideas, pantallas, apps, notifs, tocados, [respuesta, cierre, cierreLinea], Array.from(cierreTexto || [])).filter(Boolean), { clearProps: 'all' });
    };
  });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
})();
