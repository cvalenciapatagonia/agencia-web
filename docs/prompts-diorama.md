# Prompts del diorama realista (ChatGPT imágenes + Flow video)

Objetivo: por cada rubro, una imagen **ANTES** y una **DESPUÉS** de la misma maqueta, y un video corto que transforma una en otra.

## Reglas para que todo quede coherente
- Genera **primero la clínica**. Cuando te guste, úsala como **imagen de referencia** para los demás rubros ("misma plataforma, mismo ángulo, misma luz, otro negocio").
- **Sin texto en los letreros** (los generadores lo deforman). Los nombres los pone la página con HTML.
- Formato **16:9** en todas las imágenes y videos (así los cuadros coinciden y Flow no recorta).
- Fondo **negro puro**, para que se funda con la página.
- Sin logos ni marcas reales.

## Bloque de estilo (pégalo al inicio de CADA prompt)
```
Photorealistic miniature diorama of a small business on a floating square dark slate base, isometric three-quarter view from above (about 35 degrees), tilt-shift macro photography, shallow depth of field, tiny realistic people, detailed materials, soft studio lighting with warm accents, pure black background, no text, no logos, no watermark, 16:9.
```

## 1. Clínica
**DESPUÉS**
```
[Bloque de estilo] A modern dental clinic building, two floors, white and glass facade, warm interior lights on, a glowing blank sign above the door, a few patients and a receptionist visible through the windows, small trees and a tidy sidewalk, a tiny smartphone-shaped signboard next to the entrance showing an appointment calendar, vibrant and full of life.
```
**ANTES**
```
[Bloque de estilo] The same small clinic building and base, but run-down and unlit: dull grey facade, dark windows, no sign above the door, an empty sidewalk with weeds, a lonely person standing outside, a faded closed look, desaturated colors.
```

## 2. Salón de belleza
**DESPUÉS**: `[Bloque de estilo] A trendy beauty salon, pink and cream facade, large windows showing stylists and clients, a glowing blank neon-style sign, potted plants, a small barber pole, a queue of happy customers outside, vibrant.`
**ANTES**: `[Bloque de estilo] The same salon building and base but faded and closed: peeling paint, dark windows, no sign, empty chairs inside, nobody outside, desaturated.`

## 3. Ferretería / comercio
**DESPUÉS**: `[Bloque de estilo] A busy hardware store, orange and steel facade, large open storefront with shelves of tools, stacks of paint buckets and wooden crates outside, a delivery van at the curb, customers carrying boxes, a glowing blank sign, vibrant.`
**ANTES**: `[Bloque de estilo] The same hardware store and base but neglected: shutters half down, empty shelves, dusty boxes, no sign, no customers, desaturated.`

## 4. Constructora
**DESPUÉS**: `[Bloque de estilo] A construction company's new residential building project, a finished modern four-floor building with balconies next to a tower crane, workers in orange vests, a small excavator, a blank company sign at the entrance, vibrant daylight with warm interior lights.`
**ANTES**: `[Bloque de estilo] The same plot and base but empty: bare dirt, a few concrete foundations, rusty fence, one small shed, no workers, no sign, desaturated.`

## 5. Restaurante
**DESPUÉS**: `[Bloque de estilo] A cozy restaurant with a terrace, string lights, round tables with parasols full of diners, a chef visible through the kitchen window, waiters carrying plates, a glowing blank sign, warm evening light, vibrant.`
**ANTES**: `[Bloque de estilo] The same restaurant and base but abandoned: stacked chairs, covered tables, lights off, no sign, no people, desaturated.`

## 6. Autoescuela
**DESPUÉS**: `[Bloque de estilo] A driving school with a small training track in front, two clearly marked practice cars with roof signs, a student and instructor at a car window, traffic cones and road markings, a modern small building with a glowing blank sign, vibrant.`
**ANTES**: `[Bloque de estilo] The same driving school and base but inactive: one dusty parked car, faded road markings, closed door, no sign, nobody around, desaturated.`

## Video en Flow (por rubro)
Usa **Frames to Video**: sube la imagen ANTES como primer cuadro y la DESPUÉS como último cuadro.
```
Smooth time-lapse transformation of the miniature diorama from the first frame to the last frame: the building is renovated and comes to life, lights turn on one by one, the sign glows, colors become vibrant, tiny people arrive and gather, subtle camera push-in, static camera angle, no cuts, no text.
```
Duración: la más corta disponible (4–8 s). Si deforma la plataforma o el ángulo, repite con "keep the dark base and camera angle perfectly fixed".

## Cómo me los pasas
Guárdalos así, en `assets/diorama/`:
```
clinica-antes.png   clinica-despues.png   clinica.mp4
salon-antes.png     salon-despues.png     salon.mp4
...
```
Yo los comprimo (WebP + MP4 liviano), hago la versión de celular con imagen fija y los integro en el hero.
