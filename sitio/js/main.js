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
      ? [['assets/video/hero-negro-720.mp4', 'video/mp4']]
      : [['assets/video/hero-negro-1080.mp4', 'video/mp4'], ['assets/video/hero-negro-1080.webm', 'video/webm']];
    fuentes.forEach(function (f, i) {
      var s = document.createElement('source');
      s.src = f[0];
      s.type = f[1];
      if (i === fuentes.length - 1) s.addEventListener('error', fallo);
      video.appendChild(s);
    });
    video.addEventListener('error', fallo);

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
    var vuelos = [], animando = false;
    var VIDA_ESTELA = 450;   // ms que dura cada punto de la estela

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

    // Un punto de la estela: un círculo pequeño que se encoge y se desvanece solo (compositor).
    function punto(x, y, color, tam) {
      var d = document.createElement('span');
      d.className = 'estela-punto';
      d.style.cssText = 'width:' + tam + 'px;height:' + tam + 'px;background:' + color +
        ';transform:translate(' + (x - tam / 2) + 'px,' + (y - tam / 2) + 'px)';
      document.body.appendChild(d);
      var mover = 'translate(' + (x - tam / 2) + 'px,' + (y - tam / 2) + 'px)';
      d.animate([{ transform: mover + ' scale(1)', opacity: 0.95 }, { transform: mover + ' scale(.15)', opacity: 0 }],
        { duration: VIDA_ESTELA, easing: 'ease-out', fill: 'forwards' }).onfinish = function () { d.remove(); };
    }

    function volar(origen, destino, retraso, canal) {
      var a = origen.getBoundingClientRect();
      var b = destino.getBoundingClientRect();
      if (!a.width || !b.width || !document.body.animate) return;
      var caja = document.createElement('div');
      caja.className = 'vuelo';
      caja.setAttribute('aria-hidden', 'true');
      var copia = origen.cloneNode(true);
      copia.removeAttribute('data-vuela');
      caja.appendChild(copia);
      var est = getComputedStyle(origen);
      caja.style.cssText = 'left:0;top:0;width:' + a.width + 'px;height:' + a.height + 'px;color:' + est.color +
        ';border-radius:' + est.borderRadius + ';opacity:0' +
        (est.backgroundImage !== 'none' ? ';background:' + est.backgroundImage : '');
      document.body.appendChild(caja);
      var x0 = a.left + a.width / 2, y0 = a.top + a.height / 2;
      var x2 = b.left + b.width / 2, y2 = b.top + b.height / 2;
      // Curva con dos puntos de control: si el logo viene de arriba, baja por el espacio entre
      // el texto y el notebook; si viene de abajo, baja junto al teléfono y pasa bajo los equipos.
      var x1, y1, x3, y3;
      if (y0 < y2 - 300) { x1 = x0; y1 = y2; x3 = x0; y3 = y2; }
      else { var fondo = Math.max(y0, y2) + 150; x1 = x0; y1 = fondo; x3 = (x0 + x2) / 2; y3 = fondo; }
      vuelos.push({ caja: caja, w: a.width, h: a.height, escala: b.width / a.width, inicio: performance.now() + retraso, dur: 950,
        x0: x0, y0: y0, x1: x1, y1: y1, x3: x3, y3: y3, x2: x2, y2: y2, paleta: COLORES[canal] || COLORES.ia, n: 0, destino: destino });
      if (!animando) { animando = true; requestAnimationFrame(cuadroVuelo); }
    }

    function cuadroVuelo(ahora) {
      vuelos = vuelos.filter(function (v) {
        var p = (ahora - v.inicio) / v.dur;
        if (p < 0) return true;
        var r = v.destino.getBoundingClientRect();   // el chip puede moverse si la página se desplaza
        if (r.width) {
          var nx = r.left + r.width / 2, ny = r.top + r.height / 2;
          v.x3 += nx - v.x2; v.y3 += ny - v.y2; v.x2 = nx; v.y2 = ny;
        }
        var k = suavizar(Math.min(p, 1)), u = 1 - k;
        var x = u * u * u * v.x0 + 3 * u * u * k * v.x1 + 3 * u * k * k * v.x3 + k * k * k * v.x2;
        var y = u * u * u * v.y0 + 3 * u * u * k * v.y1 + 3 * u * k * k * v.y3 + k * k * k * v.y2;
        var esc = k < 0.45 ? 1 + 0.4 * (k / 0.45) : 1.4 + (v.escala - 1.4) * ((k - 0.45) / 0.55);
        v.caja.style.opacity = 1;
        v.caja.style.transform = 'translate(' + (x - v.w / 2) + 'px,' + (y - v.h / 2) + 'px) scale(' + esc + ')';
        if (p < 0.97) punto(x, y, colorEn(v.paleta, (v.n++ % 18) / 17), 7);
        if (p >= 1) {
          v.caja.remove();
          var chip = v.destino.closest('a');
          if (chip) { chip.classList.remove('llega'); void chip.offsetWidth; chip.classList.add('llega'); }
          return false;
        }
        return true;
      });
      if (vuelos.length) requestAnimationFrame(cuadroVuelo);
      else animando = false;
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
      cancelAnimationFrame(cuadro);
      iniciado = false;
      modoFinal = true;
      sinColeccion();
      sincronizar();
    }

    function estado(nombre, texto) {
      control.dataset.estado = nombre;
      controlTxt.textContent = texto;
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

    video.poster = 'assets/img/hero-negro-inicio.webp';
    video.preload = 'auto';
    var intento = video.play();
    if (intento && intento.catch) {
      intento.catch(function () {
        // El navegador bloqueó la reproducción automática: queda la composición final y el botón.
        if (iniciado) return;
        video.poster = 'assets/img/hero-negro-final.webp';
        modoFinal = true;
        sinColeccion();
        estado('pausado', 'Reproducir animación');
        sincronizar();
      });
    }
  }

  /* ---------- Recorrido del cliente (historia con scroll) ---------- */
  iniciarHistoria();

  function iniciarHistoria() {
    var pasos = Array.prototype.slice.call(document.querySelectorAll('.hpaso'));
    var escena = document.querySelector('.historia-escena');
    var contenedor = document.querySelector('.escena-demos');
    var barras = document.querySelectorAll('.escena-progreso i');
    if (!pasos.length || !escena || !contenedor) return;

    var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
    var escritorio = window.matchMedia('(min-width: 900px)');

    // Cada paso tiene su demostración dentro (móvil y sin JS).
    // En escritorio se usa una copia en el escenario fijo.
    var enLinea = pasos.map(function (p) { return p.querySelector('.demo'); });
    var enEscena = enLinea.map(function (d) {
      var copia = d.cloneNode(true);
      contenedor.appendChild(copia);
      return copia;
    });
    enLinea.concat(enEscena).forEach(reiniciar);

    // Índice fijo (escritorio): títulos de los pasos como enlaces, con el activo resaltado.
    var cuerpo = document.querySelector('.historia-cuerpo');
    var indice = document.createElement('nav');
    indice.className = 'historia-indice';
    indice.setAttribute('aria-label', 'Pasos del recorrido');
    var lista = document.createElement('ol');
    var enlaces = pasos.map(function (p) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + p.id;
      a.innerHTML = '<span class="hi-num" aria-hidden="true"></span><span class="hi-tit"></span>' +
        '<span class="hi-desc" aria-hidden="true"><span><span class="hi-p"></span></span></span>';
      a.querySelector('.hi-num').textContent = p.querySelector('.hpaso-num').textContent;
      a.querySelector('.hi-tit').textContent = p.querySelector('h3').textContent;
      a.querySelector('.hi-p').textContent = p.querySelector('h3 + p').textContent;
      li.appendChild(a);
      lista.appendChild(li);
      return a;
    });
    indice.appendChild(lista);
    cuerpo.insertBefore(indice, cuerpo.firstChild);

    var actual = -1;

    function activar(i) {
      if (i === actual) return;
      if (actual > -1) {
        pasos[actual].classList.remove('activo');
        enlaces[actual].classList.remove('activo');
        enlaces[actual].removeAttribute('aria-current');
        reiniciar(enLinea[actual]);
        reiniciar(enEscena[actual]);
      }
      actual = i;
      pasos[i].classList.add('activo');
      enlaces[i].classList.add('activo');
      enlaces[i].setAttribute('aria-current', 'step');
      for (var b = 0; b < barras.length; b++) barras[b].classList.toggle('on', b <= i);
      reproducir(escritorio.matches ? enEscena[i] : enLinea[i]);
    }

    // Línea de activación: el centro de la pantalla.
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) activar(pasos.indexOf(e.target));
      });
    }, { rootMargin: '-48% 0px -48% 0px' });
    pasos.forEach(function (p) { obs.observe(p); });

    // Al cambiar de escritorio a móvil (o al revés) se repite la escena activa.
    var alCambiar = function () {
      if (actual < 0) return;
      reiniciar(enLinea[actual]);
      reiniciar(enEscena[actual]);
      reproducir(escritorio.matches ? enEscena[actual] : enLinea[actual]);
    };
    if (escritorio.addEventListener) escritorio.addEventListener('change', alCambiar);

    /* Secuencia interna de cada demostración:
       data-t="ms"        aparece en ese momento
       data-fin="ms"      se oculta en ese momento
       data-escribir="…"  se escribe letra por letra
       data-efecto="ms"   recibe la clase .efecto (ticks azules, pulso) */
    function reiniciar(demo) {
      (demo._relojes || []).forEach(clearTimeout);
      demo._relojes = [];
      demo.classList.remove('activo');
      demo.querySelectorAll('.ver, .fuera, .efecto, .tecleando').forEach(function (el) {
        el.classList.remove('ver', 'fuera', 'efecto', 'tecleando');
      });
      demo.querySelectorAll('[data-escribir]').forEach(function (el) { el.textContent = ''; });
    }

    function reproducir(demo) {
      reiniciar(demo);
      demo.classList.add('activo');
      if (sinMovimiento.matches) { estadoFinal(demo); return; }

      var programar = function (ms, fn) { demo._relojes.push(setTimeout(fn, ms)); };
      demo.querySelectorAll('[data-t]').forEach(function (el) {
        programar(+el.dataset.t, function () {
          el.classList.add('ver');
          if (el.dataset.escribir) escribir(el, programar);
        });
        if (el.dataset.fin) programar(+el.dataset.fin, function () { el.classList.add('fuera'); });
      });
      demo.querySelectorAll('[data-efecto]').forEach(function (el) {
        programar(+el.dataset.efecto, function () { el.classList.add('efecto'); });
      });
    }

    function escribir(el, programar) {
      var texto = el.dataset.escribir;
      var n = 0;
      el.classList.add('tecleando');
      (function letra() {
        el.textContent = texto.slice(0, ++n);
        if (n < texto.length) programar(38 + Math.random() * 40, letra);
        else programar(500, function () { el.classList.remove('tecleando'); });
      })();
    }

    function estadoFinal(demo) {
      demo.querySelectorAll('[data-t]').forEach(function (el) {
        el.classList.add(el.dataset.fin ? 'fuera' : 'ver');
        if (el.dataset.escribir) el.textContent = el.dataset.escribir;
      });
      demo.querySelectorAll('[data-efecto]').forEach(function (el) { el.classList.add('efecto'); });
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
