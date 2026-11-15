/* Maqueta 3D del recorrido: "De la vitrina al primer mensaje".
   Estilo maqueta de arquitectura en miniatura: cartón pluma blanco, madera, figuras a escala,
   luz suave de estudio y desenfoque tilt-shift.
   No decide nada del relato: escucha los atributos data-* de #escenario (los pone main.js)
   y anima la cámara, el mobiliario, a la vecina y el teléfono del mostrador.
   Compilar: npm run build:3d  ->  sitio/js/diorama3d.min.js */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { HorizontalTiltShiftShader } from 'three/examples/jsm/shaders/HorizontalTiltShiftShader.js';
import { VerticalTiltShiftShader } from 'three/examples/jsm/shaders/VerticalTiltShiftShader.js';

const ACERO = '#3e5870';
const PI = Math.PI;

/* ---------- Utilidades ---------- */
function azar(semilla) {   // mulberry32: la maqueta es siempre igual
  return function () {
    semilla |= 0; semilla = semilla + 0x6D2B79F5 | 0;
    let t = Math.imul(semilla ^ semilla >>> 15, 1 | semilla);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const rnd = azar(7);
const elegir = (lista) => lista[Math.floor(rnd() * lista.length)];
const eio = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eout = (t) => 1 - Math.pow(1 - t, 3);
const eback = (t) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

const cacheMat = new Map();
function mat(color, rough = 0.85, metal = 0, extra = {}) {
  const k = color + rough + metal + JSON.stringify(Object.keys(extra));
  if (!Object.keys(extra).length && cacheMat.has(k)) return cacheMat.get(k);
  const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });
  if (!Object.keys(extra).length) cacheMat.set(k, m);
  return m;
}
function sombra(o, emite = true, recibe = true) { o.castShadow = emite; o.receiveShadow = recibe; return o; }

// Caja con origen en la base (y = 0 es el piso del objeto): sirve para "crecer" desde el suelo.
function caja(w, h, d, material, x = 0, y = 0, z = 0, r = 0.03) {
  const rad = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
  const g = rad > 0.004 ? new RoundedBoxGeometry(w, h, d, 2, rad) : new THREE.BoxGeometry(w, h, d);
  g.translate(0, h / 2, 0);
  const m = new THREE.Mesh(g, material);
  m.position.set(x, y, z);
  return sombra(m);
}
function cilindro(rt, rb, h, material, x = 0, y = 0, z = 0, seg = 20) {
  const g = new THREE.CylinderGeometry(rt, rb, h, seg);
  g.translate(0, h / 2, 0);
  const m = new THREE.Mesh(g, material);
  m.position.set(x, y, z);
  return sombra(m);
}

/* ---------- Texturas pintadas en canvas ---------- */
function lienzo(w, h, pintar) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  pintar(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function texMadera() {
  const t = lienzo(512, 512, (x, w, h) => {
    const r = azar(3);
    const filas = 8, alto = h / filas;
    for (let i = 0; i < filas; i++) {
      let desde = -r() * 200;
      while (desde < w) {
        const largo = 160 + r() * 200;
        const tono = 196 + r() * 26;
        x.fillStyle = `rgb(${tono},${tono * 0.8 | 0},${tono * 0.6 | 0})`;
        x.fillRect(desde, i * alto, largo, alto);
        x.globalAlpha = 0.08;
        for (let k = 0; k < 6; k++) {
          x.fillStyle = r() > 0.5 ? '#6b4a2a' : '#fff';
          x.fillRect(desde, i * alto + r() * alto, largo, 1 + r() * 2);
        }
        x.globalAlpha = 1;
        x.fillStyle = 'rgba(80,52,28,.35)';
        x.fillRect(desde, i * alto, 2, alto);
        desde += largo;
      }
      x.fillStyle = 'rgba(80,52,28,.3)';
      x.fillRect(0, i * alto, w, 2);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function texPerforado() {
  return lienzo(256, 256, (x, w, h) => {
    x.fillStyle = '#d4b892'; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(90,62,34,.45)';
    for (let i = 8; i < w; i += 16) for (let j = 8; j < h; j += 16) { x.beginPath(); x.arc(i, j, 2.4, 0, 7); x.fill(); }
  });
}
function texBaldosa(base, linea, n) {
  const t = lienzo(256, 256, (x, w, h) => {
    x.fillStyle = base; x.fillRect(0, 0, w, h);
    x.strokeStyle = linea; x.lineWidth = 2;
    for (let i = 0; i <= n; i++) { const p = i * w / n; x.beginPath(); x.moveTo(p, 0); x.lineTo(p, h); x.stroke(); x.beginPath(); x.moveTo(0, p); x.lineTo(w, p); x.stroke(); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function texCartel(texto) {
  return lienzo(1024, 128, (x, w, h) => {
    x.fillStyle = ACERO; x.fillRect(0, 0, w, h);
    x.fillStyle = '#faf5ef';
    x.font = '700 64px "Inter Tight", "Segoe UI", sans-serif';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    if ('letterSpacing' in x) x.letterSpacing = '10px';
    x.fillText(texto, w / 2, h / 2 + 3);
  });
}
function texLetrero(texto, fondo, color) {
  return lienzo(256, 96, (x, w, h) => {
    x.fillStyle = fondo; x.fillRect(0, 0, w, h);
    x.fillStyle = color;
    x.font = '700 44px "Inter Tight", "Segoe UI", sans-serif';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(texto, w / 2, h / 2 + 2);
  });
}

/* ---------- Figuras en miniatura ---------- */
function persona({ ropa, pantalon = '#3b4656', pelo = '#3a2a22', piel = '#d6a47a', delantal = null, moño = false }) {
  const g = new THREE.Group();
  const mP = mat(piel, 0.7), mR = mat(ropa, 0.9), mPa = mat(pantalon, 0.9), mPe = mat(pelo, 0.95);
  const pierna = new THREE.CapsuleGeometry(0.13, 0.72, 4, 12);
  for (const s of [-1, 1]) {
    const m = new THREE.Mesh(pierna, mPa); m.position.set(s * 0.15, 0.5, 0); g.add(sombra(m));
    const zap = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), mat('#2b2622', 0.8)); zap.scale.set(1, 0.55, 1.5); zap.position.set(s * 0.15, 0.07, 0.06); g.add(sombra(zap));
  }
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.33, 0.64, 6, 16), mR);
  torso.position.y = 1.44; torso.scale.set(1, 1, 0.74); g.add(sombra(torso));
  if (delantal) {
    const d = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.5, 4, 12, 1), mat(delantal, 0.85));
    d.position.set(0, 1.32, 0.06); d.scale.set(1.04, 1, 0.66); g.add(sombra(d));
  }
  const cuello = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.16, 12), mP); cuello.position.y = 1.98; g.add(cuello);
  const cabeza = new THREE.Mesh(new THREE.SphereGeometry(0.25, 28, 20), mP); cabeza.position.y = 2.2; g.add(sombra(cabeza));
  const pelo1 = new THREE.Mesh(new THREE.SphereGeometry(0.262, 28, 16, 0, PI * 2, 0, PI * 0.56), mPe);
  pelo1.position.y = 2.22; pelo1.rotation.x = -0.25; g.add(sombra(pelo1));
  if (moño) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), mPe); m.position.set(0, 2.42, -0.16); g.add(sombra(m)); }
  const brazos = [];
  for (const s of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(s * 0.43, 1.8, 0);
    const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.6, 4, 10), mR); b.position.y = -0.36; piv.add(sombra(b));
    const mano = new THREE.Group(); mano.position.y = -0.76; piv.add(mano);
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), mP); mano.add(sombra(m));
    piv.rotation.z = s * 0.08;
    g.add(piv);
    brazos.push({ piv, mano });
  }
  return { g, brazoNeg: brazos[0], brazoPos: brazos[1] };
}

