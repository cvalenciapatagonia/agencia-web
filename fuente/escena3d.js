/* Escena 3D del hero (rama threejs, etapa 1: escena estática con parallax suave).
   Modelos glTF con licencia CC-BY 3.0 (ver sitio/assets/3d/CREDITOS.txt):
   - "Laptop / MacBook Pro" de Alex Safayan
   - "NotchPhone" de Sal Blrm
   Se usa solo su forma: los materiales y las pantallas se crean aquí.
   Compilar con: npm run build:3d */
import {
  WebGLRenderer, Scene, PerspectiveCamera, PMREMGenerator, DirectionalLight, Group, Mesh,
  PlaneGeometry, ShapeGeometry, Shape, ShadowMaterial, MeshBasicMaterial, MeshStandardMaterial,
  MeshPhysicalMaterial, TextureLoader, CanvasTexture, SRGBColorSpace, ACESFilmicToneMapping,
  VSMShadowMap, Box3, Vector3, MathUtils, Color
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export async function iniciarEscena3D(contenedor, opciones = {}) {
  const quieto = !!opciones.sinMovimiento;
  const base = opciones.base || 'assets/3d/';

  // ---------- Renderizador ----------
  const lienzo = document.createElement('canvas');
  lienzo.className = 'escena-3d';
  lienzo.setAttribute('aria-hidden', 'true');
  const render = new WebGLRenderer({ canvas: lienzo, antialias: true, alpha: true, powerPreference: 'high-performance' });
  render.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  render.outputColorSpace = SRGBColorSpace;
  render.toneMapping = ACESFilmicToneMapping;
  render.toneMappingExposure = 1.05;
  render.shadowMap.enabled = true;
  render.shadowMap.type = VSMShadowMap;

  const escena = new Scene();
  const pmrem = new PMREMGenerator(render);
  escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.035).texture;
  escena.environmentIntensity = 1.0;

  // Luz de ventana: cálida, desde arriba a la izquierda, con sombras suaves
  const sol = new DirectionalLight(new Color('#fff1e0'), 2.8);
  sol.position.set(-4.5, 7, 3.5);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  sol.shadow.radius = 10;
  sol.shadow.blurSamples = 20;
  sol.shadow.bias = -0.0004;
  sol.shadow.normalBias = 0.02;
  Object.assign(sol.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 20 });
  escena.add(sol);
  const relleno = new DirectionalLight(new Color('#dfe8ff'), 0.35);
  relleno.position.set(5, 3, 6);
  escena.add(relleno);

  // Piso que solo recibe sombras: el fondo crema lo pone el CSS
  const piso = new Mesh(new PlaneGeometry(30, 30), new ShadowMaterial({ opacity: 0.24 }));
  piso.rotation.x = -Math.PI / 2;
  piso.receiveShadow = true;
  escena.add(piso);

  // ---------- Materiales ----------
  const aluminio = new MeshPhysicalMaterial({ color: '#dcdfe2', metalness: 1, roughness: 0.24, clearcoat: 0.25, clearcoatRoughness: 0.4 });
  const aluminioClaro = new MeshPhysicalMaterial({ color: '#e1e3e5', metalness: 1, roughness: 0.4 });
  const negro = new MeshStandardMaterial({ color: '#0d0d0e', metalness: 0.2, roughness: 0.55 });
  const marcoTelefono = new MeshPhysicalMaterial({ color: '#c9ccd0', metalness: 1, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.15 });
  const frenteTelefono = new MeshPhysicalMaterial({ color: '#08080a', metalness: 0.1, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05 });

  const cargador = new TextureLoader();
  const [texNotebook, texTelefono, gltfNotebook, gltfTelefono] = await Promise.all([
    cargador.loadAsync('assets/3d/pantalla-notebook.webp'),
    cargador.loadAsync('assets/3d/pantalla-telefono.webp'),
    new GLTFLoader().loadAsync(base + 'notebook.glb'),
    new GLTFLoader().loadAsync(base + 'telefono.glb')
  ]);
  for (const t of [texNotebook, texTelefono]) {
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = render.capabilities.getMaxAnisotropy();
  }

  // Pantalla: brilla con su propia luz y además refleja el entorno como vidrio
  function materialPantalla(tex) {
    return new MeshPhysicalMaterial({ color: '#000', emissive: '#fff', emissiveMap: tex, emissiveIntensity: 1.0,
      metalness: 0, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.03 });
  }

  // ---------- Notebook ----------
  const notebook = gltfNotebook.scene;
  let cajaPantalla = null;
  notebook.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    const nombre = o.material.name;
    const esTapa = o.parent && o.parent.name === 'group256948792';
    if (nombre === 'mat17' && esTapa) { cajaPantalla = new Box3().setFromObject(o); o.material = negro; }
    else if (nombre === 'mat23') o.material = negro;
    else if (nombre === 'mat15') o.material = aluminioClaro;
    else if (nombre === 'mat25') o.material = negro;
    else o.material = aluminio;   // carcasa y cubierta del teclado
  });
  if (cajaPantalla) {
    const ancho = cajaPantalla.max.x - cajaPantalla.min.x, alto = cajaPantalla.max.y - cajaPantalla.min.y;
    // Ajuste tipo "cover" de la textura 16:10 al panel
    const prop = ancho / alto, propTex = 1280 / 800;
    if (prop < propTex) { texNotebook.repeat.set(prop / propTex, 1); texNotebook.offset.set((1 - prop / propTex) / 2, 0); }
    const pantalla = new Mesh(new PlaneGeometry(ancho * 0.975, alto * 0.96), materialPantalla(texNotebook));
    pantalla.position.set((cajaPantalla.min.x + cajaPantalla.max.x) / 2, (cajaPantalla.min.y + cajaPantalla.max.y) / 2 + alto * 0.012, cajaPantalla.max.z + 0.003);
    notebook.add(pantalla);
  }
  const grupoNotebook = new Group();
  grupoNotebook.add(notebook);
  notebook.position.y = 0.166;                 // apoya la base en el piso
  grupoNotebook.rotation.y = -0.42;            // la pantalla mira hacia el texto
  escena.add(grupoNotebook);

  // ---------- Teléfono ----------
  const telefono = gltfTelefono.scene;
  const ESC_TEL = 1.85;
  telefono.traverse((o) => {
    if (!o.isMesh) return;
    const nombre = o.material.name;
    if (o.name === 'group1808723591') {
      o.visible = false;   // muesca del modelo (sobresale): se reemplaza por una isla plana
    } else if (nombre === 'mat23') {
      // Piezas negras: la de atrás forma el marco metálico, el resto el frente de vidrio
      const c = new Box3().setFromObject(o);
      o.material = (c.max.y - c.min.y > 0.4) ? marcoTelefono : frenteTelefono;
      o.castShadow = true;
    } else {
      o.visible = false;   // pantalla blanca, íconos y barra de ejemplo del modelo
    }
  });
  // Rectángulo redondeado plano con UV de 0 a 1
  function rectRedondeado(x0, x1, y0, y1, r) {
    const f = new Shape();
    f.moveTo(x0 + r, y0); f.lineTo(x1 - r, y0); f.quadraticCurveTo(x1, y0, x1, y0 + r);
    f.lineTo(x1, y1 - r); f.quadraticCurveTo(x1, y1, x1 - r, y1); f.lineTo(x0 + r, y1);
    f.quadraticCurveTo(x0, y1, x0, y1 - r); f.lineTo(x0, y0 + r); f.quadraticCurveTo(x0, y0, x0 + r, y0);
    const geo = new ShapeGeometry(f, 10);
    const pos = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - x0) / (x1 - x0), (pos.getY(i) - y0) / (y1 - y0));
    return geo;
  }
  // El frente del cuerpo está en z = -0.011: vidrio negro con borde, pantalla al ras e isla negra
  const vidrio = new Mesh(rectRedondeado(-0.167, 0.166, -0.443, 0.257, 0.046), frenteTelefono);
  vidrio.position.z = -0.0104;
  telefono.add(vidrio);
  const pantallaTel = new Mesh(rectRedondeado(-0.156, 0.155, -0.432, 0.246, 0.036), materialPantalla(texTelefono));
  pantallaTel.position.z = -0.0099;
  telefono.add(pantallaTel);
  const isla = new Mesh(rectRedondeado(-0.042, 0.041, 0.213, 0.236, 0.0115), negro);
  isla.position.z = -0.0094;
  telefono.add(isla);
  const grupoTelefono = new Group();
  telefono.scale.setScalar(ESC_TEL);
  telefono.position.y = 0.448 * ESC_TEL + 0.002;
  grupoTelefono.add(telefono);
  grupoTelefono.position.set(1.05, 0, 1.15);
  grupoTelefono.rotation.y = -0.3;
  escena.add(grupoTelefono);

  // Sombras de contacto: un halo oscuro y difuso justo bajo cada equipo
  function texturaHalo() {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'); const d = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    d.addColorStop(0, 'rgba(40,28,18,.6)'); d.addColorStop(0.5, 'rgba(40,28,18,.28)'); d.addColorStop(1, 'rgba(40,28,18,0)');
    g.fillStyle = d; g.fillRect(0, 0, 128, 128);
    return new CanvasTexture(c);
  }
  const halo = texturaHalo();
  function sombraContacto(ancho, fondo, x, z, rot) {
    const m = new Mesh(new PlaneGeometry(ancho, fondo), new MeshBasicMaterial({ map: halo, transparent: true, depthWrite: false }));
    m.rotation.set(-Math.PI / 2, 0, rot); m.position.set(x, 0.002, z); escena.add(m);
  }
  sombraContacto(3.7, 2.7, 0.1, 0.25, -0.42);
  sombraContacto(1.1, 0.45, 1.05, 1.15, -0.3);

  // ---------- Cámara ----------
  const camara = new PerspectiveCamera(24, 1, 0.1, 100);
  const objetivo = new Vector3(0.55, 0.9, 0.35);
  const posBase = new Vector3(-1.2, 1.75, 7.6);
  let ancho = 1, alto = 1;

  function ajustar() {
    ancho = contenedor.clientWidth || 1; alto = contenedor.clientHeight || 1;
    render.setSize(ancho, alto, false);
    camara.aspect = ancho / alto;
    // Los equipos ocupan la mitad derecha: se corre el encuadre hacia la izquierda
    const corrimiento = ancho >= 900 ? -0.27 : 0;
    camara.setViewOffset(ancho, alto, corrimiento * ancho, 0, ancho, alto);
    // En pantallas más angostas se aleja un poco para que no se corten
    const factor = MathUtils.clamp(2.35 / camara.aspect, 1.32, 2.2);
    camara.position.copy(posBase).sub(objetivo).multiplyScalar(factor).add(objetivo);
    camara.updateProjectionMatrix();
    pedirCuadro();
  }

  // ---------- Movimiento: entrada suave y parallax con el mouse ----------
  let mx = 0, my = 0, sx = 0, sy = 0, inicio = performance.now();
  const ENTRADA = 1800;
  if (!quieto) {
    window.addEventListener('pointermove', (e) => {
      mx = (e.clientX / window.innerWidth) * 2 - 1;
      my = (e.clientY / window.innerHeight) * 2 - 1;
      pedirCuadro();
    }, { passive: true });
  }

  let pendiente = false, visible = true;
  function pedirCuadro() { if (!pendiente && visible) { pendiente = true; requestAnimationFrame(cuadro); } }
  const base0 = new Vector3();
  function cuadro(ahora) {
    pendiente = false;
    let seguir = false;
    base0.copy(camara.position);
    const factorPos = camara.position.clone();
    if (!quieto) {
      sx += (mx - sx) * 0.06; sy += (my - sy) * 0.06;
      const p = Math.min(1, (ahora - inicio) / ENTRADA), e = 1 - Math.pow(1 - p, 3);
      // la cámara llega desde un poco más lejos y más baja
      const dist = 1 + 0.12 * (1 - e);
      const orb = sx * 0.07, alt = -sy * 0.05 - 0.06 * (1 - e);
      const dir = factorPos.sub(objetivo);
      const r = dir.length() * dist;
      const ang = Math.atan2(dir.x, dir.z) + orb;
      const elev = Math.asin(dir.y / dir.length()) + alt;
      camara.position.set(objetivo.x + r * Math.cos(elev) * Math.sin(ang), objetivo.y + r * Math.sin(elev), objetivo.z + r * Math.cos(elev) * Math.cos(ang));
      seguir = p < 1 || Math.abs(mx - sx) > 0.001 || Math.abs(my - sy) > 0.001;
    }
    camara.lookAt(objetivo);
    render.render(escena, camara);
    camara.position.copy(base0);
    if (seguir) pedirCuadro();
  }

  new ResizeObserver(ajustar).observe(contenedor);
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible) pedirCuadro(); }).observe(contenedor);

  contenedor.appendChild(lienzo);
  ajustar();
  // Primer cuadro dibujado: recién ahí se muestra el lienzo (la foto queda debajo hasta entonces)
  await new Promise((ok) => requestAnimationFrame(() => { render.render(escena, camara); ok(); }));
  inicio = performance.now();
  pedirCuadro();
  return { lienzo, render };
}
