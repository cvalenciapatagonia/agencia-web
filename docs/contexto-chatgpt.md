# Contexto del proyecto para ChatGPT (agente de imágenes, guiones y chat)

Actualizado: 2026-11-12. Este archivo describe lo que EXISTE hoy. Si algo cambió, el usuario te lo dirá. Claude Code ejecuta el código en el proyecto; tú propones y produces material creativo.

## Qué es
Sitio web de una agencia personal de desarrollo web, apps y landing pages para pymes y empresas de Chile. Nombre de la agencia: pendiente ("Estudio" es provisional). Contacto principal: WhatsApp (el número aún no está configurado).

Repositorio: https://github.com/cvalenciapatagonia/agencia-web

## Versiones
- **Principal (fondo claro)**: rama `main`. Video de hero sobre pared crema.
- **Fondo negro**: rama `video-fondo-negro`. Mismo sitio con video de fondo negro y paleta oscura con acento lima.
- Hubo una versión 3D con Three.js; fue descartada y borrada.

## Sistema visual actual (versión clara)
- Fondo crema `#f4ebe2` (igual a la pared del video), bandas `#ece1d5`, superficies `#faf5ef`.
- Texto `#16120f`, texto secundario `#5c544c`, líneas `#d6c9bb`.
- Botón principal en tinta cálida `#3a302a`. Acento único: azul acero `#3e5870`.
- Verde WhatsApp profundo `#0f7a3e` (texto blanco) y `#25d366` (marca).
- Tipografía: Inter Tight en todo (titulares con peso 750, interlineado muy ajustado, tracking negativo).
- Esquinas: 14 px en tarjetas, 24 px en paneles grandes.

Versión oscura: fondo `#0b0b0b`, bandas `#131313`, texto `#f3efe7`, acento lima.

## Estructura de la página
1. **Hero** (`Tu negocio tiene algo que contar.`): video de fondo con tarjetas animadas y chips de canales (Google, Mapa, Reseñas, WhatsApp, Búsqueda con IA).
2. **Recorrido**: "Así llega un cliente a tu negocio." Historia con scroll.
3. **Servicios**: "Lo que tu negocio necesita, ni más ni menos."
4. **Proyectos**: "Así se puede ver tu rubro." Ejemplos de botillería, clínica y constructora (no son clientes reales).
5. **Proceso**: "Cuatro pasos, sin enredos."
6. **Precios**: "Cada proyecto se cotiza a medida." Sin valores publicados.
7. **Preguntas**: "Lo que suelen preguntarme."
8. **Contacto**: "Cuéntame de tu negocio."

## Animación del hero (video)
Tarjetas que aparecen y salen sobre la escena, con estos tiempos en segundos:
- 0,8–3,2 Tarjeta de Google: se escribe "constructora de galpones cerca de mí".
- 3,4–6 Reseña de Perfil de Empresa en Google: "Rodrigo M.", cinco estrellas, "Constructora Norte · Rancagua".
- 6,4–9,8 Chat de WhatsApp: pregunta por despacho a Ñuñoa y respuesta "Sí, despachamos hasta las 22:00".
- 10–14,3 Asistente IA: "¿Botillería abierta cerca de mí?" con respuesta que recomienda "Botillería La Esquina".
- Al final la escena queda limpia. Existe un último fotograma mejorado (`docs/ultimo-fotograma-mejorado.webp`).

Los textos de las tarjetas son demostraciones, no promesas garantizadas.

## Pendientes conocidos
- Nombre de la agencia y número de WhatsApp.
- Ajustes de tipografía (el usuario quiere revisarla).
- Proyectos reales para reemplazar los ejemplos.
- Precios.
- Móvil: se revisa al final, en una etapa propia.

## Reglas de trabajo con el usuario
- Lo decidido es provisional: el usuario está probando. No uses el brief para frenar cambios que pide.
- Cuando pida un cambio, toca solo eso (si es tipografía, solo tipografía).
- Antes de proponer cambios grandes, explica en corto qué harías y pregunta.
- Críticas de diseño: solo escritorio y solo UX/UI visual.
- Textos en español de Chile, sin errores de ortografía.
- Prohibido prometer resultados no garantizables ("#1 en Google") y usar logos de marcas en imágenes generadas, salvo que el usuario lo pida.