// El repuesto: cartucho de llave monomando (el mismo que aparece como "foto" en las interfaces)
function cartucho(gastado = false) {
  const g = new THREE.Group();
  const laton = gastado ? mat('#8b8476', 0.8, 0.25) : mat('#c9a24b', 0.32, 0.85);
  const acero = gastado ? mat('#7d8791', 0.7, 0.3) : mat('#aab5bf', 0.3, 0.9);
  g.add(cilindro(0.075, 0.075, 0.06, mat('#222', 0.6), 0, 0, 0, 18));
  g.add(cilindro(0.12, 0.12, 0.26, laton, 0, 0.06, 0, 24));
  g.add(cilindro(0.15, 0.15, 0.07, laton, 0, 0.32, 0, 24));
  g.add(cilindro(0.045, 0.045, 0.2, acero, 0, 0.39, 0, 12));
  if (gastado) {
    for (let i = 0; i < 5; i++) {
      const o = new THREE.Mesh(new THREE.SphereGeometry(0.03 + rnd() * 0.03, 8, 6), mat('#9a5b32', 0.95));
      const a = rnd() * PI * 2; o.position.set(Math.cos(a) * 0.12, 0.1 + rnd() * 0.2, Math.sin(a) * 0.12); g.add(o);
    }
  }
  return g;
}

/* ---------- Productos (instancias) ---------- */
// Cada rubro llena las mismas estanterías con otros productos. Las instancias crecen desde su repisa.
class Productos {
  constructor(grupo) {
    this.items = { caja: [], cil: [] };
    this.grupo = grupo; this.f = 1;
  }
  add(tipo, x, y, z, sx, sy, sz, color) { this.items[tipo].push({ x, y, z, sx, sy, sz, color: new THREE.Color(color) }); }
  construir() {
    const geo = { caja: new RoundedBoxGeometry(1, 1, 1, 1, 0.06).translate(0, 0.5, 0), cil: new THREE.CylinderGeometry(0.5, 0.5, 1, 14).translate(0, 0.5, 0) };
    this.mallas = {};
    for (const tipo of ['caja', 'cil']) {
      const lista = this.items[tipo];
      if (!lista.length) continue;
      const m = new THREE.InstancedMesh(geo[tipo], new THREE.MeshStandardMaterial({ roughness: 0.75 }), lista.length);
      lista.forEach((it, i) => m.setColorAt(i, it.color));
      sombra(m);
      this.mallas[tipo] = m; this.grupo.add(m);
    }
    this.aplicar(1);
  }
  aplicar(f) {
    this.f = f;
    const o = new THREE.Object3D();
    for (const tipo in this.mallas) {
      const m = this.mallas[tipo];
      this.items[tipo].forEach((it, i) => {
        const k = Math.max(0.0001, f);
        o.position.set(it.x, it.y, it.z); o.scale.set(it.sx * Math.min(1, k * 1.4), it.sy * k, it.sz * Math.min(1, k * 1.4)); o.updateMatrix();
        m.setMatrixAt(i, o.matrix);
      });
      m.instanceMatrix.needsUpdate = true;
      m.visible = f > 0.002;
    }
  }
}

/* =====================================================================
   Escena
   ===================================================================== */
