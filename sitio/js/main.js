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

  /* ---------- Recorrido del cliente: de la vitrina al primer mensaje ---------- */
  iniciarHistoria();

  function iniciarHistoria() {
    var cuerpo = document.querySelector('.historia-cuerpo');
    var escena = document.getElementById('escenario');
    var pasos = Array.prototype.slice.call(document.querySelectorAll('.hpaso'));
    if (!cuerpo || !escena || !pasos.length) return;

    var reducir = window.matchMedia('(prefers-reduced-motion: reduce)');
    var escritorio = window.matchMedia('(min-width: 900px)');
    var q = function (s) { return escena.querySelector(s); };

    var elN = q('.esc-n'), elCuerpo = q('.esc-cuerpo'), elTitulo = q('.esc-titulo'), elFrase = q('.esc-frase');
    var contIndice = q('.esc-indice');
    // Un solo origen para el relato: los textos de cada paso del HTML.
    var textos = pasos.map(function (p) {
      return { t: p.querySelector('h3').textContent, f: p.querySelector('h3 + p').textContent };
    });

    // Interfaces simuladas
    var P = { web: q('.u-web'), google: q('.pant-google'), ficha: q('.pant-ficha'), mapa: q('.pant-mapa'), chat: q('.pant-chat'), ia: q('.pant-ia') };
    var todas = Object.keys(P).map(function (k) { return P[k]; });
    // Cuadro final de cada escena cuando se muestra en línea (móvil o movimiento reducido)
    var finales = [null, null, P.web, P.google, P.mapa, P.ia, P.chat];
    var padres = finales.map(function (el) { return el ? el.parentNode : null; });

    var botones = pasos.map(function (p, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = String(i + 1);
      b.setAttribute('aria-label', 'Ir a la escena ' + (i + 1) + ': ' + textos[i].t);
      b.addEventListener('click', function () {
        p.scrollIntoView({ behavior: reducir.matches ? 'auto' : 'smooth', block: 'center' });
      });
      contIndice.appendChild(b);
      return b;
    });

    var relojes = [], tTexto = null, actual = -1, estatico = null;
    function t(ms, fn) { relojes.push(setTimeout(fn, ms)); }
    function d(k, v) { escena.dataset[k] = v; }
    function toque(el) {
      if (!el) return;
      el.classList.remove('toque'); void el.offsetWidth; el.classList.add('toque');
    }

    /* Secuencia interna de cada interfaz:
       data-t="ms"        aparece en ese momento (desde que se reproduce la interfaz)
       data-fin="ms"      desaparece en ese momento
       data-escribir="…"  se escribe letra por letra (data-vel = ms por letra) */
    function reiniciar(el) {
      el.querySelectorAll('.ver, .fuera, .tecleando, .toque').forEach(function (x) {
        x.classList.remove('ver', 'fuera', 'tecleando', 'toque');
      });
      el.querySelectorAll('[data-escribir]').forEach(function (x) { x.textContent = ''; });
      el.classList.remove('toque');
    }
    function reproducir(el) {
      reiniciar(el);
      el.querySelectorAll('[data-t]').forEach(function (x) {
        t(+x.dataset.t, function () {
          x.classList.add('ver');
          if (x.dataset.escribir) escribir(x);
        });
        if (x.dataset.fin) t(+x.dataset.fin, function () { x.classList.add('fuera'); });
      });
    }
    function escribir(x) {
      var texto = x.dataset.escribir, v = +x.dataset.vel || 55, n = 0;
      x.classList.add('tecleando');
      (function letra() {
        x.textContent = texto.slice(0, ++n);
        if (n < texto.length) t(v * (0.6 + Math.random() * 0.8), letra);
        else t(400, function () { x.classList.remove('tecleando'); });
      })();
    }
    // Estado final legible de una interfaz (sin animar)
    function final(el) {
      el.querySelectorAll('[data-t]').forEach(function (x) {
        x.classList.add(x.dataset.fin ? 'fuera' : 'ver');
        if (x.dataset.escribir) x.textContent = x.dataset.escribir;
      });
    }
    function limpiar() {
      relojes.forEach(clearTimeout);
      relojes = [];
      todas.forEach(reiniciar);
      document.querySelectorAll('.vuelo-pieza').forEach(function (x) { x.remove(); });
    }
    function reposo() { d('ia', 'off'); d('pieza', 'off'); d('mostrador', 'off'); d('ui', ''); }

    // El repuesto de la estantería viaja y se convierte en la foto de la ficha.
    function volarPieza() {
      var a = q('#pieza-estante'), b = P.web.querySelector('.foto-grande svg');
      if (!a || !b || !document.body.animate) return;
      // Con la maqueta 3D, el origen es la proyección en pantalla del repuesto 3D.
      var ra = window.Diorama3D ? window.Diorama3D.rectPieza() : a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      if (!ra.width || !rb.width) return;
      var v = document.createElement('div');
      v.className = 'vuelo-pieza';
      v.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true"><use href="#pieza-cartucho"/></svg>';
      v.style.cssText = 'width:' + ra.width + 'px;height:' + ra.height + 'px';
      document.body.appendChild(v);
      v.animate([
        { transform: 'translate(' + ra.left + 'px,' + ra.top + 'px) scale(1)' },
        { transform: 'translate(' + rb.left + 'px,' + rb.top + 'px) scale(' + (rb.width / ra.width) + ')' }
      ], { duration: 800, easing: 'cubic-bezier(.65,0,.25,1)', fill: 'forwards' }).onfinish = function () { v.remove(); };
    }

    /* Las siete escenas. Cada una fija su estado inicial (para poder entrar desde la anterior
       o desde la siguiente al hacer scroll) y programa sus acciones en milisegundos. */
    var ESC = [
      // 1 · ¿Es tu negocio? Cámara fija; el mobiliario cambia dos veces.
      function () {
        reposo(); d('cam', 'tienda'); d('rubro', '0'); d('vec', 'repuesto');
        t(1600, function () { d('rubro', '1'); });
        t(4300, function () { d('rubro', '2'); });
      },
      // 2 · Una necesidad a pocas cuadras: el encuadre se abre y vemos a la vecina.
      function () {
        reposo(); d('cam', 'abre'); d('rubro', '2'); d('vec', 'repuesto');
        t(2400, function () { d('vec', 'telefono'); });
      },
      // 3 · Primero, tu página web: el marco de la vitrina se vuelve la ventana del navegador.
      function () {
        reposo(); d('cam', 'vitrina'); d('rubro', '2'); d('vec', 'telefono');
        t(1300, function () { d('ui', 'web'); reproducir(P.web); });
        t(2000, volarPieza);
      },
      // 4 · Cómo te encuentran en Google: búsqueda simulada y toque al resultado.
      function () {
        reposo(); d('cam', 'vecina'); d('rubro', '2'); d('vec', 'telefono'); d('pant', 'google'); d('ui', 'tel');
        t(800, function () { reproducir(P.google); });
        t(4400, function () { toque(P.google.querySelector('.t-res-ok')); });
        t(5000, function () { d('pant', 'ficha'); reproducir(P.ficha); });
      },
      // 5 · ¿Me queda cerca? Desde la ficha, "Ver ubicación" abre el mapa y el perfil de empresa.
      function () {
        reposo(); d('cam', 'vecina'); d('rubro', '2'); d('vec', 'telefono'); d('pant', 'ficha'); d('ui', 'tel');
        final(P.ficha);
        t(900, function () { toque(P.ficha.querySelector('.t-enlace')); });
        t(1500, function () { d('pant', 'mapa'); reproducir(P.mapa); });
        t(7000, function () { d('pieza', 'on'); });
      },
      // 6 · Otra forma de encontrarte: el asistente de IA entra por el borde del teléfono y se retira.
      function () {
        reposo(); d('cam', 'vecina'); d('rubro', '2'); d('vec', 'telefono'); d('pant', 'ficha'); d('ui', 'tel');
        final(P.ficha);
        t(800, function () { d('ia', 'on'); reproducir(P.ia); });
        t(7000, function () { d('ia', 'off'); });
      },
      // 7 · Del teléfono al mostrador: WhatsApp, la cámara cruza la calle y el mensaje llega al local.
      function () {
        reposo(); d('cam', 'vecina'); d('rubro', '2'); d('vec', 'telefono'); d('pant', 'ficha'); d('ui', 'tel');
        final(P.ficha);
        t(800, function () { toque(P.ficha.querySelector('.t-btn-wa')); });
        t(1400, function () {
          d('pant', 'chat'); reproducir(P.chat);
          t(2750, function () { toque(P.chat.querySelector('.wa-enviar')); });
        });
        t(6000, function () { d('ui', ''); d('cam', 'cruce'); });
        t(7500, function () { d('cam', 'mostrador'); });
        t(9100, function () { d('mostrador', 'on'); });
      }
    ];

    function ponerTexto(i) {
      elN.textContent = '0' + (i + 1);
      elTitulo.textContent = textos[i].t;
      elFrase.textContent = textos[i].f;
    }
    function cambiarTexto(i) {
      clearTimeout(tTexto);
      elCuerpo.classList.add('sale');
      tTexto = setTimeout(function () { ponerTexto(i); elCuerpo.classList.remove('sale'); }, 200);
    }
    function activar(i) {
      if (estatico || i === actual) return;
      actual = i;
      limpiar();
      botones.forEach(function (b, k) { b.classList.toggle('on', k === i); b.classList.toggle('hecho', k < i); });
      cambiarTexto(i);
      ESC[i]();
    }

    // Se activa la escena cuyo texto cruza el centro de la pantalla. Al volver hacia arriba,
    // cada escena recupera su estado porque todo parte del estado inicial de la escena.
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) activar(pasos.indexOf(e.target));
      });
    }, { rootMargin: '-48% 0px -48% 0px' });
    pasos.forEach(function (p) { obs.observe(p); });

    /* Móvil o movimiento reducido: sin escenario fijo. Cada paso muestra su texto y,
       debajo, el cuadro final de su interfaz, en orden. */
    function modo() {
      var si = reducir.matches || !escritorio.matches;
      if (si === estatico) return;
      var antes = actual;
      estatico = si;
      cuerpo.classList.toggle('estatico', si);
      limpiar();
      finales.forEach(function (el, i) {
        if (!el) return;
        if (si) { el.classList.add('suelta'); pasos[i].querySelector('.hpaso-demo').appendChild(el); final(el); }
        else { el.classList.remove('suelta'); padres[i].appendChild(el); }
      });
      actual = -1;
      if (!si && antes >= 0) activar(antes);
    }
    [reducir, escritorio].forEach(function (m) {
      if (m.addEventListener) m.addEventListener('change', modo);
    });
    ponerTexto(0);
    modo();

    /* Maqueta 3D: solo en escritorio y sin "reducir movimiento". Se carga cuando el recorrido
       se acerca a la pantalla; si no hay WebGL o falla, queda la ilustración SVG. */
    if (escritorio.matches && !reducir.matches && 'IntersectionObserver' in window) {
      var cerca = new IntersectionObserver(function (es) {
        if (!es.some(function (e) { return e.isIntersecting; })) return;
        cerca.disconnect();
        import(new URL('js/diorama3d.min.js', document.baseURI).href)
          .then(function (m) { m.iniciar(escena); })
          .catch(function (err) { if (window.console) console.warn('Maqueta 3D no disponible:', err); });
      }, { rootMargin: '1200px 0px' });
      cerca.observe(escena);
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
