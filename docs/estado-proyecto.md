# Estado del proyecto · 2026-11-18

> **Versión móvil: hero y servicios (2026-11-18)**: nuevo archivo `css/movil.css`, cargado **al final** (gana la cascada) y con todo
> dentro de `@media (max-width:899px)`. Solo se adaptaron el hero y servicios; el resto sigue genérico.
> - Causa del problema principal: los chips del hero medían más que la pantalla y ensanchaban todo el documento (602 px en un móvil de
>   390), con lo que la cabecera se estiraba y el botón «Cotizar» y el «Menú» quedaban fuera de pantalla. Ya no hay desborde en 320, 360,
>   390, 412 ni 768 px.
> - Chips «qué desarrollamos»: 2 columnas × 3 filas, solo ícono + nombre (sin la frase corta), alto táctil ≥ 46 px.
> - Notebook del hero: la foto se recorta sobre el equipo (`--w:192cqw`, `left:-84.5cqw`, `top:-24cqw`) y la pantalla animada se ve entera;
>   el rótulo («Cotizador en línea…») va centrado a casi todo el ancho y puede pasar a 2 líneas. La animación y la proyección `matrix3d`
>   no se tocaron (hero.js mide `esc.clientWidth`).
> - Transición «¿Basta con tenerlo?»: en móvil `min-height:0` (dejaba un hueco vacío de ~330 px). Está fuera de las dos secciones; es una regla
>   y se puede quitar de `movil.css`.
> - Servicios: ritmo más compacto y interlineado de títulos más holgado.
> - **Orden del hero en móvil (pedido del usuario)**: 1º notebook (a sangre bajo la barra), 2º título, subtítulo y botón, 3º chips al final.
>   Se logra con `.hero{display:flex;flex-direction:column}` y `.hero-texto{display:contents}` + `order`, sin tocar el HTML del hero.
> - **Orden del hero en móvil (revisado)**: 1º título y subtítulo, 2º notebook, 3º chips (antes el notebook iba primero). Así el mensaje se lee
>   antes que la imagen y el rótulo que vuela a su chip hace un trayecto corto (~120 px). El notebook ya no ocupa el espacio bajo la barra, por lo
>   que gana altura. Umbral de pantalla baja: 835 px (se ocultan la etiqueta superior, solo a la vista, y «Ver trabajos →»; queda «Proyectos» en el menú).
> - **Texto del hero centrado en móvil** (`.hero-texto{text-align:center}`; los chips mantienen su texto a la izquierda; la etiqueta lleva `padding-left:.22em` para compensar su espaciado de letras).
> - **Móvil: sin «Ver trabajos» ni «Cotizar» de la barra (pedido del usuario)**: `.hero-acciones{display:none}` y `.btn-wa-nav{display:none}` bajo 900 px.
>   Los trabajos quedan en el menú («Proyectos», probado: lleva a la sección y cierra el menú); WhatsApp, en el botón circular flotante. En escritorio no cambia.
>   El notebook se centra en un punto medio (eje al 73 % de la foto: la tapa, 76 %, y el equipo entero, 70 %, quedan a igual distancia del centro); el borde derecho de la foto se funde con una máscara.
>   La zona del notebook no crece más de lo que ocupa el equipo (`88px + 57.7vw`); el sobrante queda entre el subtítulo y el notebook.
>   Umbral de pantalla baja (etiqueta superior oculta solo a la vista): 780 px de alto.
> - **Hero = una pantalla completa en móvil**: `.hero{min-height:100svh}`. En móvil se oculta el botón rectangular «Cotizar por WhatsApp» del hero
>   (sobra con el botón flotante; en escritorio sigue). El notebook se escala por ancho o por alto (`--w:max(167cqw,min(192cqw,…))`) y su alto sale de
>   `100svh − 76px (zona del botón) − --bloque` (altura medida del texto, que crece algo con el ancho). Los chips quedan abajo (`margin-top:auto`).
>   En pantallas de ≤ 790 px de alto la etiqueta «Desarrollo web y apps · Chile» se oculta solo a la vista (sigue en el HTML) para que quepa todo.
>   Medido: el hero mide exactamente el alto de pantalla en 360×740, 360×800, 390×750, 390×780, 390×844, 412×800, 412×915 y 430×932, y el botón
>   flotante no tapa ningún chip. Por debajo de ~720 px de alto el hero es algo más alto que la pantalla (los chips asoman al desplazar).
>   Ojo: `.hero` heredaba `align-items:center` de escritorio; en móvil va `stretch`.
> - **Botón flotante de WhatsApp (solo móvil)**: `<a class="wa-flotante" data-whatsapp>` al final del `<body>`; círculo de 58 px fijo abajo a la
>   derecha (respeta `safe-area-inset-bottom`), verde profundo `--wa` con ícono blanco (contraste AA), entrada suave solo con movimiento
>   permitido. En escritorio está oculto (`display:none`). El pie tiene aire extra para que no tape contenido. `main.js` le asigna el enlace.
> - Verificado: escritorio (1440 px) con 0 diferencias de estilo; las demás secciones en móvil con 0 diferencias; todos los elementos
>   táctiles de cabecera, hero y servicios ≥ 44 px; la animación de chips se enciende también en móvil; 0 errores de consola.
> - **Pendiente**: la sesión corrió en la nube y no pudo leer `C:\dev\Skills_rep\INDEX.md`; no se aplicaron las skills de diseño del
>   proyecto (`high-end-visual-design`, `premium-web-design`, `apple-design`). Revisar el resultado con ellas desde el PC y medir fps en un
>   móvil real. Revisión hecha solo con Chrome sin ventana (sin GPU).

