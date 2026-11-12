/* Escena 3D del hero (rama threejs).
   - Notebook: geometría propia con bordes redondeados (teclas, trackpad, bisagra).
   - Teléfono: modelo glTF "NotchPhone" de Sal Blrm, licencia CC-BY 3.0
     (ver sitio/assets/3d/CREDITOS.txt). Se usa su forma; materiales y pantalla son propios.
   Compilar con: npm run build:3d */
import {
  WebGLRenderer, Scene, PerspectiveCamera, PMREMGenerator, DirectionalLight, Group, Mesh,
  InstancedMesh, Object3D, PlaneGeometry, ShapeGeometry, Shape, ShadowMaterial, MeshBasicMaterial,
  MeshStandardMaterial, MeshPhysicalMaterial,
  TextureLoader, CanvasTexture, SRGBColorSpace, NeutralToneMapping, VSMShadowMap, RepeatWrapping,
  Box3, Vector3, Vector2, MathUtils, Color
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

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
  render.toneMapping = NeutralToneMapping;      // colores fieles, como una foto de producto
  render.toneMappingExposure = 1.0;
  render.shadowMap.enabled = true;
  render.shadowMap.type = VSMShadowMap;

  const escena = new Scene();
  const pmrem = new PMREMGenerator(render);
  escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  escena.environmentIntensity = 0.9;

  // Luz de ventana: cálida, desde arriba a la izquierda, con sombra larga y suave
  const sol = new DirectionalLight(new Color('#fff0dc'), 2.6);
  sol.position.set(-2.6, 9, 4.2);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  sol.shadow.radius = 12;
  sol.shadow.blurSamples = 24;
  sol.shadow.bias = -0.0004;
  sol.shadow.normalBias = 0.02;
  Object.assign(sol.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 20 });
  escena.add(sol);
  const relleno = new DirectionalLight(new Color('#e4ecff'), 0.4);
  relleno.position.set(5, 3, 6);
  escena.add(relleno);
  // Luz de contorno desde atrás a la derecha: marca los bordes del teléfono y de la tapa
  const contorno = new DirectionalLight(new Color('#ffffff'), 0.7);
  contorno.position.set(4, 3.5, -5);
  escena.add(contorno);

  const piso = new Mesh(new PlaneGeometry(30, 30), new ShadowMaterial({ opacity: 0.1 }));
  piso.rotation.x = -Math.PI / 2;
  piso.receiveShadow = true;
  escena.add(piso);

  // ---------- Materiales ----------
  // Ruido fino para que el aluminio no se vea plano (microtextura del arenado)
  function texturaRuido(tam, min, max) {
    const c = document.createElement('canvas'); c.width = c.height = tam;
    const g = c.getContext('2d'), img = g.createImageData(tam, tam);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.round((min + Math.random() * (max - min)) * 255);
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    const t = new CanvasTexture(c); t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(6, 6);
    return t;
  }
  const ruido = texturaRuido(128, 0.82, 1);
  const aluminio = new MeshPhysicalMaterial({ color: '#d9dcdf', metalness: 1, roughness: 0.34, roughnessMap: ruido,
    clearcoat: 0.3, clearcoatRoughness: 0.35, anisotropy: 0.35 });
  const aluminioTrackpad = new MeshPhysicalMaterial({ color: '#d2d5d9', metalness: 0.9, roughness: 0.22, clearcoat: 0.6, clearcoatRoughness: 0.2 });
  const tecla = new MeshStandardMaterial({ color: '#141415', metalness: 0.05, roughness: 0.62 });
  const ranura = new MeshStandardMaterial({ color: '#2a2b2d', metalness: 0.4, roughness: 0.6 });
  const negro = new MeshStandardMaterial({ color: '#0b0b0c', metalness: 0.2, roughness: 0.5 });
  const vidrioNegro = new MeshPhysicalMaterial({ color: '#060607', metalness: 0, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.03 });
  const marcoTelefono = new MeshPhysicalMaterial({ color: '#cfd2d6', metalness: 1, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.12 });

  const cargador = new TextureLoader();
  const [texNotebook, texTelefono, gltfTelefono] = await Promise.all([
    cargador.loadAsync(base + 'pantalla-notebook.webp'),
    cargador.loadAsync(base + 'pantalla-telefono.webp'),
    new GLTFLoader().loadAsync(base + 'telefono.glb')
  ]);
  for (const t of [texNotebook, texTelefono]) {
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = render.capabilities.getMaxAnisotropy();
  }
  // Pantalla: brilla con su propia luz y además refleja el entorno como vidrio
  function materialPantalla(tex) {
    return new MeshPhysicalMaterial({ color: '#000', emissive: '#fff', emissiveMap: tex, emissiveIntensity: 1.0,
      metalness: 0, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.02 });
  }
  // Rectángulo redondeado plano con UV de 0 a 1
  function rectRedondeado(x0, x1, y0, y1, r) {
    const f = new Shape();
    f.moveTo(x0 + r, y0); f.lineTo(x1 - r, y0); f.quadraticCurveTo(x1, y0, x1, y0 + r);
    f.lineTo(x1, y1 - r); f.quadraticCurveTo(x1, y1, x1 - r, y1); f.lineTo(x0 + r, y1);
    f.quadraticCurveTo(x0, y1, x0, y1 - r); f.lineTo(x0, y0 + r); f.quadraticCurveTo(x0, y0, x0 + r, y0);
    const geo = new ShapeGeometry(f, 12);
    const pos = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - x0) / (x1 - x0), (pos.getY(i) - y0) / (y1 - y0));
    return geo;
  }
  function sombras(o) { o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; }

  // ---------- Notebook (medidas de un 14": 1 unidad ≈ 11,6 cm) ----------
  const AN = 2.7, FO = 1.9, AL_BASE = 0.085, AL_TAPA = 1.8, GR_TAPA = 0.042;
  const notebook = new Group();

  const baseNb = new Mesh(new RoundedBoxGeometry(AN, AL_BASE, FO, 6, 0.04), aluminio);
  baseNb.position.y = AL_BASE / 2;
  notebook.add(baseNb);
  const yCub = AL_BASE + 0.0006;   // superficie de la cubierta

  // Teclado: filas de teclas con anchos relativos (1 = tecla normal)
  const filas = [
    { alto: 0.55, teclas: Array(14).fill(1) },
    { alto: 1, teclas: [...Array(13).fill(1), 1.45] },
    { alto: 1, teclas: [1.45, ...Array(13).fill(1)] },
    { alto: 1, teclas: [1.75, ...Array(11).fill(1), 1.75] },
    { alto: 1, teclas: [2.3, ...Array(10).fill(1), 2.3] },
    { alto: 1, teclas: [1, 1, 1, 1.25, 5.05, 1.25, 1, 1, 1, 1] }
  ];
  const PASO = 0.164, HUECO = 0.026, ANCHO_TECLADO = 14.45 * PASO;
  const geoTecla = new RoundedBoxGeometry(1, 1, 1, 2, 0.12);
  const totalTeclas = filas.reduce((n, f) => n + f.teclas.length, 0);
  const teclas = new InstancedMesh(geoTecla, tecla, totalTeclas);
  const aux = new Object3D();
  let z = -FO / 2 + 0.14, n = 0;
  for (const fila of filas) {
    const prof = fila.alto * PASO;
    const suma = fila.teclas.reduce((a, b) => a + b, 0);
    const escala = ANCHO_TECLADO / (suma * PASO);
    let x = -ANCHO_TECLADO / 2;
    for (const w of fila.teclas) {
      const ancho = w * PASO * escala;
      aux.position.set(x + ancho / 2, yCub + 0.004, z + prof / 2);
      aux.scale.set(ancho - HUECO, 0.008, prof - HUECO);
      aux.updateMatrix();
      teclas.setMatrixAt(n++, aux.matrix);
      x += ancho;
    }
    z += prof;
  }
  teclas.castShadow = true; teclas.receiveShadow = true;
  notebook.add(teclas);
  // Fondo oscuro del teclado (la ranura entre teclas)
  const fondoTeclado = new Mesh(rectRedondeado(-ANCHO_TECLADO / 2 - 0.02, ANCHO_TECLADO / 2 + 0.02, 0, z - (-FO / 2 + 0.14) + 0.04, 0.03), ranura);
  fondoTeclado.rotation.x = -Math.PI / 2;
  fondoTeclado.position.set(0, yCub, z + 0.02);
  notebook.add(fondoTeclado);

  // Trackpad con un borde fino más oscuro
  const tpAn = 1.3, tpFo = 0.7, tpZ = z + 0.07;
  const bordeTp = new Mesh(rectRedondeado(-tpAn / 2 - 0.008, tpAn / 2 + 0.008, 0, tpFo + 0.016, 0.06), ranura);
  bordeTp.rotation.x = -Math.PI / 2; bordeTp.position.set(0, yCub, tpZ + tpFo + 0.008);
  notebook.add(bordeTp);
  const trackpad = new Mesh(rectRedondeado(-tpAn / 2, tpAn / 2, 0, tpFo, 0.055), aluminioTrackpad);
  trackpad.rotation.x = -Math.PI / 2; trackpad.position.set(0, yCub + 0.0005, tpZ + tpFo);
  trackpad.receiveShadow = true;
  notebook.add(trackpad);

  // Tapa: gira desde la bisagra en el borde trasero
  const bisagra = new Group();
  bisagra.position.set(0, AL_BASE, -FO / 2 + 0.035);
  bisagra.rotation.x = -0.27;
  notebook.add(bisagra);
  const tapa = new Mesh(new RoundedBoxGeometry(AN, AL_TAPA, GR_TAPA, 6, 0.02), aluminio);
  tapa.position.set(0, AL_TAPA / 2 + 0.012, -GR_TAPA / 2);
  bisagra.add(tapa);
  const cilindro = new Mesh(new RoundedBoxGeometry(AN * 0.78, 0.05, 0.05, 4, 0.024), ranura);
  cilindro.position.set(0, 0.01, -0.02);
  bisagra.add(cilindro);
  const zFrente = 0.0004;
  const vidrioTapa = new Mesh(rectRedondeado(-AN / 2 + 0.015, AN / 2 - 0.015, 0.03, AL_TAPA - 0.005, 0.035), vidrioNegro);
  vidrioTapa.position.set(0, 0.012, zFrente);
  bisagra.add(vidrioTapa);
  const PAN_AN = 2.56, PAN_AL = PAN_AN / 1.6;
  const panel = new Mesh(new PlaneGeometry(PAN_AN, PAN_AL), materialPantalla(texNotebook));
  panel.position.set(0, 0.012 + 0.11 + PAN_AL / 2, zFrente + 0.0006);
  bisagra.add(panel);
  const camaraWeb = new Mesh(rectRedondeado(-0.012, 0.012, -0.012, 0.012, 0.012), negro);
  camaraWeb.position.set(0, 0.012 + AL_TAPA - 0.05, zFrente + 0.0007);
  bisagra.add(camaraWeb);

  sombras(notebook);
  teclas.receiveShadow = true;
  notebook.rotation.y = -0.42;          // la pantalla mira hacia el texto
  escena.add(notebook);

  // ---------- Teléfono (glTF) ----------
  const telefono = gltfTelefono.scene;
  const ESC_TEL = 1.85;
  // A la derecha del notebook, con aire entre ambos, para que no se confundan
  const TEL_X = 1.92, TEL_Z = 1.1, TEL_ROT = -0.36;
  telefono.traverse((o) => {
    if (!o.isMesh) return;
    if (o.name === 'group1808723591') o.visible = false;            // muesca que sobresale
    else if (o.material.name === 'mat23') { o.material = marcoTelefono; o.castShadow = true; }
    else o.visible = false;                                         // pantalla, íconos y barra del modelo
  });
  // El frente del cuerpo está en z = -0.011: vidrio negro, pantalla al ras e isla negra
  const vidrioTel = new Mesh(rectRedondeado(-0.167, 0.166, -0.443, 0.257, 0.046), vidrioNegro);
  vidrioTel.position.z = -0.0104;
  telefono.add(vidrioTel);
  const pantallaTel = new Mesh(rectRedondeado(-0.156, 0.155, -0.432, 0.246, 0.036), materialPantalla(texTelefono));
  pantallaTel.position.z = -0.0099;
  telefono.add(pantallaTel);
  const isla = new Mesh(rectRedondeado(-0.042, 0.041, 0.213, 0.236, 0.0115), negro);
  isla.position.z = -0.0094;
  telefono.add(isla);
  telefono.scale.setScalar(ESC_TEL);
  telefono.position.y = 0.448 * ESC_TEL + 0.002;
  const grupoTelefono = new Group();
  grupoTelefono.add(telefono);
  grupoTelefono.position.set(TEL_X, 0, TEL_Z);
  grupoTelefono.rotation.y = TEL_ROT;
  escena.add(grupoTelefono);

  // ---------- Sombra de contacto ----------
  // Huella de cada equipo dibujada en un canvas y difuminada: oscura justo en el borde
  // de apoyo y más suave alrededor. La escena no se mueve, así que se dibuja una sola vez.
  const SC = 6, SC_X = 0.35, SC_Z = 0.45, PX = 1024;
  function sombraContacto() {
    const c = document.createElement('canvas'); c.width = c.height = PX;
    const g = c.getContext('2d');
    const aPx = (x, z) => [((x - SC_X) / SC + 0.5) * PX, ((z - SC_Z) / SC + 0.5) * PX];
    function huella(cx, cz, ancho, fondo, rot, desenfoque, color, crecer) {
      g.save();
      g.filter = 'blur(' + desenfoque + 'px)';
      g.fillStyle = color;
      const [px, pz] = aPx(cx, cz);
      g.translate(px, pz);
      g.rotate(-rot);
      const w = (ancho + crecer) / SC * PX, h = (fondo + crecer) / SC * PX;
      g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, Math.min(w, h) * 0.08); g.fill();
      g.restore();
    }
    // Notebook: halo amplio + contacto definido
    huella(0, 0.05, AN, FO, -0.42, 48, 'rgba(70,46,28,.42)', 0.55);
    huella(0, 0.02, AN, FO, -0.42, 14, 'rgba(50,32,20,.55)', 0.12);
    // Teléfono parado: una franja fina y oscura en su base
    huella(TEL_X, TEL_Z + 0.02, 0.62, 0.14, TEL_ROT, 22, 'rgba(70,46,28,.45)', 0.3);
    huella(TEL_X, TEL_Z, 0.62, 0.1, TEL_ROT, 4, 'rgba(40,26,16,.55)', 0);
    const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace;
    const plano = new Mesh(new PlaneGeometry(SC, SC), new MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false }));
    plano.rotation.x = -Math.PI / 2;
    plano.position.set(SC_X, 0.0015, SC_Z);
    plano.renderOrder = 1;
    escena.add(plano);
  }
  sombraContacto();

  // ---------- Cámara ----------
  const camara = new PerspectiveCamera(24, 1, 0.1, 100);
  const objetivo = new Vector3(0.75, 0.9, 0.35);
  const posBase = new Vector3(-1.2, 1.75, 7.6);
  let ancho = 1, alto = 1;

  function ajustar() {
    ancho = contenedor.clientWidth || 1; alto = contenedor.clientHeight || 1;
    render.setSize(ancho, alto, false);
    camara.aspect = ancho / alto;
    // Los equipos ocupan la mitad derecha: se corre el encuadre hacia la izquierda
    const corrimiento = ancho >= 900 ? -0.23 : 0;
    camara.setViewOffset(ancho, alto, corrimiento * ancho, 0, ancho, alto);
    const factor = MathUtils.clamp(2.7 / camara.aspect, 1.5, 2.4);
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
  const guardada = new Vector3(), dir = new Vector3();
  function cuadro(ahora) {
    pendiente = false;
    let seguir = false;
    guardada.copy(camara.position);
    if (!quieto) {
      sx += (mx - sx) * 0.06; sy += (my - sy) * 0.06;
      const p = Math.min(1, (ahora - inicio) / ENTRADA), e = 1 - Math.pow(1 - p, 3);
      // la cámara llega desde un poco más lejos y más baja
      dir.copy(camara.position).sub(objetivo);
      const r = dir.length() * (1 + 0.12 * (1 - e));
      const ang = Math.atan2(dir.x, dir.z) + sx * 0.07;
      const elev = Math.asin(dir.y / dir.length()) - sy * 0.05 - 0.06 * (1 - e);
      camara.position.set(objetivo.x + r * Math.cos(elev) * Math.sin(ang), objetivo.y + r * Math.sin(elev), objetivo.z + r * Math.cos(elev) * Math.cos(ang));
      seguir = p < 1 || Math.abs(mx - sx) > 0.001 || Math.abs(my - sy) > 0.001;
    }
    camara.lookAt(objetivo);
    render.render(escena, camara);
    camara.position.copy(guardada);
    if (seguir) pedirCuadro();
  }

  new ResizeObserver(ajustar).observe(contenedor);
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible) pedirCuadro(); }).observe(contenedor);

  contenedor.appendChild(lienzo);
  ajustar();
  // Primer cuadro dibujado: recién ahí se muestra el lienzo (la foto queda debajo hasta entonces)
  await new Promise((ok) => requestAnimationFrame(() => { camara.lookAt(objetivo); render.render(escena, camara); ok(); }));
  inicio = performance.now();
  pedirCuadro();
  return { lienzo, render };
}
