# Brief de diseño — Web de agencia personal

Estado: prototipos de diseño. Stack sin decidir (recomendado: Astro + GSAP). No hay código final.

## Flujo de trabajo
- **Diseño y prototipos visuales**: ChatGPT (imágenes).
- **Animación de video**: Flow (Gemini/Veo).
- **Implementación en código**: Claude Code, en esta carpeta.

## Negocio
- Agencia personal de desarrollo web, apps y landing pages.
- Público: toda pyme o empresa en Chile que lo necesite.
- Nombre de la agencia: pendiente ("Estudio" es provisional).
- Precios y rangos van al final del sitio, con enlace desde el menú. Valores sin definir.
- Contacto principal: WhatsApp.

## Dirección elegida (referencia: hero #7 generado en ChatGPT)
Estilo claro, cercano, minimalista y premium.
- Fondo crema cálido, luz de ventana con sombras suaves de hojas.
- Titular en serif de alto contraste: "Tu negocio tiene algo que *contar*." (la palabra "contar" en cursiva y azul acero).
- Etiqueta superior en mayúsculas espaciadas: "DESARROLLO WEB Y APPS · CHILE".
- Subtítulo en gris cálido y liviano: "Sitios web y apps a medida para pymes."
- Botón principal: píldora de tinta cálida "Cotizar por WhatsApp" con flecha en círculo. Secundario: enlace "Ver trabajos →" subrayado.
- Etiquetas de rubros bajo los botones: Clínicas · Comercio · Construcción · Gastronomía.
- Navbar: wordmark en serif, enlaces pequeños (Servicios, Proyectos, Proceso, Precios) y botón píldora "Cotizar" con borde fino.
- Acento único: azul acero profundo (~#3E5870).
- Portátil realista, vista tres cuartos, a la derecha (≈45% del cuadro). Texto a la izquierda.

## Animación del hero
- La pantalla del portátil pasa por sitios de distintos rubros (clínica, salón, ferretería, constructora, etc.).
- Tarjetas flotantes tipo notificación que entran y salen alrededor del portátil, en secuencia:
  1. "Nuevo mensaje en WhatsApp"
  2. Buscador (el texto de la promesa se ajustará después)
  3. Asistente IA: pregunta + respuesta recomendando el negocio. Ícono genérico de destello, sin logos de marcas
  4. Cierre, por ejemplo "Nueva cotización recibida"
- Los textos de las tarjetas son demostrativos, no promesas garantizadas.
- Luz de ventana con sombras de hojas moviéndose despacio (video de fondo en bucle).

## Pendientes de ajuste
- Tipografía del prototipo: el usuario quiere revisarla más adelante.
- Textos de promesa de Google en las tarjetas.
- Escena del portátil sin texto y con pantalla en blanco, para superponer la pantalla real por código.

## Estructura del sitio
Hero · Servicios (landing, sitios, apps/sistemas) · Proyectos (reales, hoy son marcadores) · Proceso en 4 pasos · Precios al final · Preguntas frecuentes · Contacto con WhatsApp.
Sección oscura opcional con acento lima para proyectos y proceso (idea de "mezcla", pendiente de decidir).

## Decisiones técnicas
- Todo el texto del hero debe ser HTML real, no parte de la imagen.
- Video de fondo: WebM + MP4 (autoplay, mudo, bucle) y WebP como respaldo. Evitar WebP animado.
- En celular: imagen fija en lugar de video, para cuidar los datos móviles.
- Respetar "reducir movimiento".

## Archivos existentes
- `previews/` prototipos en HTML (hero con scroll, diorama isométrico, mezcla claro/oscuro, direcciones A y B).
- `docs/prompts-diorama.md` kit de prompts del diorama (idea descartada por no verse realista).
