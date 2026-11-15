# Catálogo de animaciones y transiciones para scroll storytelling

Vocabulario común para pedir, diseñar y revisar movimiento. Cada entrada: **qué es · cuándo usarla · cómo se hace · riesgo**.

---

## 1. Cómo se relaciona la animación con el scroll (los 4 "motores")

| Motor | Qué es | Herramienta |
|---|---|---|
| **Disparada (trigger)** | Al entrar un elemento en pantalla, se reproduce una animación con duración propia. El scroll solo la "enciende". | ScrollTrigger `toggleActions`, IntersectionObserver |
| **Scrub (atada al scroll)** | El progreso de la animación = la posición del scroll. Scroll atrás = animación atrás. | ScrollTrigger `scrub: true` o `scrub: 1` (con suavizado) |
| **Pin (fijado)** | La sección se queda fija mientras el scroll avanza una timeline dentro de ella. Es la base del storytelling. | ScrollTrigger `pin: true`, `end: "+=300%"` |
| **Snap** | Al soltar el scroll, se acomoda al beat más cercano. | ScrollTrigger `snap`, CSS `scroll-snap` |

Bonus: **CSS Scroll-Driven Animations** (`animation-timeline: scroll()/view()`) — nativo, sin JS, corre fuera del hilo principal. Ideal para efectos simples (barra de progreso, reveals). Soporte: Chrome/Edge/Safari 26+; Firefox con flag → usar con fallback.

---

## 2. Revelado de contenido (entradas)

| Nombre | Descripción | Uso ideal | Riesgo |
|---|---|---|---|
| **Fade up** | Opacidad 0→1 + sube 16–40 px | Párrafos, tarjetas | El cliché #1. Usar con moderación |
| **Blur-in / Focus pull** | Blur 10px→0 + opacidad | Titulares, sensación cinematográfica | Blur es caro; solo en elementos pequeños |
| **Mask reveal / Wipe** | `clip-path: inset()` que se abre en una dirección | Imágenes hero, titulares | Muy premium, barato en GPU |
| **Curtain** | Un bloque de color cubre y descubre | Cambio de capítulo | Puede sentirse lento si dura > 0,8 s |
| **Scale-in** | 0.92→1 + opacidad | Productos, modales | Evitar desde 0 (se ve barato) |
| **Stagger** | Elementos de un grupo entran escalonados (30–80 ms) | Listas, grillas, letras | Stagger largo = espera; tope ~600 ms total |
| **Line draw** | Un trazo SVG se dibuja | Diagramas, firmas, rutas | DrawSVG o `stroke-dashoffset` |
| **Counter / Roll-up** | Números que cuentan hasta su valor | Cifras de prueba | Solo con datos reales |
| **Iris / Circle reveal** | `clip-path: circle()` que crece | Transición a nueva escena | Centrarlo en el foco de atención |

## 3. Tipografía cinética

| Nombre | Descripción | Herramienta |
|---|---|---|
| **Split reveal** | Texto dividido en líneas/palabras/letras que entran por máscara | GSAP SplitText (`mask: "lines"`) |
| **Scrub highlight** | Las palabras pasan de gris a color mientras se hace scroll ("leer con el scroll") | SplitText + scrub |
| **Scramble / Decode** | Letras aleatorias que se resuelven en el texto final | ScrambleTextPlugin |
| **Variable font morph** | Cambia peso/ancho de una fuente variable con el scroll | `font-variation-settings` (ojo: provoca layout; usar en textos cortos) |
| **Marquee / Ticker** | Texto infinito horizontal, velocidad ligada al scroll | GSAP `horizontalLoop` helper |
| **Big type zoom** | Una palabra gigante escala hasta que su letra se vuelve el fondo de la siguiente escena | Scale + pin; vía SVG mask para nitidez |

## 4. Profundidad y espacio

| Nombre | Descripción | Riesgo |
|---|---|---|
| **Parallax** | Capas se mueven a distintas velocidades | Máx. 2–3 capas; diferencias sutiles (10–30 %) |
| **Multiplane** | Parallax de muchas capas recortadas tipo Disney | Muy caro de producir assets; impactante |
| **Dolly / Zoom-through** | La "cámara" avanza a través de la escena, atravesando una ventana o letra | Clásico de transición entre capítulos |
| **Tilt 3D / Perspective** | Elementos rotan en 3D según scroll o puntero | `transform: perspective()`; sutil (< 15°) |
| **Depth of field** | Primer plano y fondo desenfocados según foco narrativo | Solo en WebGL o imágenes pre-renderizadas |
| **Sticky stack** | Tarjetas fijadas que se apilan una sobre otra | Patrón muy limpio para pasos/servicios |

## 5. Transiciones entre escenas / capítulos

