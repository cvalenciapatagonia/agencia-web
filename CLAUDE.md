# Agencia KAI · sitio web

Sitio estático (HTML, CSS y JS sin framework) de una agencia de desarrollo web para pymes en Chile.
Estado detallado y pendientes: `docs/estado-proyecto.md`.

## Reglas obligatorias de trabajo

1. **Skills antes de proponer.** Antes de cualquier tarea de diseño, animación, scroll o transición, leer
   `C:\dev\Skills_rep\INDEX.md`, cargar las skills que correspondan y **nombrarlas en la primera respuesta**,
   antes de proponer nada. Para leer skills largas, usar el agente `lector-de-skills` (devuelve solo las reglas aplicables).
   Skills clave de este proyecto:
   - Relato con video y scroll: `05-scroll-3d/scroll-world-storytelling`
   - Diseño de nivel agencia: `01-diseno-estilos/high-end-visual-design`, `17-referencias-diseno/premium-web-design`
   - Movimiento: `03-animacion-ui/apple-design`, `03-animacion-ui/design-motion-principles`
   - Coreografía con scroll: `04-gsap/gsap-scrolltrigger`, `04-gsap/gsap-plugins`
   - Rendimiento: `03-animacion-ui/animation-performance`
2. **Técnica estándar primero.** Usar la solución establecida en sitios premium (GSAP + ScrollTrigger, Lenis,
   secuencias de cuadros en canvas, revelado de texto por líneas, tarjetas apiladas). No inventar soluciones propias
   si existe una estándar. No apilar dos suavizados (Lenis ya suaviza: no agregar inercia propia encima).
3. **Revisión antes de mostrar.** Toda animación o transición se revisa con `03-animacion-ui/review-animations`
   y se mide (fps) antes de presentarla. No mostrar versiones a medias.
4. **Alcance.** Trabajar solo en la versión clara (rama `main`, esta carpeta). La versión oscura
   (`video-fondo-negro`, carpeta `C:\dev\Personales\Agencia_web-video`) solo se toca si el usuario lo pide explícitamente.
   Cambiar solo lo pedido; antes de cambios de diseño grandes, explicar en corto y preguntar.
5. **Revisión de diseño solo en escritorio**; móvil va al final, en etapa aparte.
6. **Mostrar resultados**: abrir en Chrome (`Start-Process chrome "<url>"`) y dar siempre el enlace clicable,
   por ejemplo [http://localhost:5181/](http://localhost:5181/).

## Servidores locales

- Versión clara: `node servidor.mjs 5181` en esta carpeta → http://localhost:5181/
- Versión oscura: `node servidor.mjs 5183` en `C:\dev\Personales\Agencia_web-video` → http://localhost:5183/

## Comandos

- `npm run build:3d` compila `fuente/diorama3d.js` (maqueta 3D, en desuso) a `sitio/js/diorama3d.min.js`.
