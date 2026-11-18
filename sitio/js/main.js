(function () {
  'use strict';

  var config = window.SITIO || {};

  /* ---------- WhatsApp: un solo origen para todos los botones ---------- */
  var numero = String(config.whatsappNumero || '').replace(/\D/g, '');
  var enlacesWa = document.querySelectorAll('[data-whatsapp]');
  if (numero) {
    var url = 'https://wa.me/' + numero +
      (config.whatsappMensaje ? '?text=' + encodeURIComponent(config.whatsappMensaje) : '');
    enlacesWa.forEach(function (a) {
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
    });
  } else {
    var aviso = document.querySelector('.aviso-config');
    if (aviso) aviso.hidden = false;
  }

  /* ---------- Menú móvil ---------- */
  var menu = document.querySelector('.menu');
  var menuBtn = document.querySelector('.menu-btn');
  if (menu && menuBtn) {
    var cerrar = function () {
      menu.classList.remove('abierto');
      menuBtn.setAttribute('aria-expanded', 'false');
    };
    menuBtn.addEventListener('click', function () {
      var abierto = menu.classList.toggle('abierto');
      menuBtn.setAttribute('aria-expanded', String(abierto));
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) cerrar();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('abierto')) {
        cerrar();
        menuBtn.focus();
      }
    });
  }

  /* ---------- Navbar: fondo más sólido al bajar y sección activa ---------- */
  var raiz = document.documentElement;
  /* ---------- Logo: siempre vuelve al inicio ----------
     Con el hero fijado por la animación, el navegador cree que #inicio ya está a la vista y no se mueve.
     Se salta directo arriba (sin recorrer toda la animación hacia atrás). */
  var logo = document.querySelector('.cabecera .marca');
  if (logo) logo.addEventListener('click', function (ev) {
    ev.preventDefault();
    if (window.lenis) window.lenis.scrollTo(0, { immediate: true }); else window.scrollTo(0, 0);
    if (history.replaceState) history.replaceState(null, '', location.pathname + location.search);
  });

  var marcarScroll = function () { raiz.classList.toggle('con-scroll', window.scrollY > 24); };
  marcarScroll();
  window.addEventListener('scroll', marcarScroll, { passive: true });

  var enlacesMenu = Array.prototype.slice.call(document.querySelectorAll('.menu-lista a[href^="#"]'));
  if ('IntersectionObserver' in window && enlacesMenu.length) {
    var seccionActiva = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        enlacesMenu.forEach(function (a) {
          if (a.getAttribute('href') === '#' + e.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    enlacesMenu.forEach(function (a) {
      var sec = document.querySelector(a.getAttribute('href'));
      if (sec) seccionActiva.observe(sec);
    });
    // Fuera de esas secciones (hero, recorrido, preguntas) no se marca ninguna.
    ['inicio', 'recorrido', 'preguntas', 'contacto'].forEach(function (id) {
      var sec = document.getElementById(id);
      if (!sec) return;
      new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
          if (e.isIntersecting) enlacesMenu.forEach(function (a) { a.removeAttribute('aria-current'); });
        });
      }, { rootMargin: '-45% 0px -50% 0px' }).observe(sec);
    });
  }

  /* ---------- Video del hero ---------- */
  var hero = document.querySelector('.hero');
  var video = document.querySelector('.escena-video');
  var control = document.querySelector('.video-control');
  var controlTxt = document.querySelector('.video-control-txt');
  var saltar = document.querySelector('.video-saltar');
  var tarjetas = Array.prototype.slice.call(document.querySelectorAll('.tarjeta[data-desde]'));

  if (hero && video && control) iniciarVideo();

  function iniciarVideo() {
    var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var ahorroDatos = !!(navigator.connection && navigator.connection.saveData);
    var pantallaChica = window.matchMedia('(max-width: 899px)').matches;
    var iniciado = false;   // el usuario o el autoplay ya comenzaron la reproducción
    var cuadro = null;

    // Fuentes: versión liviana en pantallas chicas, WebM + MP4 en escritorio.
    var fuentes = pantallaChica
      ? [['assets/video/hero-720.mp4', 'video/mp4']]
      : [['assets/video/hero-1080.mp4', 'video/mp4'], ['assets/video/hero-1080.webm', 'video/webm']];
    fuentes.forEach(function (f, i) {
      var s = document.createElement('source');
      s.src = f[0];
      s.type = f[1];
      if (i === fuentes.length - 1) s.addEventListener('error', fallo);
      video.appendChild(s);
    });
    video.addEventListener('error', fallo);

    // Velocidad del video. Las tarjetas dependen del tiempo del video, así que al bajarla
    // todas se estiran juntas y siguen sincronizadas. Se reafirma al cargar los metadatos
    // porque algunos navegadores la reinician al cambiar de fuente.
    var VELOCIDAD = 1;
    video.defaultPlaybackRate = VELOCIDAD;
    video.playbackRate = VELOCIDAD;
    video.addEventListener('loadedmetadata', function () { video.playbackRate = VELOCIDAD; });

    // modoFinal: no hay reproducción y se muestra la imagen del último fotograma
    // con la composición final de tarjetas (movimiento reducido, ahorro de datos,
    // reproducción automática bloqueada o video que no carga).
    var modoFinal = false;
    var FINAL = 1e9;
    var previo = -1;   // tiempo de la sincronización anterior (para detectar cuándo termina una tarjeta)
    var listaChips = document.querySelector('.chips-canales');
    var chips = Array.prototype.slice.call(document.querySelectorAll('.chips-canales a[data-gana]'));

    // Cuando se muestra la composición final, los chips están todos encendidos.
    function sinColeccion() { if (listaChips) listaChips.classList.remove('coleccion'); }

    /* Vuelo de un logo desde su tarjeta hasta su chip, en arco, dejando una
       estela fina con los colores de su marca (dibujada en un canvas). */
    var COLORES = {
      google: ['#4285F4', '#EA4335', '#FBBC05', '#34A853'],
      mapa: ['#1A73E8', '#EA4335', '#FBBC04', '#34A853'],
      resenas: ['#1A73E8', '#4285F4', '#8AB4F8'],
      whatsapp: ['#25D366', '#128C7E', '#25D366'],
      ia: ['#3E5870', '#7F97AD', '#B9CBDC']
    };
    var VIDA_ESTELA = 450;   // ms que dura cada punto de la estela
    var DUR_VUELO = 950;     // ms que tarda un logo en llegar a su chip
    var MUESTRAS = 48;       // puntos de la trayectoria precalculada

    function mezclar(c1, c2, f) {
      var a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
      var r = Math.round(((a >> 16) & 255) * (1 - f) + ((b >> 16) & 255) * f);
      var g = Math.round(((a >> 8) & 255) * (1 - f) + ((b >> 8) & 255) * f);
      var bl = Math.round((a & 255) * (1 - f) + (b & 255) * f);
      return 'rgb(' + r + ',' + g + ',' + bl + ')';
    }
    function colorEn(paleta, f) {
      var x = f * (paleta.length - 1), i = Math.min(Math.floor(x), paleta.length - 2);
      return mezclar(paleta[i], paleta[i + 1], x - i);
    }
    function suavizar(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }

    /* El vuelo se calcula una sola vez al despegar: la curva, la escala y la estela quedan como
       animaciones Web Animations (transform y opacity), que el navegador corre en el compositor
       aunque el hilo principal esté ocupado sincronizando tarjetas. Las coordenadas son de la
       página (position:absolute), así el vuelo no se descuadra si se hace scroll a medio camino. */
    function volar(origen, destino, retraso, canal) {
      var a = origen.getBoundingClientRect();
      var b = destino.getBoundingClientRect();
      if (!a.width || !b.width || !document.body.animate) return;
      var sx = window.scrollX, sy = window.scrollY;
      var x0 = a.left + a.width / 2 + sx, y0 = a.top + a.height / 2 + sy;
      var x2 = b.left + b.width / 2 + sx, y2 = b.top + b.height / 2 + sy;
      // Curva con dos puntos de control: si el logo viene de arriba, baja por el espacio entre
      // el texto y el notebook; si viene de abajo, baja junto al teléfono y pasa bajo los equipos.
      var x1, y1, x3, y3;
      if (y0 < y2 - 300) { x1 = x0; y1 = y2; x3 = x0; y3 = y2; }
      else { var fondo = Math.max(y0, y2) + 150; x1 = x0; y1 = fondo; x3 = (x0 + x2) / 2; y3 = fondo; }
      var escalaFin = b.width / a.width, paleta = COLORES[canal] || COLORES.ia;

      var caja = document.createElement('div');
      caja.className = 'vuelo';
      caja.setAttribute('aria-hidden', 'true');
      var copia = origen.cloneNode(true);
      copia.removeAttribute('data-vuela');
      caja.appendChild(copia);
      var est = getComputedStyle(origen);
      caja.style.cssText = 'position:absolute;left:0;top:0;width:' + a.width + 'px;height:' + a.height + 'px;color:' + est.color +
        ';border-radius:' + est.borderRadius + ';opacity:0;will-change:transform,opacity' +
        (est.backgroundImage !== 'none' ? ';background:' + est.backgroundImage : '');

      var cuadros = [], estela = document.createDocumentFragment(), puntos = [];
      for (var i = 0; i <= MUESTRAS; i++) {
        var t = i / MUESTRAS, k = suavizar(t), u = 1 - k;
        var x = u * u * u * x0 + 3 * u * u * k * x1 + 3 * u * k * k * x3 + k * k * k * x2;
        var y = u * u * u * y0 + 3 * u * u * k * y1 + 3 * u * k * k * y3 + k * k * k * y2;
        var esc = k < 0.45 ? 1 + 0.4 * (k / 0.45) : 1.4 + (escalaFin - 1.4) * ((k - 0.45) / 0.55);
        cuadros.push({ offset: t, opacity: t === 0 ? 0 : 1,
          transform: 'translate(' + (x - a.width / 2) + 'px,' + (y - a.height / 2) + 'px) scale(' + esc + ')' });
        if (i > 0 && t < 0.97) {
          var d = document.createElement('span');
          d.className = 'estela-punto';
          var mover = 'translate(' + (x - 3.5) + 'px,' + (y - 3.5) + 'px)';
          d.style.cssText = 'position:absolute;width:7px;height:7px;opacity:0;background:' +
            colorEn(paleta, (i % 18) / 17) + ';transform:' + mover;
          estela.appendChild(d);
          puntos.push({ el: d, mover: mover, demora: retraso + t * DUR_VUELO });
        }
      }
      document.body.appendChild(estela);
      document.body.appendChild(caja);

      puntos.forEach(function (p) {
        p.el.animate([{ transform: p.mover + ' scale(1)', opacity: 0.95 }, { transform: p.mover + ' scale(.15)', opacity: 0 }],
          { duration: VIDA_ESTELA, delay: p.demora, easing: 'ease-out', fill: 'forwards' }).onfinish = function () { p.el.remove(); };
      });
      caja.animate(cuadros, { duration: DUR_VUELO, delay: retraso, easing: 'linear', fill: 'both' }).onfinish = function () {
        caja.remove();
        var chip = destino.closest('a');
        if (chip) { chip.classList.remove('llega'); void chip.offsetWidth; chip.classList.add('llega'); }
      };
    }
    function lanzarVuelos(tarjeta) {
      tarjeta.querySelectorAll('[data-vuela]').forEach(function (el, i) {
        var chip = document.querySelector('.chips-canales a[data-canal="' + el.dataset.vuela + '"] svg');
        if (chip) volar(el, chip, i * 180, el.dataset.vuela);
      });
    }

    function fallo() {
      // Sin video: queda la imagen fija con la composición final.
      hero.classList.add('sin-video');
      control.hidden = true;
      if (saltar) saltar.hidden = true;
      cancelAnimationFrame(cuadro);
      iniciado = false;
      modoFinal = true;
      sinColeccion();
      sincronizar();
    }

    function estado(nombre, texto) {
      control.dataset.estado = nombre;
      controlTxt.textContent = texto;
      // "Saltar animación" solo se ofrece mientras la animación está en curso (o en pausa a medias).
      if (saltar) saltar.hidden = !(iniciado && !modoFinal && !video.ended);
    }

    /* Las tarjetas y todo lo que pasa dentro de ellas dependen solo del
       tiempo real del video (en segundos):
         data-desde / data-hasta  la tarjeta se ve en ese tramo (sin hasta: queda hasta el final)
         data-en / data-sale      un elemento interno aparece / desaparece
         data-efecto              un elemento interno recibe la clase .efecto
       Así, pausar, adelantar o reiniciar las mantiene sincronizadas. */
    function tiempo() {
      if (!iniciado) return modoFinal ? FINAL : -1;
      return video.ended ? FINAL : video.currentTime;
    }
    function sincronizar() {
      var t = tiempo();
      // El teléfono aparece después en el video original: mantenemos el último cuadro sin él.
      hero.classList.toggle('hero-notebook-final', t >= 11.2);
      // Solo hay vuelos cuando el video avanza normalmente (no al adelantar o retroceder).
      var avanza = iniciado && !video.paused && previo >= 0 && t > previo && t - previo < 1.5;
      tarjetas.forEach(function (c) {
        var hasta = c.dataset.hasta ? +c.dataset.hasta : Infinity;
        if (avanza && previo < hasta && t >= hasta) lanzarVuelos(c);
        var visible = t >= +c.dataset.desde && t < hasta;
        c.classList.toggle('visible', visible);
        if (!visible) return;
        c.querySelectorAll('[data-en]').forEach(function (el) {
          var sale = el.dataset.sale ? +el.dataset.sale : Infinity;
          el.classList.toggle('ok', t >= +el.dataset.en && t < sale);
        });
        c.querySelectorAll('[data-efecto]').forEach(function (el) {
          el.classList.toggle('efecto', t >= +el.dataset.efecto);
        });
        // Texto que se escribe al ritmo del video
        c.querySelectorAll('[data-escribe]').forEach(function (el) {
          var texto = el.dataset.texto;
          var inicio = +el.dataset.escribe;
          var n = Math.max(0, Math.min(texto.length, Math.floor((t - inicio) * 26)));
          if (el.textContent.length !== n) el.textContent = texto.slice(0, n);
          el.classList.toggle('escribiendo', t >= inicio && t < inicio + texto.length / 26 + 0.5);
        });
      });
      chips.forEach(function (a) { a.classList.toggle('ganado', t >= +a.dataset.gana); });
      previo = t;
    }
    function bucle() {
      sincronizar();
      if (!video.paused && !video.ended) cuadro = requestAnimationFrame(bucle);
    }

    video.addEventListener('play', function () {
      hero.classList.remove('video-terminado');
      modoFinal = false;
      iniciado = true;
      estado('reproduciendo', 'Pausar');
      cancelAnimationFrame(cuadro);
      bucle();
    });
    video.addEventListener('pause', function () {
      if (!video.ended && !modoFinal) estado('pausado', 'Reproducir');
      sincronizar();
    });
    video.addEventListener('ended', function () {
      // No hay bucle: el video se funde con la foto mejorada del último fotograma,
      // que queda fija de fondo.
      hero.classList.add('video-terminado');
      estado('terminado', 'Volver a reproducir');
      sincronizar();
    });
    video.addEventListener('seeked', sincronizar);
    video.addEventListener('timeupdate', sincronizar);

    control.addEventListener('click', function () {
      if (video.ended) video.currentTime = 0;
      if (video.paused) {
        var p = video.play();
        if (p && p.catch) p.catch(function () {});
      } else {
        video.pause();
      }
    });

    // Saltar: salta directo a la escena final (misma composición que al terminar el video).
    if (saltar) saltar.addEventListener('click', function () {
      video.pause();
      cancelAnimationFrame(cuadro);
      hero.classList.add('video-terminado');
      iniciado = false; modoFinal = true; sinColeccion();
      try { video.currentTime = 0; } catch (e) {}   // así "Volver a reproducir" parte desde el inicio
      estado('terminado', 'Volver a reproducir');
      sincronizar();
      control.focus();
    });

    control.hidden = false;
    estado('pausado', 'Reproducir animación');

    var ultimoTiempo = -1, quieto = 0, reintentos = 0;
    setInterval(function () {
      if (!iniciado || video.paused || video.ended || document.hidden) { quieto = 0; ultimoTiempo = video.currentTime; return; }
      if (video.currentTime === ultimoTiempo) {
        if (++quieto < 2) return;                    // más de ~1,2 s sin avanzar
        quieto = 0;
        if (++reintentos <= 3) {
          // Pequeño salto para forzar al decodificador a seguir
          try { video.currentTime = Math.min(video.duration - 0.05, video.currentTime + 0.05); } catch (e) {}
          var p = video.play(); if (p && p.catch) p.catch(function () {});
        } else {
          // Si no se recupera, se muestra la composición final para no dejar el hero trabado
          video.pause();
          hero.classList.add('video-terminado');
          iniciado = false; modoFinal = true; sinColeccion();
          estado('terminado', 'Volver a reproducir');
          sincronizar();
        }
      } else { quieto = 0; }
      ultimoTiempo = video.currentTime;
    }, 600);

    // Con "reducir movimiento" o ahorro de datos no se reproduce solo:
    // queda la imagen final con sus tarjetas y el botón permite verlo.
    if (sinMovimiento || ahorroDatos) {
      modoFinal = true;
      sincronizar();
      return;
    }

    // Con reproducción automática, los chips empiezan apagados y se van encendiendo.
    if (listaChips) listaChips.classList.add('coleccion');

    video.poster = 'assets/img/hero-inicio.webp';
    video.preload = 'auto';
    var intento = video.play();
    if (intento && intento.catch) {
      intento.catch(function () {
        // El navegador bloqueó la reproducción automática: queda la composición final y el botón.
        if (iniciado) return;
        video.poster = 'assets/img/hero-notebook-sin-telefono.webp';
        modoFinal = true;
        sinColeccion();
        estado('pausado', 'Reproducir animación');
        sincronizar();
      });
    }
  }

  /* ---------- Aparición suave de secciones ---------- */
  var bloques = document.querySelectorAll('.seccion-cab, .servicio, .proyecto, .paso, .factores, .faq, .contacto-panel');
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('a-la-vista');
          obs.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    bloques.forEach(function (b) {
      b.classList.add('aparece');
      obs.observe(b);
    });
  }
})();