| Nombre | Descripción |
|---|---|
| **Cross-fade** | Una escena se disuelve en la otra. Seguro, neutro. |
| **Match cut** | Un elemento de la escena A coincide en forma/posición con uno de la B y se transforma en él. El más cinematográfico. |
| **Shared element / FLIP** | Un elemento "viaja" de un layout a otro (miniatura → hero). GSAP Flip, View Transitions API. |
| **Morph** | Una forma SVG se convierte en otra. MorphSVGPlugin. |
| **Wipe direccional** | Una escena barre a la otra (horizontal, vertical, diagonal). |
| **Zoom-through** | Se entra a la siguiente escena atravesando un objeto. |
| **Color flood** | El color de fondo cambia y "inunda" la siguiente sección. Muy económico y efectivo. |
| **Horizontal scroll section** | Scroll vertical se traduce a movimiento horizontal dentro de un pin. Indicar visualmente que es horizontal. |
| **Displacement / Liquid** | Transición WebGL con mapa de distorsión entre dos imágenes. |
| **Pixelate / Dissolve shader** | Transición por shader (ruido, píxeles, gradiente). Premium, requiere WebGL. |
| **View Transitions API** | Transiciones nativas entre páginas/estados (`document.startViewTransition`). Para multipágina. |

## 6. Imagen y video ligados al scroll

| Nombre | Descripción | Notas |
|---|---|---|
| **Image sequence scrub** | Canvas que dibuja el frame N según el scroll (estilo Apple) | La técnica más fiable para "video" scrub. 120–240 frames |
| **Video scrub** | `video.currentTime` ligado al scroll | Requiere codificación all-intra (`-g 1`) o se traba |
| **Ken Burns** | Zoom/paneo lento sobre foto fija | Barato y elegante; ideal en fallback de reduced-motion (con menos movimiento) |
| **Before / After** | Un divisor revela el antes y después con scroll | Prueba visual de transformación |
| **Cinemagraph** | Foto con una sola zona en movimiento (loop) | Generado con IA o ffmpeg + máscara |
| **Clip-path video** | Video dentro de una forma/tipografía que crece | Muy premium |

## 7. 3D / WebGL (modo B)

| Nombre | Descripción |
|---|---|
| **Camera rail** | La cámara recorre una curva (CatmullRom) según el scroll. Base de los "scroll worlds". |
| **Orbit reveal** | La cámara orbita un producto mostrando sus caras por beat. |
| **Exploded view** | Las piezas de un objeto se separan para explicar su mecanismo. |
| **Material / lighting shift** | Cambia la hora del día, el material o la atmósfera por capítulo. |
| **Particles / Points morph** | Partículas que forman un objeto, luego otro (logo → producto). |
| **Shader backgrounds** | Gradientes vivos, ruido, fluidos como fondo ambiental. |
| **Postprocesado** | Bloom, grano de película, aberración cromática, viñeta. Dosificar: el grano unifica, el resto cansa. |

## 8. Microinteracciones (acompañan, no protagonizan)

Cursor personalizado / magnético · hover con máscara o desplazamiento · botones con spring · barra de progreso de lectura · indicador de capítulo · preloader con conteo real de carga.

---

## 9. Easing (la "personalidad" del movimiento)

| Curva | Sensación | Uso |
|---|---|---|
| `power2.out` / `expo.out` | Llega rápido y frena suave | **Entradas** (el 80 % de los casos) |
| `power2.in` | Arranca lento y acelera | **Salidas** |
| `power3.inOut` / `expo.inOut` | Cinematográfico, simétrico | Transiciones de escena, cámara |
| `none` (lineal) | Mecánico | **Solo** scrub (el scroll ya es el easing) y loops continuos |
| `back.out(1.4)` | Pequeño rebote | UI juguetona; evitar en marcas serias |
| Spring (física) | Natural, interrumpible | Gestos, drag, hover — ver `apple-design` |
| `CustomEase` | Curva propia de la marca | Definir 1–2 en `motion/tokens.js` |

## 10. Duraciones de referencia

- Microinteracción: 120–200 ms
- Entrada de elemento: 400–700 ms
- Transición de escena (disparada): 800–1200 ms
- Stagger entre ítems: 30–80 ms
- En scrub no hay duración: hay **distancia de scroll** (0,7–1,8 vh por beat).

## 11. Coreografía (cómo combinar)

1. **Un protagonista por momento.** Lo demás espera o acompaña.
2. **Jerarquía temporal**: fondo → titular → cuerpo → detalle.
3. **Dirección coherente**: si la historia avanza hacia la derecha/abajo/adentro, todo entra en esa dirección.
4. **Solapamiento**: la siguiente animación empieza antes de que termine la anterior (`"<0.2"` en timeline) — evita la sensación robótica.
5. **Contraste de ritmo**: alternar beats densos con un beat de respiro (imagen grande, poco texto).
6. **La salida importa**: diseñar cómo se va cada elemento, no solo cómo llega (al hacer scroll atrás también se ve).

## 12. Cómo pedir un efecto (plantilla)

> En el beat **[id]**, cuando **[disparador: entra / scrub / pin de X vh]**, **[elemento]** hace **[tipo del catálogo]** con **[easing]** en **[duración o distancia]**. En reduced-motion: **[alternativa]**.

Si no conoces el nombre de algo que viste en otra web, descríbelo y usa la skill `animation-vocabulary`.
