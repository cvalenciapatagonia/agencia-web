/* Escena 3D del hero (rama threejs).
   Réplica exacta del último cuadro del video (assets/img/hero-final.webp):
   - La cámara se calzó con la foto a partir de las esquinas del notebook y del teléfono
     (error medio ~7 px en 1920x1080).
   - La foto se proyecta desde esa cámara sobre la geometría 3D (proyección de cámara).
     En reposo el resultado es idéntico a la foto; al mover el mouse la cámara se desplaza
     un poco y los equipos se separan del fondo con profundidad real.
   - Notebook: geometría propia. Teléfono: forma del modelo glTF "NotchPhone" de Sal Blrm,
     licencia CC-BY 3.0 (ver sitio/assets/3d/CREDITOS.txt).
   Compilar con: npm run build:3d */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, InstancedMesh, Object3D,
  PlaneGeometry, ShapeGeometry, Shape, ShaderMaterial, TextureLoader, SRGBColorSpace,
  LinearFilter, Matrix4, Vector3
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Cámara calzada con la foto (1920x1080, 16:9)
const CAM = { pos: [3.5226, 1.8294, 9.5674], yaw: 0.4905, pitch: -0.0575, roll: -0.0292, fov: 22.368 };
// Notebook (1 unidad ≈ 11,6 cm): tapa abierta ALFA rad hacia atrás desde la vertical
const AN = 2.7, FO = 1.9, AL_BASE = 0.085, AL_TAPA = 2.0074, GR_TAPA = 0.042, ALFA = 0.2951;
// Teléfono calzado
const TEL = { x: 1.0238, z: 1.4801, yaw: 0.15, esc: 2.1855 };