> **Limpieza de código y archivos (2026-11-18)**: `sitio/` pasó de 184 MB a 2,4 MB sin cambiar nada de lo que se ve ni se hace
> (comparado con la versión anterior: estilos calculados idénticos, misma estructura del relato, mismas 44 peticiones).
> - **CSS** dividido en `css/` (`base`, `demos`, `relato`, `hero-notebook`, `relato-apps`, `refinamientos`, `lenis`), cargados en ese
>   orden (el orden importa: hay capas que se sobrescriben). Se eliminó el CSS sin elementos (antigua maqueta 3D, hero con video,
>   reproductor del iPad, notificaciones del iPad): 2.186 → ~1.550 líneas.
> - **JS**: `main.js` 640 → 104 líneas (se quitó el hero con video y el recorrido 3D, que no tenían elementos en el HTML);
>   `relato.js` sin el bloque de video (el HTML no tiene `<video>`). Se quitó la maqueta 3D, `pruebas/`, `previews/` y las dependencias.
> - **Assets**: se quitaron los videos del hero y del relato (29 MB, nunca se pedían), cuadros sobrantes e imágenes sin uso.
>   Los dos PNG pesados pasaron a WebP.
> - Si se vuelve a un relato con video, hay que reponer `<video class="relato-film">` y el reproductor: están en el historial de git.
> - Ojo al limpiar CSS: algunas clases las crea el JS (`rr-q--*` sale de `rg-quien--*`) o las librerías (`lenis*`); no borrarlas por «no estar en el HTML».

> **Ícono protagonista del relato (2026-11-16)**: cada capítulo muestra su ícono grande (círculo blanco, ~56 px) junto a
> «Capítulo N de 6 · Canal», con entrada de rebote. Al terminar el capítulo (tras leer «Cómo lo logramos»), el ícono vuela en
> curva con estela fina hasta su botón del índice (que late al recibirlo). Solo en reproducción continua: con pausa, saltos o
> botones anterior/siguiente no hay vuelo. Medido en Chrome sin ventana: 142 fps durante el vuelo, sin errores de consola.
> Decisión del usuario: el índice (íconos y controles) está **abajo a la izquierda** (antes arriba) para no repetir el logo junto al ícono
> grande; el vuelo baja en curva por el margen izquierdo y la pista se abre hacia arriba. Medido otra vez: 142 fps.
> Ajuste de altura: el bloque del capítulo se **centra verticalmente** entre la barra superior y el índice (flex, `safe center`) y la
> tipografía se adapta a la altura de la pantalla (`vh`, con reglas para <800 px y <700 px). Probado sin encimarse con el índice en
> 1280×680, 1440×740, 1440×900, 1920×1080 y 2560×1300.
> Centrado horizontal: el texto, el ícono y el índice quedan centrados en el sector crema (de 0 al borde de la foto, `--col2-izq`),
> con márgenes iguales a izquierda y derecha en 1440, 1920 y 2560 de ancho; la pista del índice también va centrada.
> Código: `vuelo`/`lanzarVuelo` en `sitio/js/relato.js`; estilos `.rg-ico`, `.rg-vuelo` en `css/relato-apps.css` y `css/refinamientos.css`.

> **Ajustes de marca y contacto (2026-11-16)**: WhatsApp configurado (+56 9 5225 5580, en `sitio/js/config.js`);
> marca "Agencia KAI" en el título y el pie; la sección `#precios` pasó a `#cotizacion` ("Cotización", sin montos,
> solo cotización a medida); textos reescritos en plural ("nosotros") para hablar como agencia. El dominio se define al final.

