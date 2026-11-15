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
  if (!marco || !pin || !film || !gsap || !ST) return;
  if (!film.canPlayType || !film.canPlayType('video/mp4')) return;
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
  var pantallas = porIndice('data-pantalla', 5);
  var apps = porIndice('data-app', 5);
  var notifs = porIndice('data-notif', 5);
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
    linea.fromTo(pin, { autoAlpha: 0, y: -18 }, { autoAlpha: 1, y: 0, duration: 0.22, ease: 'back.out(1.4)' }, t + 0.3);
    linea.fromTo(ficha, { autoAlpha: 0, yPercent: 100 }, { autoAlpha: 1, yPercent: 0, duration: 0.24, ease: 'power2.out' }, t + 0.42);
    linea.to(boton, { scale: 0.95, duration: 0.07, yoyo: true, repeat: 1 }, t + 0.85);
    linea.to(ficha, { autoAlpha: 0, yPercent: 80, duration: 0.16 }, t + 1.0);
    linea.fromTo(panel, { autoAlpha: 0, yPercent: 35 }, { autoAlpha: 1, yPercent: 0, duration: 0.24, ease: 'power2.out' }, t + 1.05);
    linea.fromTo(trazos, { autoAlpha: 1, strokeDasharray: 300, strokeDashoffset: 300 }, { strokeDashoffset: 0, duration: 0.46, ease: 'power2.inOut' }, t + 1.04);
    linea.fromTo(origen, { autoAlpha: 0, scale: 0.5, transformOrigin: 'center' }, { autoAlpha: 1, scale: 1, duration: 0.18 }, t + 1.05);
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

  var TOTAL = 14.8;                               // pantallas de scroll mientras la sección está fijada

  // Entrada de cada negocio en pantallas, calculada desde los segundos reales de cada uno en el clip
  // (0–14,92 s) repartidos linealmente: constructora ≈1,7–2,5, minimarket ≈5,4–5,9, consulta ≈9,3–10,0.
  
  // Tarjetas interpretativas, en los tramos donde la cámara solo viaja entre un negocio y otro.
  
  // Cuándo le llega al iPad la notificación de cada escena, contado desde que se abre la app: justo
  // después de la acción del cliente (tocar el resultado, pedir la ruta, publicar, enviar, citar).
  var AVISO = [0.98, 1.78, 1.08, 0.8, 1.66];
  var ENTRADA_APP = [0.75, 3.25, 5.65, 7.55, 8.9];   // 0,8 antes que la versión anterior: sin tramo vacío al inicio

  /* ---------- Coreografía (solo ≥900px y sin "reducir movimiento") ---------- */
  var mm = gsap.matchMedia();
  mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', function () {
    var tocados = [];

    seccion.classList.add('relato-activo');
    var rotulos = $('.relato-rotulos');
    var contenedorRotulos = rotulos && rotulos.parentNode;
    var pantallaIpad = $('.relato-ipad-pantalla');
    if (rotulos && pantallaIpad) pantallaIpad.appendChild(rotulos);

    var hero = document.getElementById('inicio');
    var introRecorrido = document.querySelector('.intro-recorrido');
    var introLugar = document.createComment('posición de la introducción');
    if (introRecorrido) {
      introRecorrido.parentNode.insertBefore(introLugar, introRecorrido);
      hero.appendChild(introRecorrido);
    }
    var entrada = gsap.timeline({
      scrollTrigger: {
        trigger: hero, start: 'top top', end: function () { return '+=' + Math.round(window.innerHeight * 2.15); },
        pin: true, scrub: true,
        invalidateOnRefresh: true
      }
    });
    if (introRecorrido) {
      var introTexto = introRecorrido.querySelectorAll('.relato-cierre-antes, .relato-h, .relato-p');
      var introLinea = introRecorrido.querySelector('.relato-cierre-linea');
      entrada.fromTo(introRecorrido, { autoAlpha: 0, yPercent: 8 }, { autoAlpha: 1, yPercent: 0, duration: 0.8, ease: 'power2.inOut' }, 0)
        .fromTo(introTexto, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.22, ease: 'power3.out' }, 0.45)
        .fromTo(introLinea, { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: 'power2.inOut' }, 0.8)
        // Última pantalla del hero fijado: el texto se va mientras la sección del relato (transparente y
        // vacía, ver CSS .relato-activo) sube encima; al llegar arriba se fija y los dispositivos crecen.
        .to(introLinea, { scaleX: 0, duration: 0.28, ease: 'power2.inOut' }, 2.0)
        .to(introTexto, { autoAlpha: 0, y: -42, duration: 0.5, stagger: 0.08, ease: 'power2.inOut' }, 2.05)
        .to({}, { duration: 0.25 });
    }



    /* ---------- Video: posición ligada linealmente al scroll ----------
       Se descarga como Blob cuando la sección está cerca (búsquedas exactas por cuadro, sin
       depender de range-requests). Nunca se pide un cuadro nuevo mientras el anterior sigue en
       curso: se espera a que "seeked" resuelva antes de solicitar el cuadro más reciente. */
    var FPS = 48;
    var avance = 0, solicitado = -1, cerca = false, cargando = false, terminado = false;
    var descarga = new AbortController(), fuente = null;

    function sincronizar() {
      if (!cerca || film.seeking || film.readyState < 2 || !Number.isFinite(film.duration)) return;
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

    film.style.opacity = '0';
    film.addEventListener('loadeddata', sincronizar);
    film.addEventListener('seeked', mostrarCuadro);
    observador.observe(pin);

    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      onUpdate: function () { if (this.scrollTrigger) actualizarAvance(Math.min(1, this.time() / 12.5)); },
      scrollTrigger: { trigger: seccion, start: 'top top', end: '+=' + TOTAL * 180 + '%', pin: true, scrub: true, invalidateOnRefresh: true }
    });
    // Entrada del escenario (primeras ~0,9 pantallas fijadas): aparece el fondo y los dispositivos crecen
    // hasta su tamaño, primero el iPad del negocio y, con un leve desfase, el iPhone del cliente.
    // Con opacity (no visibility) el navegador pinta las capas mientras la sección sube transparente,
    // y no todas juntas en el cuadro en que aparecen.
    tl.fromTo(marco, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' }, 0)
      .fromTo($('.relato-escena'), { opacity: 0, scale: 0.86, y: 40 }, { opacity: 1, scale: 1, y: 0, duration: 0.42, ease: 'power3.out' }, 0.04)
      .fromTo($('.relato-historia'), { opacity: 0, scale: 0.86, y: 40 }, { opacity: 1, scale: 1, y: 0, duration: 0.42, ease: 'power3.out' }, 0.12)
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
      { entra: ENTRADA_APP[4], cap: caps[2] }
    ];
    orden.forEach(function (o, i) {
      var siguiente = orden[i + 1];
      if (o.cap) revelarTitulo(o.cap, o.entra, siguiente ? siguiente.entra - 0.24 : null);
    });

    // 3) Lo que hace el cliente dentro de cada app (t = la app ya terminó de abrirse).
    var ESCENAS = [
      function (p, t) {   // Google: escribe, aparecen los resultados y toca el sitio
        escribir(p.querySelector('.rp-escribe'), t, 0.3);
        aparecer(p.querySelector('.rp-resultados'), t + 0.36, { y: 8 }, 0.2);
        var tuyo = p.querySelector('.rp-fila--tuyo');
        if (tuyo) {
          tocados.push(tuyo);
          tl.fromTo(tuyo, { backgroundColor: 'rgba(74,99,120,0)' }, { backgroundColor: 'rgba(74,99,120,.16)', duration: 0.06 }, t + 0.58);
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
        escribir(p.querySelector('.rp-escribe'), t + 0.3, 0.3);
        tocar(p.querySelector('.rp-boton--publicar'), t + 0.66);
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

    // 5) iPad del dueño: la notificación de cada acción baja desde arriba y la anterior se va por el
    // mismo camino (un banner a la vez, como en iPadOS).
    var avisoPrevio = null;
    orden.forEach(function (o, i) {
      var n = notifs[i];
      if (!n) return;
      var t = ENTRADA_APP[i] + AVISO[i];
      if (avisoPrevio) tl.to(avisoPrevio, { yPercent: -150, autoAlpha: 0, duration: 0.2, ease: 'power2.inOut' }, t);
      tl.fromTo(n, { yPercent: -150, autoAlpha: 0, scale: 0.96 }, { yPercent: 0, autoAlpha: 1, scale: 1, duration: 0.3, ease: 'power3.out' }, t + 0.08);
      // El dueño toca el video para leerla: aparecen los controles del reproductor, toca pausa y,
      // un momento después, los controles se ocultan solos (como en iPadOS).
      if (reproductor) {
        var pausa = reproductor.querySelector('.rr-pausa');
        tl.to(reproductor, { autoAlpha: 1, duration: 0.14, ease: 'power2.out' }, t + 0.18);
        if (pausa) {
          tl.to(pausa, { scale: 0.9, duration: 0.05, ease: 'power2.out' }, t + 0.26);
          tl.to(pausa, { scale: 1, duration: 0.08, ease: 'power2.out' }, t + 0.31);
        }
        tl.to(reproductor, { autoAlpha: 0, duration: 0.16, ease: 'power2.inOut' }, t + 1.0);
      }
      avisoPrevio = n;
    });

    var cierre = $('.relato-final');
    var cierreTexto = cierre && cierre.querySelectorAll('.relato-cierre-antes, .relato-h, .relato-p');
    var cierreLinea = cierre && cierre.querySelector('.relato-cierre-linea');
    if (cierre) {
      tl.fromTo(cierre, { autoAlpha: 0, yPercent: 8 }, { autoAlpha: 1, yPercent: 0, duration: 0.8, ease: 'power2.inOut' }, 12.2);
      tl.fromTo(cierreTexto, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.22, ease: 'power3.out' }, 12.65);
      tl.fromTo(cierreLinea, { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: 'power2.inOut' }, 13.0);
    }

    // El panel de respuesta de WhatsApp ya no se muestra: la notificación ampliada trae el mismo
    // mensaje y su botón "Responder", y el panel tapaba la barra del reproductor.
    var respuesta = $('.relato-respuesta');

    return function () {
      terminado = true;
      descarga.abort();
      observador.disconnect();
      film.removeEventListener('loadeddata', sincronizar);
      film.removeEventListener('seeked', mostrarCuadro);
      film.removeAttribute('src');
      film.load();
      if (fuente) URL.revokeObjectURL(fuente);
      if (entrada.scrollTrigger) entrada.scrollTrigger.kill();
      entrada.kill();
      if (introRecorrido && introLugar.parentNode) {
        introLugar.parentNode.insertBefore(introRecorrido, introLugar);
        introLugar.remove();
        gsap.set([introRecorrido, introLinea].concat(Array.from(introTexto)), { clearProps: 'all' });
      }
      gsap.set([hero.querySelector('.hero-texto'), hero.querySelector('.hero-media'), $('.relato-historia'), $('.relato-escena'), $('.relato-rol-negocio')], { clearProps: 'all' });
      if (rotulos && contenedorRotulos) contenedorRotulos.insertBefore(rotulos, telefono);
      seccion.classList.remove('relato-activo');
      if (reproductor) reproductor.style.removeProperty('--avance');
      gsap.set([marco, film, telefono, reproductor, reproductor && reproductor.querySelector('.rr-pausa')].concat(caps, ideas, pantallas, apps, notifs, tocados, [respuesta, cierre, cierreLinea], Array.from(cierreTexto || [])).filter(Boolean), { clearProps: 'all' });
    };
  });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
})();