export async function iniciarEscena3D(contenedor, opciones = {}) {
  const quieto = !!opciones.sinMovimiento;
  const base = opciones.base || 'assets/';

  const lienzo = document.createElement('canvas');
  lienzo.className = 'escena-3d';
  lienzo.setAttribute('aria-hidden', 'true');
  const render = new WebGLRenderer({ canvas: lienzo, antialias: true, alpha: false, powerPreference: 'high-performance' });
  render.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  render.outputColorSpace = SRGBColorSpace;

  // foto: el último cuadro tal cual. Los parches son trozos de la misma foto con los equipos
  // borrados: se usan solo dentro de su rectángulo, para que al mover la cámara no aparezcan
  // "fantasmas" (equipos de la foto pintados en el fondo, o el teléfono pintado en el notebook).
  const cargar = (url) => new TextureLoader().loadAsync(base + url);
  const [foto, parcheFondo, parcheNotebook, gltfTelefono] = await Promise.all([
    cargar('img/hero-final.webp'), cargar('3d/parche-fondo.webp'), cargar('3d/parche-notebook.webp'),
    new GLTFLoader().loadAsync(base + '3d/telefono.glb')
  ]);
  for (const t of [foto, parcheFondo, parcheNotebook]) {
    t.colorSpace = SRGBColorSpace;
    t.minFilter = LinearFilter;
    t.generateMipmaps = false;
    t.anisotropy = render.capabilities.getMaxAnisotropy();
  }

  const escena = new Scene();

  // ---------- Cámara de la foto (fija) y cámara que se ve (con parallax) ----------
  function camaraCalzada() {
    const c = new PerspectiveCamera(CAM.fov, 16 / 9, 0.05, 100);
    c.position.set(...CAM.pos);
    c.rotation.set(CAM.pitch, CAM.yaw, CAM.roll, 'YXZ');
    c.updateMatrixWorld(true);
    return c;
  }
  const camFoto = camaraCalzada();
  const camara = camaraCalzada();
  const vpFoto = new Matrix4().multiplyMatrices(camFoto.projectionMatrix, camFoto.matrixWorldInverse);

  // Material que pinta cada superficie con el píxel de la foto que le corresponde.
  // rect: zona de la foto (en píxeles de 1920x1080: x0, y0, x1, y1) que se toma del parche.
  const materialProyectado = (parche, rect) => new ShaderMaterial({
    uniforms: {
      uMapa: { value: foto }, uVP: { value: vpFoto }, uParche: { value: parche || foto },
      uRect: { value: rect ? [rect[0] / 1920, 1 - rect[3] / 1080, rect[2] / 1920, 1 - rect[1] / 1080] : [2, 2, 2, 2] }
    },
    vertexShader: /* glsl */`
      uniform mat4 uVP;
      varying vec4 vFoto;
      void main() {
        vec4 p = vec4(position, 1.0);
        #ifdef USE_INSTANCING
          p = instanceMatrix * p;
        #endif
        vec4 w = modelMatrix * p;
        vFoto = uVP * w;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uMapa;
      uniform sampler2D uParche;
      uniform vec4 uRect;
      varying vec4 vFoto;
      void main() {
        vec2 uv = clamp(vFoto.xy / vFoto.w * 0.5 + 0.5, 0.0, 1.0);
        vec2 q = (uv - uRect.xy) / (uRect.zw - uRect.xy);
        bool dentro = all(greaterThanEqual(q, vec2(0.0))) && all(lessThanEqual(q, vec2(1.0)));
        // El parche trae transparencia: solo reemplaza dentro de la silueta de los equipos
        vec4 base = texture2D(uMapa, uv);
        if (dentro) { vec4 pa = texture2D(uParche, q); base.rgb = mix(base.rgb, pa.rgb, pa.a); }
        gl_FragColor = base;
        #include <colorspace_fragment>
      }`
  });
  const proyeccion = materialProyectado(null);
  const proyeccionFondo = materialProyectado(parcheFondo, [900, 302, 1801, 968]);
  const proyeccionNb = materialProyectado(parcheNotebook, [1366, 440, 1622, 1004]);

  // ---------- Fondo: mesa y pared ----------
  const mesa = new Mesh(new PlaneGeometry(80, 80), proyeccionFondo);
  mesa.rotation.x = -Math.PI / 2;
  escena.add(mesa);
  const pared = new Mesh(new PlaneGeometry(120, 60), proyeccionFondo);
  pared.position.set(0, 30, -6);
  escena.add(pared);

  // ---------- Notebook ----------
  function rectRedondeado(x0, x1, y0, y1, r) {
    const f = new Shape();
    f.moveTo(x0 + r, y0); f.lineTo(x1 - r, y0); f.quadraticCurveTo(x1, y0, x1, y0 + r);
    f.lineTo(x1, y1 - r); f.quadraticCurveTo(x1, y1, x1 - r, y1); f.lineTo(x0 + r, y1);
    f.quadraticCurveTo(x0, y1, x0, y1 - r); f.lineTo(x0, y0 + r); f.quadraticCurveTo(x0, y0, x0 + r, y0);
    return new ShapeGeometry(f, 12);
  }
  const notebook = new Group();
  const baseNb = new Mesh(new RoundedBoxGeometry(AN, AL_BASE, FO, 6, 0.04), proyeccionNb);
  baseNb.position.y = AL_BASE / 2;
  notebook.add(baseNb);
  // Teclas con relieve propio para que el parallax se note en el teclado
  const yCub = AL_BASE;
  const filas = [
    { alto: 0.55, teclas: Array(14).fill(1) }, { alto: 1, teclas: [...Array(13).fill(1), 1.45] },
    { alto: 1, teclas: [1.45, ...Array(13).fill(1)] }, { alto: 1, teclas: [1.75, ...Array(11).fill(1), 1.75] },
    { alto: 1, teclas: [2.3, ...Array(10).fill(1), 2.3] }, { alto: 1, teclas: [1, 1, 1, 1.25, 5.05, 1.25, 1, 1, 1, 1] }
  ];
  const PASO = 0.164, HUECO = 0.026, ANCHO_TECLADO = 14.45 * PASO;
  const teclas = new InstancedMesh(new RoundedBoxGeometry(1, 1, 1, 2, 0.12), proyeccionNb, filas.reduce((n, f) => n + f.teclas.length, 0));
  const aux = new Object3D();
  let z = -FO / 2 + 0.14, n = 0;
  for (const fila of filas) {
    const prof = fila.alto * PASO, suma = fila.teclas.reduce((a, b) => a + b, 0), k = ANCHO_TECLADO / (suma * PASO);
    let x = -ANCHO_TECLADO / 2;
    for (const w of fila.teclas) {
      const an = w * PASO * k;
      aux.position.set(x + an / 2, yCub + 0.004, z + prof / 2); aux.scale.set(an - HUECO, 0.008, prof - HUECO);
      aux.updateMatrix(); teclas.setMatrixAt(n++, aux.matrix); x += an;
    }
    z += prof;
  }
  notebook.add(teclas);
  const bisagra = new Group();
  bisagra.position.set(0, AL_BASE, -FO / 2 + 0.035);
  bisagra.rotation.x = -ALFA;
  notebook.add(bisagra);
  // La tapa baja un poco bajo la bisagra para que no quede ranura entre tapa y base
  const tapa = new Mesh(new RoundedBoxGeometry(AN, AL_TAPA + 0.07, GR_TAPA, 6, 0.02), proyeccionNb);
  tapa.position.set(0, 0.012 + AL_TAPA - (AL_TAPA + 0.07) / 2, -GR_TAPA / 2);
  bisagra.add(tapa);
  // Un poco más grande que el calce (error ~7 px) para cubrir por completo el equipo de la foto:
  // en reposo el borde extra muestra los mismos píxeles de la foto, así que no se nota
  notebook.scale.setScalar(1.012);
  escena.add(notebook);

  // ---------- Teléfono (forma del glTF) ----------
  const telefono = gltfTelefono.scene;
  telefono.traverse((o) => {
    if (!o.isMesh) return;
    if (o.material.name === 'mat23' && o.name !== 'group1808723591') o.material = proyeccion;
    else o.visible = false;      // muesca, pantalla e íconos del modelo
  });
  const frente = new Mesh(rectRedondeado(-0.167, 0.166, -0.443, 0.257, 0.046), proyeccion);
  frente.position.z = -0.0104;
  telefono.add(frente);
  telefono.scale.setScalar(TEL.esc * 1.025);
  telefono.position.y = 0.448 * TEL.esc * 1.025;
  const grupoTel = new Group();
  grupoTel.add(telefono);
  grupoTel.position.set(TEL.x, 0, TEL.z);
  grupoTel.rotation.y = TEL.yaw;
  escena.add(grupoTel);

  // ---------- Tamaño: el lienzo ocupa la misma caja 16:9 que la foto ----------
  function ajustar() {
    const an = contenedor.clientWidth || 1, al = contenedor.clientHeight || 1;
    render.setSize(an, al, false);
    pedirCuadro();
  }

  // ---------- Parallax: la cámara gira levemente alrededor del notebook ----------
  const pivote = new Vector3(0.4, 0.9, 0.2);
  const rel = new Vector3().copy(camFoto.position).sub(pivote);
  let mx = 0, my = 0, sx = 0, sy = 0;
  if (!quieto) {
    window.addEventListener('pointermove', (e) => {
      mx = (e.clientX / window.innerWidth) * 2 - 1;
      my = (e.clientY / window.innerHeight) * 2 - 1;
      pedirCuadro();
    }, { passive: true });
  }
  let pendiente = false, visible = true;
  function pedirCuadro() { if (!pendiente && visible) { pendiente = true; requestAnimationFrame(cuadro); } }
  const ejeY = new Vector3(0, 1, 0), ejeX = new Vector3(), p = new Vector3();
  function cuadro() {
    pendiente = false;
    sx += (mx - sx) * 0.07; sy += (my - sy) * 0.07;
    // giro pequeño: los bordes revelados quedan casi invisibles
    const giroY = -sx * 0.026, giroX = sy * 0.013;
    p.copy(rel).applyAxisAngle(ejeY, giroY);
    ejeX.set(1, 0, 0).applyAxisAngle(ejeY, CAM.yaw + giroY);
    p.applyAxisAngle(ejeX, giroX);
    camara.position.copy(pivote).add(p);
    camara.rotation.set(CAM.pitch + giroX, CAM.yaw + giroY, CAM.roll, 'YXZ');
    render.render(escena, camara);
    if (Math.abs(mx - sx) > 0.0005 || Math.abs(my - sy) > 0.0005) pedirCuadro();
  }

  new ResizeObserver(ajustar).observe(contenedor);
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible) pedirCuadro(); }).observe(contenedor);
  contenedor.insertBefore(lienzo, contenedor.querySelector('.tarjetas'));   // bajo las tarjetas
  ajustar();
  await new Promise((ok) => requestAnimationFrame(() => { cuadro(); ok(); }));
  return { lienzo, render };
}
