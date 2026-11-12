// Carga la escena 3D del hero. Si algo falla (sin WebGL, sin conexión, ahorro de datos),
// queda la foto fija del hero, que ya está visible desde el inicio.
const hero = document.querySelector('.hero[data-modo="3d"]');
// El lienzo va dentro de .escena: la misma caja 16:9 que la foto, así calza igual en todo tamaño
const media = hero && hero.querySelector('.escena');
const ahorroDatos = !!(navigator.connection && navigator.connection.saveData);

function hayWebGL() {
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch (e) { return false; }
}

if (media && !ahorroDatos && hayWebGL()) {
  const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  import('./escena3d.min.js')
    .then(({ iniciarEscena3D }) => iniciarEscena3D(media, { sinMovimiento }))
    .then(() => hero.classList.add('con-3d'))
    .catch((e) => console.warn('Escena 3D no disponible, se mantiene la foto:', e));
}