> **Relato y hero actuales (hechos en la rama `relato-panel`, carpeta `C:\dev\Personales\Agencia_web-panel`; ya en main)**:
> relato **sin video**. El usuario lo pidió porque el video, el reproductor y las notificaciones abrumaban.
> Descartado: un panel inventado ("se ve muy falso").
> **iPad = apps reales del dueño** (elección del usuario). Cada acción del cliente llega donde la vería el dueño:
>   - Google (constructora) → Google Analytics en tiempo real: sube usuarios activos, `google` y la página Proyectos.
>   - Maps (minimarket) → Perfil de Empresa: sube Solicitudes de indicaciones (41→42) e interacciones.
>   - Reseña → Perfil de Empresa: aparece la reseña de María con "Responder" (128→129).
>   - WhatsApp (kinesiología) → WhatsApp Business: Camila entra a la lista y se abre su chat.
>   - ChatGPT → Analytics de kinesiologiavital.cl: nueva fila `chatgpt.com` (GA4 sí registra esas visitas).
> La app anterior queda en pantalla mientras el cliente actúa y cambia justo antes del resultado.
> **Foco**: un velo crema (`.relato-velo`) cubre al dispositivo que no habla; solo se anima su opacidad.
> El título de cada escena es un subtítulo centrado bajo los dispositivos. Medido en Chrome visible: 142 fps;
> queda un cuadro de 132 ms al aparecer el escenario. `relato.js` funciona con o sin video.
> **Integrado en main el 16-11-2026** (el usuario aprobó "Sí, a main"): main avanzó al commit de esta rama, sin mezcla.
> **Ronda 2 ("versión rápida", mismas fotos)**: diálogo en dos escenas. En la **reseña**, baja un aviso de iPadOS,
> el dueño lo toca, responde y publica, y María ve en su iPhone "Minimarket Buen Vecino respondió a tu reseña".
> En **WhatsApp**, baja el aviso, se abre el chat, el dueño responde "Tengo a las 17:30", Camila lo recibe,
> contesta "¡Sí, por favor!" y el dueño lo ve. Google, Maps e IA quedan como "solo mirar o aviso".
> Ritmo más lento: `TOTAL` 21,4 y escenas en 0,75 · 3,4 · 6,3 · 10,8 · 15,7. El foco sigue los turnos de habla.
> iPadOS: letra Inter dentro de los equipos, barra de estado con fecha, wifi y %, indicador de inicio, avisos
> que se tocan, Perfil de Empresa dentro de Safari y riel lateral en WhatsApp Business.
> Equipos "apoyados": iPad girado -7° en Y, iPhone inclinado -2,5° y sombras de contacto.
> Medido en Chrome visible: 143 fps; sigue un cuadro de 160 ms al aparecer el escenario.
> **Ronda 3 (explicación paso a paso, aprobada por el usuario)**:
>   - Columna izquierda `.relato-guion` sobre una franja crema, con un capítulo por canal y tres pasos cada uno
>     (Te encuentran en Google · Llegan a tu local · Te recomiendan · Te escriben directo · La IA te recomienda).
>     Cada paso dice quién actúa (Tu cliente / Tu negocio / Los dos) y el anterior queda atenuado.
>     Reemplaza a los subtítulos pequeños y a las etiquetas "Tu cliente / Tu negocio".
>   - Índice arriba con los 5 íconos alineados; se enciende el capítulo en curso.
>   - Equipos juntos a la derecha: iPad atrás y iPhone delante, apenas sobre su esquina.
>   - Google: búsqueda "constructora en curicó" con varias constructoras; KAI destaca con foto y el cliente la toca.
>   - Ritmo: `ENTRADA_APP` 0,75 · 3,8 · 7,0 · 12,1 · 17,5; `PASOS` en relato.js; `TOTAL` 23,6 (unas 42 pantallas).
>   - Al final, "Vuelve a ver un paso": 5 botones que saltan al inicio de cada capítulo (`data-repetir`).
>   - Medido en Chrome visible: 143 fps; sigue un cuadro de ~160 ms al aparecer el escenario.
> **Ronda 4**:
>   - El índice (`nav.relato-indice`, botones) tiene tres estados: gris = viene, oscuro y algo más grande = en curso,
>     en color = ya pasó. Queda encima del cierre y al final muestra "Toca un paso para volver a verlo".
>     Cada botón salta a su capítulo (`data-repetir`). Se quitó la fila duplicada del cierre.
>   - Dos espacios a la derecha (`.relato-zona--cliente` / `--negocio`) con su rótulo. El iPhone y un iPad más chico
>     van centrados en cada uno. El rótulo y el espacio de quien no habla se atenúan.
>   - Medido en Chrome visible: 142 fps; sigue el cuadro de ~160 ms al aparecer el escenario.
> **Ronda 5**: explicación más angosta (`min(23vw,390px)`) e índice solo con íconos (el nombre va en `title`/
> `aria-label`). El espacio del cliente se ensancha a 21vw y los dos equipos quedan más grandes.
> **Ronda 6**: sin la foto de fondo, como algo provisorio hasta tener la foto. Tres columnas planas de borde a borde:
> explicación (#f4ebe2), cliente (#eadccd) y negocio (#dccbb8), con una línea divisoria fina.
> La columna de quien no habla se atenúa.
> **Ronda 7 (fotos reales)**: `assets/img/relato-cliente.webp` (mano con iPhone, living) y `relato-negocio.webp`
> (iPad en soporte sobre un mesón de almacén), generadas por el usuario en ChatGPT. Cada foto cubre su columna, y
> `colocarFotos()` en relato.js calcula dónde queda el blanco de cada pantalla (medido en px de la foto: iPhone
> 319,333 · 394×840 · radio 48; iPad 116,435 · 891×600 · radio 18) y lo deja en `--f-cliente-*` / `--f-negocio-*`.
> Sin carcasas CSS ni inclinación; las pantallas solo aparecen con un fundido. La foto del iPad tiene fondo de
> almacén: sirve como "tu negocio" genérico; más adelante podría haber una por rubro.
> **Arreglo (16-11)**: al subir desde el relato quedaba una pantalla crema vacía (la frase de la introducción
> se iba antes de que apareciera el escenario). Ahora la frase se queda y el escenario se funde sobre ella
> (marco con autoAlpha en 0,12). El hero queda fijado 1,7 pantallas.
> Además, la capa «intro-recorrido» tapaba los botones del hero, aunque no se viera:
> `.hero .intro-recorrido{pointer-events:none}`. **Main tiene el mismo bloqueo de clics**: corregirlo al integrar.
> **Apps a medida (16-11, recomendación aprobada)**: en el hero, un rótulo bajo el notebook (`.hs-rotulo`) cambia con
> cada pestaña: Cotizador en línea · Carro de compras · Agenda de horas (se anima en `pestana()` de js/hero.js).
> En el cierre del relato, el puente `.relato-puente`: "Y cuando llegan, tu sitio puede cotizar, vender o agendar
> por ti" + enlace "Ver qué desarrollamos" a #servicios. El marketplace se deja para servicios ("plataformas a
> medida"). Los chips del hero se cambiaron (aprobado) a "qué desarrollamos" (`ul.chips-desarrollo`):
> Sitio web · Cotizador · Tienda online · Reservas · Plataformas a medida (marketplace, intranet y más), con
> íconos nuevos `ico-calendario` e `ico-capas` en el sprite. Los 5 canales quedan solo en el relato.
> **Chips que se ganan (aprobado)**: los chips de "qué desarrollamos" empiezan apagados (clase `coleccion`).
> Sitio web se enciende con la primera página (0,6 s). Tras cada demostración, el rótulo de la pestaña vuela en
> curva con una estela fina hasta su chip y lo enciende (`volar()` en js/hero.js; Cotizador 4,6 · Tienda 10,6 ·
> Reservas 16,6). Plataformas a medida se enciende al final (18,25). Si el hero se repite, lo encendido sigue
> encendido; con "reducir movimiento" están todos encendidos desde el inicio.
> El prototipo `pruebas/hero-sitios.html` NO tiene el rótulo todavía.
> **Arreglos (16-11)**: (1) a veces las pantallas del iPhone y del iPad perdían las esquinas redondeadas (Chrome no
> recorta capas animadas con border-radius + overflow): ahora llevan `clip-path: inset(0 round …)`. (2) El notebook
> del hero se corrió a la derecha (`--corre:4.5cqw` en `.hs-esc`) y el bloque de chips quedó en
> `max-width:min(700px,40vw)`, para que no se toquen (revisado a 1366, 1600 y 1920 de ancho).
> **Constructora: estimación referencial (aprobado)**: tras "Enviar cotización" aparece `.hs-estimacion` con 4 partidas
> de ejemplo, el total "$229.000.000 aprox.", la nota "Valores referenciales… Sujeto a visita técnica." y el botón
> "Solicitar cotización formal" (el cursor lo toca y sigue "¡Solicitud enviada!"). En js/hero.js se usa
> `tl.shiftChildren(2.1, true, 3.9)` para correr el resto. En el sitio no se promete una "API": se habla de
> "precios de proveedores actualizados". La estela de los vuelos mide solo lo que ocupa la curva (antes, al ser
> de pantalla completa, costaba un cuadro de 83 ms).
> **Chips en dos filas y con color (pedido del usuario)**: `.chips-desarrollo` usa una grilla de 3 columnas (3 + 2)
> y la letra baja un poco en pantallas chicas. Cada chip tiene su color (`--c`): Sitio web azul, Cotizador naranjo,
> Tienda dorado, Reservas turquesa y Plataformas violeta apagado. Encendido = ícono lleno de su color + borde suave.
> Ya no se tocan con el notebook: revisado a 1366, 1600 y 1920 de ancho (distancia mínima ~30 px a 1366).
> **Pregunta y respuesta (aprobado)**: la introducción dice "Ya tienes tu sitio. / ¿Basta con *tenerlo*? / No. Un sitio
> que nadie encuentra no trae clientes. Te mostramos, paso a paso, cómo hacemos que te encuentren." Cada capítulo
> del relato termina con una caja `.rg-como` "Cómo lo logramos" (indexación en Google con Search Console y mapa del
> sitio · Perfil de Empresa verificado · enlace para pedir reseñas · botón de WhatsApp con mensaje listo y WhatsApp
> Business · datos estructurados y preguntas frecuentes para la IA). Cada capítulo dura 0,5 más:
> ENTRADA_APP 0,75 · 4,3 · 8,0 · 13,6 · 19,5; cierre en 23,0; TOTAL 25,6.
> **Rótulo del hero (aprobado)**: centrado bajo el notebook, con una barra de 3 tramos que se llena mientras dura
> cada demostración (colores de los chips), un título que entra desde abajo con recorte y su frase. El vuelo a los
> chips sale desde ese título. El prototipo `pruebas/hero-sitios.html` NO tiene estos cambios.
> **Altura (16-11)**: en escritorio el navbar quedó a tope, arriba y a los lados (barra completa, `--nav-h:64px`), y la
> columna de explicación ajusta sus medidas a la altura (vh). La caja "Cómo lo logramos" cabe con aire en 1366×768,
> 1600×800, 1600×900 y 1920×1080 (peor caso: sobran 83 px). El rótulo del hero se sacó de `.hs-esc` y quedó anclado
> al borde inferior del hero (`.hero-media>.hs-rotulo`), así no se corta en pantallas bajas.
> **Hero centrado en altura (16-11)**: las medidas de la foto se definen en `.hs-hero .hero-media` (--wf, --hf, --topf).
> La foto se ubica para que el notebook (28,6 %–85,3 % del alto de la foto) y su rótulo queden centrados bajo el
> navbar; si queda una franja abajo, se rellena con el color del mesón (#d6c4b2) y la foto se funde con una máscara.
> El ancho no cambió. Medido: el texto y el grupo del notebook quedan centrados ±8 px en 1366, 1600 y 1920.
> **Capítulo 6 · Instagram (aprobado)**: perfil de Constructora KAI en el iPhone (ícono "Notas" → Instagram), con un
> pequeño scroll por las obras (cuadros del video) y un toque en "Ver sitio web". En el iPad vuelve el Analytics de la
> constructora: instagram.com 1→2 y usuarios 3→4→5 (cifra con tercer número, `data-escena2`). Hay 6 botones en el índice
> y los capítulos dicen "de 6". TOTAL 29,8; cierre en 27,2.
> **Introducción con motion graphics (aprobado)**: `.ib` dentro de `.intro-recorrido` (clase `.ib-activo`; el texto
> original queda para lectores de pantalla). El hero queda fijado 4,6 pantallas: "Ya tienes tu sitio." + ventana de
> sitio → "¿Basta con tenerlo?" palabra a palabra → la pregunta sube, entra "No." y el sitio se pierde entre puntos
> (canvas) → 6 canales unidos al sitio + "Te mostramos…" → los canales vuelan a su botón del índice y el escenario del
> relato aparece en el mismo lugar. Medido: la introducción no tiene cuadros lentos.
> **Saltar / leer en resumen (aprobado)**: `aside.relato-saltar`, fijo. Al comenzar la introducción aparece abajo al centro
> ("Animación explicativa · ~1 min de scroll" + Saltar + Leer en resumen); dentro del relato se reduce a "Saltar" en la
> esquina. Saltar lleva al cierre (27,6 de la línea de tiempo). El resumen es un `<dialog>` con pestañas: un capítulo
> a la vez, sin scroll (3 pasos + "Cómo lo logramos"), con flechas del teclado, Anterior/Siguiente y Esc para cerrar.
> El contenido se arma desde los textos de la columna de explicación (una sola fuente). Probado a 1366×768, 1600×800 y 1920×1080.
> **Reproducción automática (16-11, en main sin commit; elegida por el usuario)**: el relato ya NO va ligado al scroll ni
> se fija. Es una sección de una pantalla: al llegar parte el capítulo 1 y cada capítulo se reproduce solo (VEL 1,4 s
> por unidad de la línea de tiempo), con una espera de 3,6 s para leer "Cómo lo logramos" antes del siguiente; tras el
> 6 aparece el cierre. Controles junto a los íconos: ‹ · Pausar/Reproducir · ›. En pausa, el capítulo elegido se
> muestra completo. Se pausa si la sección sale de pantalla. Se quitaron el aviso "Saltar" y el modo lectura; el
> resumen por pestañas queda en el botón del cierre. La introducción ahora dura 3 pantallas.
> **Fijación y bloqueo (16-11)**: la sección se fija 2 pantallas (`fijacion` en relato.js) y, mientras la animación está
> en curso, NO deja bajar a Servicios (`sujetar` devuelve el scroll al inicio de la fijación y hace latir "Saltar
> animación"). Se libera ~2,5 s después de saltar (o del final natural), cuando el aviso pasa a minimalista, o con un enlace del menú. Subir siempre
> se puede. Se quitó el freno de 0,9 s.
> **Saltar animación (16-11, corregido)**: el usuario NO quiere que saltar lleve a otra parte. "Saltar animación" detiene
> la reproducción y deja la persona en la sección con el capítulo 1 completo, el aviso "Recorre la solución paso a paso
> con estos botones" y los íconos latiendo; íconos y ‹ › muestran cada capítulo completo (sin reproducir). El botón
> pasa a "Continuar ↓": SOLO Continuar (o el menú) libera el paso y lleva a Servicios. El final natural muestra el
> cierre y "Continuar", pero tampoco libera solo. Arreglo: los vuelos del hero no despegan si el hero no está a la vista.
> **Sin "Continuar" (16-11)**: tras saltar, el botón desaparece; el aviso destacado dura ~2,5 s con el scroll bloqueado y
> luego el scroll queda libre (`liberarTrasAviso`). Igual cuando la animación termina sola.
> **Memoria de la visita**: si ya saltó la animación, al volver a la sección (subiendo hasta la intro y bajando de nuevo)
> NO se reinicia: queda en el capítulo y el modo lectura en que la dejó, con el paso libre. Solo en memoria de la
> página: al recargar, todo parte de cero. Al subir a la intro se oculta el escenario para que la intro se vea limpia.
> **Aviso minimalista y vuelta "cargada" (16-11)**: "Recorre la solución paso a paso con estos botones" es ahora texto
> que aparece destacado (píldora negra ~2,5 s, invita al recorrido) y luego queda permanente como texto minimalista (clase `.pista-aviso`, al saltar, al llegar al cierre y al
> volver). Al volver a la sección (desde abajo u arriba) ya vista o saltada, se muestra el capítulo 1 completo, nunca el
> cierre (`volverCargada`). En el cierre, "Continuar" va a la esquina para no tapar "Leer los 6 capítulos".
> **Sin rebobinar (16-11, pedido del usuario: "al volver ninguna animación debería hacer rewind")**: la intro ya no usa
> scrub; su fijación es un ScrollTrigger aparte que mueve `entrada` solo hasta que se llega al relato (`introVista`).
> Después queda congelada en su cuadro final (4,45: canales + "Te mostramos…") y al subir solo se difumina entera.
> El relato nunca se reinicia al subir (solo se oculta el escenario) y al volver queda en el cuadro final del capítulo
> en que iba (o del 6 si había llegado al cierre). El hero ya no se repite al volver a él (sí al pasar el mouse).
> **Transiciones sí, en ambos sentidos**: aunque el contenido no se repite, el paso intro ↔ escenario se anima con el
> scroll: en el último 20 % de la fijación de la intro, su contenido (`.ib`) se funde mientras aparece el escenario
> (`marco`), con el fondo crema de la intro sólido para que no se trasluzca el hero. Igual al subir. El resumen por pestañas se abre con "Leer en resumen" y con el botón del cierre
> "Leer los 6 capítulos en resumen" (`.relato-leer-btn`). El logo KAI del navbar siempre lleva arriba del todo (js/main.js).
> **Chip "Todo dispositivo" (16-11)**: sexto chip del hero ("Celular, tablet y computador", ícono `ico-dispositivos`, color
> #1f8a70); los chips quedan 3 + 3. Se enciende al final (20,85 s), después de Plataformas a medida.
> **Pendiente para la sección de servicios/precios y contacto**: el texto sobre la Ley 21.719 de Protección de
> Datos Personales (vigente desde el 1-12-2026; confirmar la fecha). La recomendación es no hacerlo pasar por
> sello oficial: "Desarrollado conforme a la Ley 21.719" + "Incluye política de privacidad redactada según la
> ley", detallando lo que entrega la agencia (política, consentimiento en formularios, aviso de cookies, datos
> mínimos, HTTPS). Va en servicios o precios ("Incluido en todos los planes") y junto al formulario de contacto.
> Que lo revise alguien con formación legal.

Resumen para continuar en una sesión nueva. Nada de lo descrito aquí está en commit todavía (rama `main`).
Servidor: `node servidor.mjs 5181` → http://localhost:5181/

## Regla del usuario sobre los archivos

"Trabaja directamente en C:\dev\Personales\Agencia_web. La versión actual de los archivos es la que quiero conservar.
No vuelvas a implementar los cambios, no hagas merge ni cherry-pick y no restaures archivos."

## Estructura de la página (versión clara, `sitio/index.html`)

1. **Hero**: notebook con 3 sitios en pestañas y la estela final (ver abajo); los chips de canales quedan quietos.
   El video original del hero ya no se usa: su marcado se reemplazó y el código de `main.js` quedó inactivo.
2. **Relato** (`#relato`, `js/relato.js`, CSS en `css/relato*.css` y `css/refinamientos.css`): video por scroll (cuadros AVIF en canvas)
   dentro de un **iPad** (dueño del negocio, oficina) y a la izquierda un **iPhone Pro Max** (cliente) que abre
   Google, Maps, Perfil/reseñas, WhatsApp e IA con animaciones tipo iOS. A cada acción del cliente llega una
   notificación al iPad (arriba a la izquierda, compacta y translúcida para no tapar rostros) junto con los controles
   del reproductor (barra de pausa más transparente). Sin transiciones de entrada ni de cierre; sin selector de capítulos.
   - El panel `.relato-respuesta` quedó sin animar (tapaba la barra); el HTML sigue ahí por si se quiere recuperar.
   **Ritmo de la entrada (2026-11-15, aprobado "los tres")**:
   - La introducción tiene solo "Todo comienza con una búsqueda." y *Hagamos que lo encuentren.* (ya no repite el
     titular del hero; `text-wrap:balance`, ya no se corta).
   - El hero queda fijado 2,15 pantallas: aparece la introducción y, en la última pantalla, su texto sale mientras
     la sección del relato sube transparente encima (`.relato-activo` con margen negativo igual al alto del hero).
     No hay corte a media pantalla ni pantalla vacía.
   - Con la sección fijada, el fondo aparece y los dispositivos crecen (escala .86→1, primero el iPad y luego el
     iPhone con desfase). La línea de tiempo se adelantó 0,8 unidades (`ENTRADA_APP` empieza en 0,75, `TOTAL` 14,8).
     La primera acción del iPhone llega cerca de los 3.400 px de scroll; antes llegaba a los 4.950.
   - Tirón al aparecer el escenario: la causa principal era el SVG de la estela del hero, que quedaba como capa
     de 1600×24.876 px cuando el relato pasaba encima. Ahora es `visibility:hidden` salvo mientras corre la
     estela. En Chrome visible bajó de 259 a 139 ms (un solo cuadro), y el recorrido va a 140 fps.
     Queda ese cuadro de 139 ms al dibujar por primera vez el iPad y el iPhone.
   - **En discusión (2026-11-15)**: el usuario siente que el relato abruma (video + iPhone + notificaciones del
     iPad + controles del reproductor) y pregunta si el video es necesario. Ver la recomendación en la conversación.
3. **Recorrido con tarjetas** (`#recorrido`): maqueta 3D en desuso; reemplazar por storytelling con tarjetas.
4. Servicios, proyectos, proceso, precios, preguntas y contacto.

Scroll suave: Lenis (`js/vendor/lenis.min.js`, `js/suave.js`).

## Nuevo hero: `sitio/pruebas/hero-sitios.html` (prototipo aprobado para seguir)

Idea acordada: el hero muestra **la página web como algo desarrollado** (interacción con el sitio); el relato
muestra la **utilidad** (lo que pasa con el cliente). Sin teléfono en el hero.

- Foto `assets/img/hero-computador-nuevo.webp` (notebook solo). Encima, por `matrix3d` (homografía), una pantalla
  virtual de 1512×982 con Chrome de macOS en HTML: 3 pestañas y barra de dirección.
- Capturas de los 3 sitios (hechas en ChatGPT image): `hero-sitio-constructora.webp`, `hero-sitio-mercado.webp`
  (oscuro premium, parecido al almacén del video), `hero-sitio-consulta.webp` (consulta personal de la kinesióloga
  Daniela Rojas, no clínica).
- Línea de tiempo GSAP (~18 s, **una sola vez**): constructora → llena formulario → "¡Solicitud enviada!";
  almacén → agrega 2 productos → carrito → "Comprar" → "¡Compra confirmada!"; consulta → Evaluación, jueves 19,
  10:30 → "¡Hora agendada!". Cursor de macOS con onda de clic.
- Depuración: `#t=segundos` en la URL congela ese instante. Clases con prefijo `hs-` (evita choques con el resto del CSS).
- Medido: 139 fps, 0 cuadros largos, consola limpia.
- Prototipos anteriores, ya descartados: `pruebas/hero-pagina.html`, `pruebas/hero-cafe.html`.

## Final del hero (aprobado por el usuario e implementado en el prototipo)

1. **Estela**: subtítulo cambiado a "Sitios web y apps a medida para pymes y emprendedores." Tras "¡Hora agendada!"
   un trazo de luz (SVG, acero `#3e5870`, 0,85 s `power3.inOut`) sale del borde izquierdo del vidrio y llega al
   inicio del subtítulo; ahí se dibuja un subrayado tipo marcador (un `span.hs-trazo` por línea, solo `scaleX`,
   0,6 s `power3.out`, líneas encadenadas). Ocurre **una sola vez** por visita; el subrayado queda.
2. **Pantalla final**: la consulta, con servicio, día 19 y 10:30 marcados y la confirmación cerrada.
3. **Repetición**: una vez; se repite (sin estela) al volver al hero tras salir de él o al pasar el mouse sobre la
   pantalla del notebook (solo con `hover:hover` y `pointer:fine`, y solo si ya terminó).
4. `prefers-reduced-motion`: queda directo en el estado final y el subrayado aparece por fundido de 0,2 s.
5. Depuración: `#t=` mayor que la duración (~17,8 s) congela la estela; `#t=30` = estado final.
6. Medido (panel visible, 1600×900, recorrido completo de 20,5 s): ~116 fps, consola limpia. La estela ya no tiene
   cuadros largos (antes había uno de 139 ms; se arregló precalculando las medidas al cargar). Siguen apareciendo
   cuadros sueltos de 35 a 90 ms en los cambios de pestaña y del carrito (entre 3 y 11 s). Varían entre una medición
   y otra, y el panel estaba sin foco: hay que confirmarlos en Chrome antes de integrar.
7. **Integrado en `index.html` (2026-11-15)**: el hero de la página ya usa el notebook con 3 pestañas y la estela.
   El marcado está en `index.html`, el CSS en `css/relato*.css` y `css/refinamientos.css` y el JS en `js/hero.js`; `main.js` ya no
   arranca el video viejo porque `.escena-video` no existe. El prototipo `pruebas/hero-sitios.html` sigue como banco
   de pruebas: si se cambia, hay que copiar el cambio a los tres archivos. Medido en Chrome sin ventana (1600×900,
   recorrido completo): 143 fps, sin cuadros largos, consola limpia. El paso del hero a la introducción del recorrido
   se ve igual que antes.

## Lo que el usuario rechazó (no repetir)

- Ralentizar el video del hero; maquetas SVG/3D procedurales ("básico e infantil").
- Cortinas con números entre escenas, desenfoque a pantalla completa, transiciones de entrada/cierre del relato.
- Doble suavizado (Lenis + inercia propia).
- Agregar decisiones creativas no pedidas: cambiar solo lo pedido y preguntar antes.

## Otros pendientes

- Peso de cuadros del relato para producción.
- Reemplazar el recorrido 3D por tarjetas.
- Logo final en vector.
- Textos, precios y proyectos reales.
- Revisión móvil (al final).
- La versión oscura tiene cambios sin commit; solo se toca si el usuario lo pide.
