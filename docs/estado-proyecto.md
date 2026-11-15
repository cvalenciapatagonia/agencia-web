# Estado del proyecto · 2026-11-15

Resumen para continuar en una sesión nueva. Nada de lo descrito aquí está en commit todavía (rama `main`).
Servidor: `node servidor.mjs 5181` → http://localhost:5181/

## Regla del usuario sobre los archivos

"Trabaja directamente en C:\dev\Personales\Agencia_web. La versión actual de los archivos es la que quiero conservar.
No vuelvas a implementar los cambios, no hagas merge ni cherry-pick y no restaures archivos."

## Estructura de la página (versión clara, `sitio/index.html`)

1. **Hero**: notebook con 3 sitios en pestañas y la estela final (ver abajo); los chips de canales quedan quietos.
   El video original del hero ya no se usa: su marcado se reemplazó y el código de `main.js` quedó inactivo.
2. **Relato** (`#relato`, `js/relato.js`, CSS al final de `css/estilos.css`): video por scroll (cuadros AVIF en canvas)
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

- Foto `assets/img/hero-computador-nuevo.png` (notebook solo). Encima, por `matrix3d` (homografía), una pantalla
  virtual de 1512×982 con Chrome de macOS en HTML: 3 pestañas y barra de dirección.
- Capturas de los 3 sitios (hechas en ChatGPT image): `hero-sitio-constructora.webp`, `hero-sitio-mercado.webp`
  (oscuro premium, parecido al almacén del video), `hero-sitio-consulta.webp` (consulta personal de la kinesióloga
  Daniela Rojas, no clínica).
- Línea de tiempo GSAP (~18 s, **una sola vez**): constructora → llena formulario → "¡Solicitud enviada!";
  almacén → agrega 2 productos → carrito → "Comprar" → "¡Compra confirmada!"; consulta → Evaluación, jueves 19,
  10:30 → "¡Hora agendada!". Cursor de macOS con onda de clic.
- Depuración: `#t=segundos` en la URL congela ese instante. Clases con prefijo `hs-` (evita choques con `estilos.css`).
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
   El marcado está en `index.html`, el CSS al final de `css/estilos.css` y el JS en `js/hero.js`; `main.js` ya no
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
