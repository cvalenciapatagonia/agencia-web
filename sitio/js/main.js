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