export function iniciar(escena) {
  const mundo = escena.querySelector('.esc-mundo');
  const capaUI = escena.querySelector('.esc-ui');
  if (!mundo) return null;

  const canvas = document.createElement('canvas');
  canvas.className = 'lienzo3d';
  canvas.setAttribute('aria-hidden', 'true');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { return null; }
  mundo.insertBefore(canvas, mundo.firstChild);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 0.9;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.42;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.5, 400);

  /* ---------- Luz de estudio ---------- */
  scene.add(new THREE.HemisphereLight('#fffdf8', '#d9c9b4', 0.55));
  const sol = new THREE.DirectionalLight('#fff3e2', 2.4);
  sol.position.set(-14, 30, 18);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, { left: -24, right: 24, top: 18, bottom: -18, near: 1, far: 80 });
  sol.shadow.radius = 3; sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.03;
  scene.add(sol);
  const relleno = new THREE.DirectionalLight('#f1f5ff', 0.55); relleno.position.set(20, 12, 10); scene.add(relleno);
  const luzTienda = new THREE.PointLight('#ffd9a6', 9, 16, 1.6); luzTienda.position.set(-8.5, 5.4, -1.5); scene.add(luzTienda);
  const luzCocina = new THREE.PointLight('#ffe2b8', 6, 12, 1.6); luzCocina.position.set(10.4, 8.6, -3.2); scene.add(luzCocina);

  const raiz = new THREE.Group(); scene.add(raiz);

  /* ---------- Materiales ---------- */
  const espuma = mat('#f4f1eb', 0.93);
  const espumaSombra = mat('#e3dbd0', 0.95);
  const acero = mat(ACERO, 0.45, 0.35);
  const madera = mat('#c49a6c', 0.7);
  const maderaClara = mat('#d8b688', 0.65);
  const vidrio = new THREE.MeshPhysicalMaterial({ color: '#dbe8ef', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.16, envMapIntensity: 1.2, depthWrite: false });
  const texM = texMadera(); texM.repeat.set(2.2, 2.2); texM.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const pisoMadera = new THREE.MeshStandardMaterial({ map: texM, roughness: 0.62 });

  /* ---------- Base de la maqueta y sombra sobre el fondo ---------- */
  const captura = new THREE.Mesh(new THREE.PlaneGeometry(140, 100), new THREE.ShadowMaterial({ opacity: 0.24 }));
  captura.rotation.x = -PI / 2; captura.position.y = -0.82; captura.receiveShadow = true; raiz.add(captura);
  raiz.add(caja(33.5, 0.8, 18, mat('#e2d8ca', 0.9), -0.4, -0.8, -0.3, 0.25));

  // Veredas, calle y paso de cebra
  const vereda = new THREE.MeshStandardMaterial({ map: (() => { const t = texBaldosa('#e6ddd0', '#cbbfae', 4); t.repeat.set(1, 9); return t; })(), roughness: 0.9 });
  raiz.add(caja(1.55, 0.16, 18, vereda, -1.27, 0, -0.3, 0.02));
  raiz.add(caja(1.8, 0.16, 18, vereda, 5.1, 0, -0.3, 0.02));
  raiz.add(caja(4.7, 0.05, 18, mat('#b7b0a5', 0.95), 1.85, 0, -0.3, 0));
  for (let z = -8.4; z < 8.4; z += 1.5) raiz.add(caja(0.12, 0.012, 0.7, mat('#faf6ee', 0.8), 1.85, 0.05, z, 0));
  for (let x = -0.15; x < 4.2; x += 0.62) raiz.add(caja(0.34, 0.012, 1.4, mat('#faf6ee', 0.8), x + 0.17, 0.05, 7.3, 0));

  /* ---------- FERRETERÍA (local que cambia de rubro) ---------- */
  const local = new THREE.Group(); raiz.add(local);
  local.add(caja(13.15, 0.25, 12, pisoMadera, -8.57, 0, -1, 0.02));
  local.add(caja(13.15, 6, 0.3, espuma, -8.57, 0, -7.15, 0.03));        // muro del fondo
  local.add(caja(0.3, 6, 12.3, espuma, -15.15, 0, -1.15, 0.03));        // muro izquierdo
  local.add(caja(13.15, 0.25, 0.3, espumaSombra, -8.57, 0, 4.85, 0.02)); // canto del corte
  // Fachada hacia la calle (x = -2): vitrina z[-4.5, 1.5] y[0.8, 4.6] y puerta z[2.5, 4.2]
  const fx = -2;
  const muroF = (z0, z1, y0, y1) => local.add(caja(0.3, y1 - y0, z1 - z0, espuma, fx, y0, (z0 + z1) / 2, 0.02));
  muroF(-7.3, -4.5, 0, 6); muroF(1.5, 2.5, 0, 6); muroF(4.2, 5, 0, 6);
  muroF(-4.5, 1.5, 0, 0.8); muroF(-4.5, 1.5, 4.6, 6); muroF(2.5, 4.2, 4.6, 6);
  // Marco azul acero de la vitrina (el marco que después será la ventana de la web)
  const marco = new THREE.Group(); local.add(marco);
  marco.add(caja(0.2, 0.16, 6.2, acero, fx + 0.12, 4.52, -1.5, 0.03));
  marco.add(caja(0.2, 0.16, 6.2, acero, fx + 0.12, 0.72, -1.5, 0.03));
  marco.add(caja(0.2, 3.96, 0.16, acero, fx + 0.12, 0.72, -4.52, 0.03));
  marco.add(caja(0.2, 3.96, 0.16, acero, fx + 0.12, 0.72, 1.52, 0.03));
  marco.add(caja(0.16, 3.8, 0.1, acero, fx + 0.12, 0.8, -1.5, 0.02));
  const cristal = new THREE.Mesh(new THREE.PlaneGeometry(6, 3.8), vidrio); cristal.rotation.y = PI / 2; cristal.position.set(fx + 0.02, 2.7, -1.5); local.add(cristal);
  // Puerta
  local.add(caja(0.2, 4.6, 0.14, acero, fx + 0.12, 0, 2.52, 0.03));
  local.add(caja(0.2, 4.6, 0.14, acero, fx + 0.12, 0, 4.18, 0.03));
  local.add(caja(0.2, 0.14, 1.8, acero, fx + 0.12, 4.46, 3.35, 0.03));
  const cristalP = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 4.4), vidrio); cristalP.rotation.y = PI / 2; cristalP.position.set(fx + 0.02, 2.25, 3.35); local.add(cristalP);
  local.add(caja(0.08, 0.9, 0.08, mat('#c9cfd4', 0.3, 0.9), fx + 0.24, 1.9, 2.75, 0.02));
  const abierto = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.34), new THREE.MeshBasicMaterial({ map: texLetrero('ABIERTO', '#faf5ef', ACERO), toneMapped: false }));
  abierto.rotation.y = PI / 2; abierto.position.set(fx + 0.06, 3.3, 3.35); local.add(abierto);
  // Cartel exterior (cambia con el rubro)
  local.add(caja(0.16, 0.95, 9.3, acero, fx + 0.24, 4.82, -0.15, 0.04));
  const carteles = ['TIENDA DE ROPA', 'PELUQUERÍA', 'FERRETERÍA DEL BARRIO'].map(texCartel);
  const matCartel = new THREE.MeshBasicMaterial({ map: carteles[2], toneMapped: false });
  const cartel = new THREE.Mesh(new THREE.PlaneGeometry(9.1, 0.84), matCartel); cartel.rotation.y = PI / 2; cartel.position.set(fx + 0.33, 5.295, -0.15); local.add(cartel);
  // Maceteros en la vereda
  for (const z of [-5.6, 1.95]) {
    local.add(caja(0.6, 0.6, 0.6, mat('#e2d6c6', 0.9), -1.25, 0.16, z, 0.08));
    const p = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), mat('#8fa384', 0.9, 0, { flatShading: true })); p.position.set(-1.25, 1.05, z); local.add(sombra(p));
  }

  // Estanterías del fondo (se quedan; lo que cambia es lo que hay en ellas)
  const repisas = [];   // {x0, x1, y, z, prof}
  function estanteria(cx, ancho) {
    const z = -6.55, prof = 0.85, alto = 4.6;
    local.add(caja(0.1, alto, prof, maderaClara, cx - ancho / 2, 0.25, z, 0.02));
    local.add(caja(0.1, alto, prof, maderaClara, cx + ancho / 2, 0.25, z, 0.02));
    local.add(caja(ancho, alto, 0.06, mat('#efe6d8', 0.9), cx, 0.25, z - prof / 2 + 0.03, 0));
    for (let i = 0; i < 5; i++) {
      const y = 0.45 + i * 0.95;
      local.add(caja(ancho, 0.07, prof, maderaClara, cx, y, z, 0.01));
      repisas.push({ x0: cx - ancho / 2 + 0.12, x1: cx + ancho / 2 - 0.12, y: y + 0.07, z, prof });
    }
  }
  estanteria(-13.0, 2.9); estanteria(-6.4, 2.9); estanteria(-3.5, 2.5);

  // Mesón (conserva su lugar) con caja registradora, ferretero y su teléfono
  local.add(caja(4.2, 1.45, 1.15, madera, -6.3, 0.25, 2.4, 0.04));
  local.add(caja(4.4, 0.1, 1.35, maderaClara, -6.3, 1.7, 2.4, 0.03));
  local.add(caja(0.8, 0.45, 0.6, mat('#2f3a46', 0.6), -7.6, 1.8, 2.3, 0.05));
  local.add(caja(0.6, 0.18, 0.35, mat('#e9e2d6', 0.7), -7.6, 2.25, 2.45, 0.03));
  const ferretero = persona({ ropa: '#e9e2d6', pantalon: '#3b4656', pelo: '#2e2420', piel: '#c99671', delantal: ACERO });
  ferretero.g.position.set(-6.0, 0.25, 1.05); ferretero.brazoNeg.piv.rotation.x = -0.75; ferretero.brazoPos.piv.rotation.x = -0.7;
  local.add(ferretero.g);
  const telM = new THREE.Group(); telM.position.set(-4.95, 1.8, 2.45); telM.rotation.y = -0.35; local.add(telM);
  telM.add(caja(0.46, 0.05, 0.86, mat('#1c1c1e', 0.4, 0.2), 0, 0, 0, 0.04));
  const matPantM = new THREE.MeshStandardMaterial({ color: '#20262c', roughness: 0.3, emissive: '#000000' });
  const pantM = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.78), matPantM); pantM.rotation.x = -PI / 2; pantM.position.y = 0.052; telM.add(pantM);
  const burbujaM = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.16), new THREE.MeshBasicMaterial({ color: '#25d366', toneMapped: false, transparent: true, opacity: 0 }));
  burbujaM.rotation.x = -PI / 2; burbujaM.position.set(0, 0.055, -0.18); telM.add(burbujaM);
  const luzTel = new THREE.PointLight('#fff2cf', 0, 3.2, 1.8); luzTel.position.set(-4.95, 2.5, 2.45); local.add(luzTel);

  /* ---------- Panel giratorio (el "panel del fondo") ----------
     Gira sobre su eje vertical frente al muro izquierdo. Tiene dos caras:
     ropa -> (gira) espejo de peluquería -> (gira) tablero de herramientas. */
  const panel = new THREE.Group(); panel.position.set(-11.6, 0.25, -1.5); local.add(panel);
  panel.add(caja(0.18, 4.3, 5.2, mat('#efe5d6', 0.88), 0, 0, 0, 0.05));
  panel.add(cilindro(0.18, 0.22, 0.12, acero, 0, -0.1, 0));
  const caraA = new THREE.Group(); caraA.position.x = 0.09; panel.add(caraA);
  const caraB = new THREE.Group(); caraB.position.x = -0.09; caraB.rotation.y = PI; panel.add(caraB);
  // Cara: ropa
  const caraRopa = new THREE.Group();
  caraRopa.add(caja(0.02, 3.9, 4.8, mat('#e7cdb8', 0.9), 0.01, 0.2, 0, 0));
  caraRopa.add(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.4, 10).rotateX(PI / 2), acero).translateX(0.45).translateY(3.4));
  ['#b97a6a', '#3e5870', '#d9b36b', '#8a9a7a', '#e8dccb', '#6d5a4a', '#c9b8d6'].forEach((c, i) => {
    const pr = caja(0.12, 1.25 + (i % 3) * 0.2, 0.55, mat(c, 0.95), 0.45, 0, -1.9 + i * 0.63, 0.04);
    pr.position.y = 3.35 - pr.geometry.parameters?.height || 0;
    pr.position.y = 3.35 - (1.25 + (i % 3) * 0.2);
    caraRopa.add(pr);
  });
  // Cara: peluquería
  const caraPelu = new THREE.Group();
  caraPelu.add(caja(0.02, 3.9, 4.8, mat('#e9d8cf', 0.9), 0.01, 0.2, 0, 0));
  caraPelu.add(caja(0.08, 2.5, 2.1, mat('#a87b50', 0.6), 0.04, 1.2, 0, 0.12));
  const espejo = caja(0.04, 2.2, 1.8, mat('#dfeaf0', 0.12, 0.55), 0.09, 1.35, 0, 0.1); caraPelu.add(espejo);
  caraPelu.add(caja(0.35, 0.06, 4.0, maderaClara, 0.18, 0.95, 0, 0.02));
  ['#e7dfd2', '#c9b8d6', '#9ec3c1', '#d9b36b', '#f1c6b8'].forEach((c, i) => caraPelu.add(cilindro(0.09, 0.09, 0.32 + (i % 2) * 0.1, mat(c, 0.4), 0.2, 1.01, -1.7 + i * 0.85, 14)));
  // Cara: ferretería (tablero perforado, herramientas y el repuesto)
  const caraFerre = new THREE.Group();
  const matPerf = new THREE.MeshStandardMaterial({ map: (() => { const t = texPerforado(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2.4); return t; })(), roughness: 0.85 });
  caraFerre.add(caja(0.03, 3.9, 4.8, matPerf, 0.01, 0.2, 0, 0));
  const mango = mat('#a87b50', 0.6), metal = mat('#8f9aa5', 0.35, 0.85), metalOsc = mat('#5d6670', 0.4, 0.8);
  // martillo
  caraFerre.add(caja(0.08, 1.0, 0.1, mango, 0.12, 2.3, -1.8, 0.03));
  caraFerre.add(caja(0.14, 0.18, 0.5, metalOsc, 0.12, 3.25, -1.8, 0.03));
  // llave inglesa
  caraFerre.add(caja(0.06, 1.05, 0.16, metal, 0.1, 2.2, -1.05, 0.03));
  const anillo = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.06, 10, 20), metal); anillo.rotation.y = PI / 2; anillo.position.set(0.1, 3.35, -1.05); caraFerre.add(sombra(anillo));
  // alicate
  for (const s of [-1, 1]) { const p = caja(0.05, 0.95, 0.09, mat('#b4533c', 0.6), 0.1, 2.3, -0.32 + s * 0.06, 0.03); p.rotation.x = s * 0.18; caraFerre.add(p); }
  // serrucho
  const hoja = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(1.3, 0), new THREE.Vector2(1.3, 0.45)])), mat('#b9c2ca', 0.3, 0.9, { side: THREE.DoubleSide }));
  hoja.rotation.y = -PI / 2; hoja.position.set(0.1, 2.75, 0.35); caraFerre.add(sombra(hoja));
  caraFerre.add(caja(0.1, 0.4, 0.3, mango, 0.1, 2.55, 0.25, 0.04));
  // cinta métrica y rollos
  const cinta = cilindro(0.22, 0.22, 0.14, mat('#e0c15a', 0.5), 0.12, 3.1, 1.35, 20); cinta.rotation.z = PI / 2; cinta.position.set(0.19, 3.1, 1.35); caraFerre.add(cinta);
  // repisa con el repuesto (el mismo de la foto de la ficha)
  caraFerre.add(caja(0.55, 0.07, 2.6, maderaClara, 0.3, 1.6, 0.85, 0.02));
  const pieza = cartucho(); pieza.scale.setScalar(1.7); pieza.position.set(0.32, 1.67, 1.45); caraFerre.add(pieza);
  caraFerre.add(caja(0.35, 0.35, 0.45, mat('#c8a46b', 0.85), 0.3, 1.67, 0.55, 0.03));
  caraFerre.add(caja(0.3, 0.28, 0.4, mat(ACERO, 0.7), 0.3, 1.67, 0.05, 0.03));
  caraFerre.add(caja(0.32, 0.5, 0.36, mat('#e7dfd2', 0.8), 0.3, 1.67, 2.0, 0.03));

  function ponerCaras(frente, dorso) {
    caraA.clear(); caraB.clear();
    if (frente) caraA.add(frente);
    if (dorso) caraB.add(dorso);
  }

  /* ---------- Mobiliario por rubro (crece desde el piso) ---------- */
  const juegos = [new THREE.Group(), new THREE.Group(), new THREE.Group()];
  juegos.forEach((j) => local.add(j));
  const y0 = 0.25;
  // Ropa: percha central, mesa con ropa doblada y maniquí
  (function () {
    const j = juegos[0];
    const percha = new THREE.Group(); percha.position.set(-7.4, y0, -1.6); j.add(percha);
    percha.add(cilindro(0.05, 0.05, 2.9, acero, -1.3, 0, 0, 10)); percha.add(cilindro(0.05, 0.05, 2.9, acero, 1.3, 0, 0, 10));
    const barra = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 2.7, 10).rotateZ(PI / 2), acero); barra.position.y = 2.85; percha.add(barra);
    ['#3e5870', '#b97a6a', '#e8dccb', '#d9b36b', '#8a9a7a', '#6d5a4a'].forEach((c, i) => percha.add(caja(0.42, 1.4, 0.1, mat(c, 0.95), -1.05 + i * 0.42, 1.38, 0, 0.03)));
    const mesa = new THREE.Group(); mesa.position.set(-4.4, y0, -3.9); j.add(mesa);
    mesa.add(caja(2.2, 1.1, 1.3, maderaClara, 0, 0, 0, 0.04));
    for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) mesa.add(caja(0.42, 0.09, 0.5, mat(elegir(['#c9b8d6', '#e8dccb', '#b97a6a', '#3e5870']), 0.95), -0.75 + i * 0.5, 1.1 + k * 0.1, 0, 0.02));
    const mani = persona({ ropa: '#d9b36b', pantalon: '#e8dccb', pelo: '#efe9e0', piel: '#efe9e0' }); mani.g.position.set(-9.0, y0, 1.4); mani.g.rotation.y = 0.5; j.add(mani.g);
  })();
  // Peluquería: sillón frente al espejo, carrito y lavacabezas
  (function () {
    const j = juegos[1];
    const sillon = new THREE.Group(); sillon.position.set(-9.6, y0, -1.5); sillon.rotation.y = -PI / 2; j.add(sillon);
    sillon.add(cilindro(0.5, 0.6, 0.08, mat('#2b2b2b', 0.5, 0.6), 0, 0, 0));
    sillon.add(cilindro(0.08, 0.08, 0.7, mat('#9aa5b0', 0.3, 0.9), 0, 0.05, 0, 12));
    sillon.add(caja(1.0, 0.25, 1.0, acero, 0, 0.72, 0, 0.1));
    sillon.add(caja(1.0, 1.1, 0.22, acero, 0, 0.9, -0.44, 0.1));
    for (const s of [-1, 1]) sillon.add(caja(0.14, 0.2, 0.8, mat('#2f3a46', 0.6), s * 0.55, 1.0, 0.05, 0.05));
    const carro = new THREE.Group(); carro.position.set(-8.4, y0, -3.6); j.add(carro);
    carro.add(caja(0.8, 1.3, 0.6, mat('#e7dfd2', 0.6), 0, 0, 0, 0.05));
    ['#c9b8d6', '#9ec3c1', '#d9b36b'].forEach((c, i) => carro.add(cilindro(0.08, 0.08, 0.3, mat(c, 0.4), -0.25 + i * 0.25, 1.3, 0, 12)));
    const lava = new THREE.Group(); lava.position.set(-4.5, y0, -3.9); j.add(lava);
    lava.add(caja(1.6, 1.0, 1.0, mat('#f1ede6', 0.5), 0, 0, 0, 0.1));
    lava.add(caja(1.2, 0.3, 0.8, mat('#2f3a46', 0.4), 0, 1.0, 0, 0.12));
    const banco = caja(2.4, 0.5, 0.6, maderaClara, -7.6, y0, 0.2, 0.05); j.add(banco);
  })();
  // Ferretería: góndola central, pila de tarros de pintura, escalera y mangueras
  const gondola = new THREE.Group();
  (function () {
    const j = juegos[2];
    gondola.position.set(-7.4, y0, -1.6); j.add(gondola);
    gondola.add(caja(3.0, 2.1, 1.3, maderaClara, 0, 0, 0, 0.04));
    gondola.add(caja(3.0, 0.12, 1.3, mat('#efe6d8', 0.9), 0, 2.1, 0, 0.02));
    const tarros = new THREE.Group(); tarros.position.set(-4.3, y0, -4.1); j.add(tarros);
    const cols = ['#3e5870', '#b4533c', '#e0c15a', '#f3efe7', '#5d7a64'];
    let n = 0;
    for (let piso = 0; piso < 3; piso++) for (let i = 0; i < 3 - piso; i++) for (let k = 0; k < 2; k++) tarros.add(cilindro(0.3, 0.3, 0.55, mat(cols[(n++) % cols.length], 0.55, 0.2), (i - (2 - piso) / 2) * 0.64, piso * 0.56, k * 0.64 - 0.3, 18));
    const escalera = new THREE.Group(); escalera.position.set(-9.0, y0, 1.6); escalera.rotation.y = 0.4; j.add(escalera);
    for (const s of [-1, 1]) { const p = caja(0.08, 3.2, 0.08, mat('#e0c15a', 0.5), s * 0.42, 0, 0, 0.02); p.rotation.x = 0.12; escalera.add(p); }
    for (let i = 0; i < 5; i++) escalera.add(caja(0.84, 0.05, 0.1, mat('#e0c15a', 0.5), 0, 0.4 + i * 0.6, -0.05 - i * 0.07, 0.01));
    for (let i = 0; i < 2; i++) { const m = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.09, 10, 28), mat('#5d7a64', 0.6)); m.rotation.y = PI / 2; m.position.set(-5.85, y0 + 1.35 + i * 0.25, -1.6 + i * 0.12); j.add(sombra(m)); }
  })();
  // Cada pieza de un juego crece desde el piso por separado (con escalonamiento)
  const piezasJuego = juegos.map((j) => j.children.slice());

  /* ---------- Productos en las estanterías, por rubro ---------- */
  const prods = [0, 1, 2].map(() => { const g = new THREE.Group(); local.add(g); return new Productos(g); });
  const rnd2 = azar(11);
  const pal = {
    ropa: ['#b97a6a', '#3e5870', '#d9b36b', '#8a9a7a', '#e8dccb', '#6d5a4a', '#c9b8d6'],
    pelu: ['#e7dfd2', '#c9b8d6', '#9ec3c1', '#d9b36b', '#f1c6b8', '#3e5870', '#ffffff'],
    caja: ['#c8a46b', '#3e5870', '#d9b36b', '#b4533c', '#e7dfd2', '#5d7a64', '#e0c15a', '#b9a07a'],
    tarro: ['#3e5870', '#b4533c', '#e0c15a', '#f3efe7', '#5d7a64']
  };
  repisas.forEach((r) => {
    // Ropa: pilas de ropa doblada
    for (let x = r.x0; x < r.x1 - 0.4;) { const w = 0.5; const h = 0.25 + rnd2() * 0.35; prods[0].add('caja', x + w / 2, r.y, r.z, w, h, r.prof * 0.75, pal.ropa[Math.floor(rnd2() * 7)]); x += w + 0.06; }
    // Peluquería: frascos y cajitas
    for (let x = r.x0; x < r.x1 - 0.2;) {
      if (rnd2() < 0.6) { const d = 0.16 + rnd2() * 0.1; prods[1].add('cil', x + d / 2, r.y, r.z + 0.1, d, 0.3 + rnd2() * 0.3, d, pal.pelu[Math.floor(rnd2() * 7)]); x += d + 0.08; }
      else { const w = 0.3; prods[1].add('caja', x + w / 2, r.y, r.z, w, 0.32, 0.3, pal.pelu[Math.floor(rnd2() * 7)]); x += w + 0.08; }
    }
    // Ferretería: cajas y tarros
    for (let x = r.x0; x < r.x1 - 0.25;) {
      if (rnd2() < 0.3) { const d = 0.36; prods[2].add('cil', x + d / 2, r.y, r.z + 0.05, d, 0.42, d, pal.tarro[Math.floor(rnd2() * 5)]); x += d + 0.06; }
      else { const w = 0.3 + rnd2() * 0.35; prods[2].add('caja', x + w / 2, r.y, r.z, w, 0.3 + rnd2() * 0.45, r.prof * (0.6 + rnd2() * 0.3), pal.caja[Math.floor(rnd2() * 8)]); x += w + 0.05; }
    }
  });
  // Góndola de la ferretería (sus productos son parte del rubro)
  for (const lado of [-1, 1]) for (let x = -1.35; x < 1.3;) { const w = 0.28 + rnd2() * 0.25; prods[2].add('caja', -7.4 + x + w / 2, y0 + 2.22, -1.6 + lado * 0.3, w, 0.25 + rnd2() * 0.35, 0.5, pal.caja[Math.floor(rnd2() * 8)]); x += w + 0.05; }
  prods.forEach((p) => p.construir());

  /* ---------- CASA DE LA VECINA (cocina en corte, al otro lado de la calle) ---------- */
  const casa = new THREE.Group(); raiz.add(casa);
  const cx0 = 6.15, cx1 = 15.6, cz0 = -7.3, cz1 = 3.4, cxm = (cx0 + cx1) / 2, cw = cx1 - cx0, cd = cz1 - cz0;
  casa.add(caja(cw, 4.2, cd, espuma, cxm, 0, (cz0 + cz1) / 2, 0.05));                 // primer piso (volumen)
  casa.add(caja(0.06, 2.9, 1.5, acero, cx0 - 0.02, 0, -1.2, 0.02));                   // puerta de calle
  casa.add(caja(0.04, 2.6, 1.3, mat('#dfe8ee', 0.2), cx0 - 0.04, 0.15, -1.2, 0.02));
  casa.add(caja(0.06, 1.5, 2.2, acero, cx0 - 0.02, 1.4, -4.6, 0.02));
  casa.add(caja(0.04, 1.3, 2.0, mat('#dfe8ee', 0.2), cx0 - 0.04, 1.5, -4.6, 0.02));
  const pisoCocina = new THREE.MeshStandardMaterial({ map: (() => { const t = texBaldosa('#efe8dd', '#ddd2c2', 6); t.repeat.set(2, 2); return t; })(), roughness: 0.6 });
  casa.add(caja(cw, 0.22, cd, pisoCocina, cxm, 4.2, (cz0 + cz1) / 2, 0.02));
  casa.add(caja(cw, 4.2, 0.3, espuma, cxm, 4.2, cz0 + 0.15, 0.03));
  casa.add(caja(0.3, 4.2, cd, espuma, cx1 - 0.15, 4.2, (cz0 + cz1) / 2, 0.03));
  // Muro hacia la calle con ventana que mira a la ferretería
  const cwF = (z0, z1, y0_, y1) => casa.add(caja(0.3, y1 - y0_, z1 - z0, espuma, cx0 + 0.15, y0_, (z0 + z1) / 2, 0.02));
  cwF(cz0, -4.6, 4.2, 8.4); cwF(-0.8, cz1, 4.2, 8.4); cwF(-4.6, -0.8, 4.2, 5.4); cwF(-4.6, -0.8, 7.4, 8.4);
  casa.add(caja(0.16, 0.12, 3.9, acero, cx0 - 0.02, 5.3, -2.7, 0.02));
  casa.add(caja(0.16, 0.12, 3.9, acero, cx0 - 0.02, 7.32, -2.7, 0.02));
  const cristalC = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 2.0), vidrio); cristalC.rotation.y = PI / 2; cristalC.position.set(cx0 + 0.15, 6.4, -2.7); casa.add(cristalC);
  // Cocina: mueble con lavaplatos, llave monomando, alacenas, refrigerador, mesa
  const yc = 4.42;
  casa.add(caja(5.6, 1.45, 1.1, mat('#d9c3a3', 0.7), 10.6, yc, -6.55, 0.04));
  casa.add(caja(5.8, 0.1, 1.25, mat('#ece8e1', 0.35), 10.6, yc + 1.45, -6.5, 0.03));
  casa.add(caja(5.6, 1.2, 0.06, mat('#f1ece4', 0.4), 10.6, yc + 1.55, -6.95, 0));
  casa.add(caja(5.6, 1.1, 0.7, mat('#c9a984', 0.7), 10.6, yc + 2.9, -6.7, 0.04));
  casa.add(caja(1.0, 0.06, 0.7, mat('#9aa5b0', 0.25, 0.9), 9.4, yc + 1.52, -6.45, 0.02));
  const llave = new THREE.Group(); llave.position.set(9.4, yc + 1.55, -6.82); casa.add(llave);
  llave.add(cilindro(0.06, 0.07, 0.62, metal, 0, 0, 0, 14));
  const pico = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.045, 10, 20, PI), metal); pico.rotation.y = PI / 2; pico.position.set(0, 0.62, 0.22); llave.add(sombra(pico));
  llave.add(caja(0.06, 0.06, 0.3, metal, 0, 0.66, -0.12, 0.02));
  const gota = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), new THREE.MeshStandardMaterial({ color: '#8fc3e0', roughness: 0.1, emissive: '#2a5d7a', emissiveIntensity: 0.35 }));
  casa.add(gota);
  const gotaDesde = new THREE.Vector3(9.4, yc + 1.55 + 0.6, -6.38), gotaHasta = yc + 1.56;
  casa.add(caja(1.1, 3.6, 1.1, mat('#e9edf0', 0.35, 0.1), 14.6, yc, -6.3, 0.12));
  casa.add(caja(0.05, 1.1, 0.06, mat('#9aa5b0', 0.3, 0.9), 14.05, yc + 1.9, -5.8, 0.02));
  casa.add(caja(1.6, 1.25, 1.2, maderaClara, 14.2, yc, -1.6, 0.04));
  casa.add(caja(0.6, 0.85, 0.6, acero, 14.2, yc, -0.5, 0.06));
  const maceta = cilindro(0.25, 0.2, 0.4, mat('#c8a46b', 0.8), 14.0, yc + 1.25, -1.7); casa.add(maceta);
  const hojas = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, 1), mat('#8fa384', 0.9, 0, { flatShading: true })); hojas.position.set(14.0, yc + 1.95, -1.7); casa.add(sombra(hojas));

  // La vecina: en una mano la pieza gastada, con la otra toma el teléfono
  const vecina = persona({ ropa: '#8a9a8f', pantalon: '#3b4656', pelo: '#3a2a22', piel: '#d6a47a', moño: true });
  vecina.g.position.set(10.7, yc, -4.7); vecina.g.rotation.y = -0.18; casa.add(vecina.g);
  const piezaG = cartucho(true); piezaG.scale.setScalar(1.25); piezaG.position.set(0, 0.02, 0.1); vecina.brazoNeg.mano.add(piezaG);
  vecina.brazoNeg.piv.rotation.x = -1.05; vecina.brazoNeg.piv.rotation.z = -0.25;
  const telV = new THREE.Group(); vecina.brazoPos.mano.add(telV);
  telV.add(caja(0.26, 0.48, 0.05, mat('#1c1c1e', 0.4, 0.2), 0, 0, 0.08, 0.03));
  const pantV = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.42), new THREE.MeshBasicMaterial({ color: '#dfe9f2', toneMapped: false })); pantV.position.set(0, 0.24, 0.111); pantV.rotation.y = PI; telV.add(pantV);
  telV.rotation.x = -0.25;
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.045, 12, 48), new THREE.MeshBasicMaterial({ color: ACERO, transparent: true, opacity: 0, toneMapped: false }));
  vecina.brazoNeg.mano.add(halo); halo.position.set(0, 0.25, 0.12);

  /* ---------- Cantos de los muros (contorno de maqueta de cartón pluma) ---------- */
  const canto = mat('#cfc5b6', 0.9);
  [[13.15, 0.3, -8.57, 6, -7.15], [0.3, 12.3, -15.15, 6, -1.15], [0.3, 12.3, -2, 6, -1.15],
   [cw, 0.3, cxm, 8.4, cz0 + 0.15], [0.3, cd, cx1 - 0.15, 8.4, (cz0 + cz1) / 2], [0.3, cd, cx0 + 0.15, 8.4, (cz0 + cz1) / 2]]
    .forEach(([w, d, x, y, z]) => raiz.add(sombra(caja(w + 0.02, 0.025, d + 0.02, canto, x, y, z, 0), false, false)));

  /* ---------- Calle: farol, árboles, furgón y un peatón ---------- */
  const farol = new THREE.Group(); farol.position.set(-1.2, 0.16, 5.6); raiz.add(farol);
  farol.add(cilindro(0.07, 0.09, 5.2, acero, 0, 0, 0, 12));
  farol.add(caja(0.9, 0.12, 0.3, acero, 0.35, 5.15, 0, 0.04));
  const ampolleta = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), new THREE.MeshBasicMaterial({ color: '#fff3c9', toneMapped: false })); ampolleta.position.set(0.7, 5.05, 0); farol.add(ampolleta);
  function arbol(x, z, s) {
    const a = new THREE.Group(); a.position.set(x, 0.16, z); a.scale.setScalar(s); raiz.add(a);
    a.add(cilindro(0.1, 0.14, 1.6, mat('#8c6a4c', 0.9), 0, 0, 0, 10));
    const c = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 1), mat('#9fb08f', 0.95, 0, { flatShading: true })); c.position.y = 2.2; a.add(sombra(c));
    const c2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 1), mat('#8fa384', 0.95, 0, { flatShading: true })); c2.position.set(0.45, 1.85, 0.25); a.add(sombra(c2));
  }
  arbol(5.1, 5.6, 1.1); arbol(5.1, -6.4, 0.95); arbol(-1.3, -7.8, 0.8);
  const furgon = new THREE.Group(); furgon.position.set(2.85, 0.05, 2.6); raiz.add(furgon);
  furgon.add(caja(1.55, 1.25, 3.3, mat('#f2efe9', 0.45, 0.1), 0, 0.3, 0, 0.3));
  furgon.add(caja(1.45, 0.55, 1.0, mat('#2c343c', 0.15, 0.3), 0, 1.0, 1.25, 0.12));
  furgon.add(caja(1.58, 0.05, 2.0, mat(ACERO, 0.5), 0, 0.85, -0.5, 0.02));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.22, 18).rotateZ(PI / 2), mat('#222', 0.8)); r.position.set(sx * 0.72, 0.3, sz * 1.1); furgon.add(sombra(r)); }
  const peaton = persona({ ropa: '#b97a6a', pantalon: '#3b4656', pelo: '#5a4232', piel: '#c99671' });
  peaton.g.scale.setScalar(0.98); peaton.g.position.set(-0.95, 0.16, 0); raiz.add(peaton.g);

  /* ---------- Postproceso: tilt-shift de maqueta ---------- */
  const objetivo = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, objetivo);
  composer.addPass(new RenderPass(scene, camera));
  const tsH = new ShaderPass(HorizontalTiltShiftShader), tsV = new ShaderPass(VerticalTiltShiftShader);
  composer.addPass(tsH); composer.addPass(tsV);
  composer.addPass(new OutputPass());

  /* ---------- Encuadres de cámara ---------- */
  const CAM = {
    tienda:    { t: [-8.0, 2.0, -0.6],  az: 40, el: 32, d: 40,  fov: 28 },
    abre:      { t: [0.6, 2.6, -1.2],   az: 14, el: 32, d: 64,  fov: 28 },
    vitrina:   { t: [-2.0, 2.75, -1.5], az: 90, el: 4,  d: 7.6, fov: 44 },
    vecina:    { t: [12.4, 6.0, -4.3],  az: 14, el: 20, d: 19,  fov: 28 },
    cruce:     { t: [1.6, 3.0, -1.2],   az: 8,  el: 31, d: 62,  fov: 28 },
    mostrador: { t: [-5.6, 2.2, 2.0],   az: 30, el: 30, d: 10.5, fov: 28 }
  };
  const cam = { t: new THREE.Vector3(), az: 0, el: 0, d: 0, fov: 28 };
  function ponerCam(c) { cam.t.set(...c.t); cam.az = c.az; cam.el = c.el; cam.d = c.d; cam.fov = c.fov; }
  function aplicarCam(deriva = 0) {
    const az = (cam.az + deriva) * PI / 180, el = cam.el * PI / 180;
    camera.position.set(cam.t.x + Math.sin(az) * Math.cos(el) * cam.d, cam.t.y + Math.sin(el) * cam.d, cam.t.z + Math.cos(az) * Math.cos(el) * cam.d);
    camera.fov = cam.fov; camera.updateProjectionMatrix();
    camera.lookAt(cam.t);
  }

  /* ---------- Animaciones ---------- */
  const tweens = new Map();
  function anim(clave, dur, fn, { delay = 0, ease = eio, fin } = {}) {
    tweens.set(clave, { t0: performance.now() + delay, dur, fn, ease, fin });
  }
  function avanzar(ahora) {
    for (const [k, tw] of tweens) {
      const p = (ahora - tw.t0) / tw.dur;
      if (p < 0) continue;
      const q = Math.min(1, p);
      tw.fn(tw.ease(q));
      if (q >= 1) { tweens.delete(k); if (tw.fin) tw.fin(); }
    }
  }

  function moverCam(nombre, instantaneo) {
    const dest = CAM[nombre] || CAM.tienda;
    if (instantaneo) { ponerCam(dest); return; }
    const desde = { t: cam.t.clone(), az: cam.az, el: cam.el, d: cam.d, fov: cam.fov };
    const tD = new THREE.Vector3(...dest.t);
    // Si el viaje es largo, la cámara se eleva un poco a medio camino (arco de grúa)
    const largo = desde.t.distanceTo(tD) > 6;
    anim('cam', largo ? 1700 : 1400, (k) => {
      cam.t.lerpVectors(desde.t, tD, k);
      cam.az = desde.az + (dest.az - desde.az) * k;
      cam.el = desde.el + (dest.el - desde.el) * k + (largo ? Math.sin(k * PI) * 6 : 0);
      cam.d = desde.d + (dest.d - desde.d) * k + (largo ? Math.sin(k * PI) * 6 : 0);
      cam.fov = desde.fov + (dest.fov - desde.fov) * k;
    });
  }

  // Rubro: 0 ropa, 1 peluquería, 2 ferretería
  let rubro = -1, giro = 0;
  function factorJuego(i, f) {
    piezasJuego[i].forEach((o, k) => { o.scale.y = Math.max(0.0001, f); o.visible = f > 0.002; });
  }
  function ponerRubro(n, instantaneo) {
    if (n === rubro) return;
    const antes = rubro; rubro = n;
    if (instantaneo || antes < 0 || Math.abs(n - antes) !== 1) {
      tweens.delete('panel');
      [0, 1, 2].forEach((i) => { factorJuego(i, i === n ? 1 : 0); prods[i].aplicar(i === n ? 1 : 0); });
      if (n === 0) { ponerCaras(caraRopa, caraPelu); giro = 0; }
      else if (n === 1) { ponerCaras(caraFerre, caraPelu); giro = PI; }
      else { ponerCaras(caraFerre, caraPelu); giro = 0; }
      panel.rotation.y = giro;
      matCartel.map = carteles[n]; matCartel.needsUpdate = true;
      return;
    }
    // 1) lo anterior se recoge hacia el piso, escalonado
    piezasJuego[antes].forEach((o, k) => anim('sale' + antes + '-' + k, 450, (t) => { o.scale.y = Math.max(0.0001, 1 - t); o.visible = t < 0.99; }, { delay: k * 70, ease: eio }));
    anim('prodSale' + antes, 600, (t) => prods[antes].aplicar(1 - t), { ease: eio });
    // 2) el panel del fondo gira media vuelta
    const g0 = giro, g1 = giro + PI;
    anim('panel', 1300, (t) => { panel.rotation.y = g0 + (g1 - g0) * t; }, {
      delay: 250, fin: () => {
        giro = g1 % (PI * 2); panel.rotation.y = giro;
        if (n === 1) ponerCaras(caraFerre, caraPelu);   // la cara oculta pasa a ser el tablero
      }
    });
    anim('cartel', 1, () => { matCartel.map = carteles[n]; matCartel.needsUpdate = true; }, { delay: 900 });
    // 3) lo nuevo crece desde el piso
    piezasJuego[n].forEach((o, k) => { o.scale.y = 0.0001; o.visible = false; anim('entra' + n + '-' + k, 700, (t) => { o.scale.y = Math.max(0.0001, t); o.visible = true; }, { delay: 900 + k * 90, ease: eback }); });
    anim('prodEntra' + n, 900, (t) => prods[n].aplicar(t), { delay: 1000, ease: eout });
  }

  function ponerVecina(estado, instantaneo) {
    const a = estado === 'telefono' ? 1 : 0;
    const set = (k) => { vecina.brazoPos.piv.rotation.x = -1.35 * k; vecina.brazoPos.piv.rotation.z = 0.08 + 0.35 * k; telV.scale.setScalar(Math.max(0.0001, k)); };
    if (instantaneo) { set(a); return; }
    const desde = telV.scale.x;
    anim('vecina', 900, (t) => set(desde + (a - desde) * t), { ease: eio });
  }

  let piezaOn = false, mostradorOn = false;
  function ponerMostrador(on, instantaneo) {
    mostradorOn = on;
    const set = (k) => {
      matPantM.emissive.setRGB(1, 0.96, 0.88).multiplyScalar(0.9 * k);
      matPantM.color.set(k > 0.01 ? '#f4ebe2' : '#20262c');
      burbujaM.material.opacity = k;
      luzTel.intensity = 6 * k;
    };
    if (instantaneo) { set(on ? 1 : 0); return; }
    anim('mostrador', 700, set === null ? null : (t) => set(on ? t : 1 - t), { ease: eout });
  }

  /* ---------- Escuchar el estado del relato ---------- */
  function leer(instantaneo) {
    const d = escena.dataset;
    if (d.cam) moverCam(d.cam, instantaneo);
    ponerRubro(+d.rubro || 0, instantaneo);
    ponerVecina(d.vec, instantaneo);
    piezaOn = d.pieza === 'on';
    if ((d.mostrador === 'on') !== mostradorOn || instantaneo) ponerMostrador(d.mostrador === 'on', instantaneo);
  }
  let camActual = escena.dataset.cam;
  new MutationObserver((lista) => {
    lista.forEach((m) => {
      const k = m.attributeName;
      if (k === 'data-cam' && escena.dataset.cam !== camActual) { camActual = escena.dataset.cam; moverCam(camActual); }
      else if (k === 'data-rubro') ponerRubro(+escena.dataset.rubro || 0, false);
      else if (k === 'data-vec') ponerVecina(escena.dataset.vec, false);
      else if (k === 'data-pieza') piezaOn = escena.dataset.pieza === 'on';
      else if (k === 'data-mostrador') ponerMostrador(escena.dataset.mostrador === 'on', false);
    });
  }).observe(escena, { attributes: true, attributeFilter: ['data-cam', 'data-rubro', 'data-vec', 'data-pieza', 'data-mostrador'] });
  ponerCam(CAM[escena.dataset.cam] || CAM.tienda);
  leer(true);

  /* ---------- Tamaño y proyección a pantalla ---------- */
  function medir() {
    const r = mundo.getBoundingClientRect();
    const w = Math.max(2, Math.round(r.width)), h = Math.max(2, Math.round(r.height));
    renderer.setSize(w, h, false);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    tsH.uniforms.h.value = 1.15 / w; tsV.uniforms.v.value = 1.15 / h;
    tsH.uniforms.r.value = tsV.uniforms.r.value = 0.5;
  }
  new ResizeObserver(medir).observe(mundo);
  medir();

  const v = new THREE.Vector3();
  function aPantalla(p) {
    v.copy(p).project(camera);
    const r = canvas.getBoundingClientRect();
    return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height };
  }
  const caja3 = new THREE.Box3();
  function rectPieza() {
    scene.updateMatrixWorld();
    caja3.setFromObject(pieza);
    const esq = [];
    for (const x of [caja3.min.x, caja3.max.x]) for (const y of [caja3.min.y, caja3.max.y]) for (const z of [caja3.min.z, caja3.max.z]) esq.push(aPantalla(new THREE.Vector3(x, y, z)));
    const xs = esq.map((e) => e.x), ys = esq.map((e) => e.y);
    const l = Math.min(...xs), t = Math.min(...ys), w = Math.max(...xs) - l, h = Math.max(...ys) - t;
    const lado = Math.max(w, h);
    return { left: l + w / 2 - lado / 2, top: t + h / 2 - lado / 2, width: lado, height: lado };
  }
  const posTel = new THREE.Vector3();
  function ubicarAviso() {
    if (!capaUI) return;
    telM.getWorldPosition(posTel);
    const p = aPantalla(posTel), r = capaUI.getBoundingClientRect();
    escena.style.setProperty('--llx', Math.round(p.x - r.left + 34) + 'px');
    escena.style.setProperty('--lly', Math.round(p.y - r.top) + 'px');
  }

  /* ---------- Bucle (solo mientras el escenario está a la vista) ---------- */
  let visible = false;
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; }, { rootMargin: '200px 0px' }).observe(escena);
  const inicio = performance.now();
  function cuadro(ahora) {
    requestAnimationFrame(cuadro);
    if (!visible || document.hidden) return;
    const t = (ahora - inicio) / 1000;
    avanzar(ahora);
    aplicarCam(Math.sin(t * 0.25) * 0.6);
    // gota que cae de la llave
    const c = (t % 1.7) / 1.7;
    gota.position.set(gotaDesde.x, gotaDesde.y - (gotaDesde.y - gotaHasta) * Math.min(1, c * c * 1.6), gotaDesde.z);
    gota.scale.setScalar(c < 0.12 ? c / 0.12 : c > 0.9 ? Math.max(0.0001, (1 - c) / 0.1) : 1);
    // peatón que camina por la vereda
    const pz = 1.8 + ((t * 0.5) % 6.6);
    peaton.g.position.z = pz; peaton.g.position.y = 0.16 + Math.abs(Math.sin(t * 5)) * 0.04;
    peaton.brazoNeg.piv.rotation.x = Math.sin(t * 5) * 0.45; peaton.brazoPos.piv.rotation.x = -Math.sin(t * 5) * 0.45;
    // resalte de la pieza gastada
    const objetivoHalo = piezaOn ? 0.9 : 0;
    halo.material.opacity += (objetivoHalo - halo.material.opacity) * 0.12;
    halo.scale.setScalar(1 + Math.sin(t * 4) * 0.08);
    halo.visible = halo.material.opacity > 0.01;
    if (mostradorOn) ubicarAviso();
    composer.render();
  }
  requestAnimationFrame(cuadro);
  // La tipografía del cartel puede cargar después: se repinta una vez lista
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => {
    ['TIENDA DE ROPA', 'PELUQUERÍA', 'FERRETERÍA DEL BARRIO'].forEach((txt, i) => { const nt = texCartel(txt); carteles[i].image = nt.image; carteles[i].needsUpdate = true; });
  });

  escena.classList.add('con-3d');
  const api = { activo: true, rectPieza, ubicarAviso };
  window.Diorama3D = api;
  return api;
}
