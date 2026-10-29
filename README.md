# Intellihelp — Home

Landing de Intellihelp (ITH): HTML, CSS y JavaScript estáticos, sin dependencias ni paso de build.

## Estructura

```
index.html               Página completa (contenido + mapa de provincias en SVG inline)
css/styles.css           Estilos: paleta en :root, componentes por sección y animaciones
js/main.js               Menú, CTAs (UTM + medición), revelado, contadores, carrusel, mapa y notas
img/circuit.svg          Fondo animado de las secciones oscuras (uno solo, cacheado)
img/logo-intellihelp.png Logo
img/clientes/*.webp      Logos de clientes (48, con transparencia) para las dos filas del carrusel
fonts/saira-latin.woff2  Tipografía Saira (variable 400–700, subconjunto latino), servida desde acá
```

La tipografía se sirve desde el propio sitio: no hay pedidos a Google Fonts ni CSS externo que bloquee el primer
pintado. Es el mismo archivo que entrega Google para el subconjunto latino (alcanza para el español), bajo la
[SIL Open Font License](https://openfontlicense.org/). Si algún día hace falta otro alfabeto, se agrega otro
`@font-face` con su `unicode-range` en `css/styles.css`.

## Ver localmente

Abrí `index.html` en el navegador, o levantá un servidor estático:

```bash
python3 -m http.server
```

y entrá a <http://localhost:8000>.

## Paleta

Solo se usan los colores de `:root` (blanco, carbón `#2A2A2A`, violeta `#663399`, lila `#F0EBF5`, lima `#98CC32`
y los neutros `#333333`, `#444444`, `#4A4A4A`). Regla por fondo:

Hay dos familias que nunca se tocan, y las secciones las alternan para que la página quede equilibrada:

- **Familia lima**: fondo carbón o `#333333` (hero, historia, agenda, footer) y cards carbón `.card-dark` sobre blanco
  (card "Así trabajamos con vos", cita del equipo, los tres pasos). Texto blanco, lila para texto secundario, acento e
  íconos lima, botón `.btn-lime`. Sobre carbón la card es lima (`.card-lime`): texto e íconos carbón, botón `.btn-ghost`.
- **Familia violeta**: fondo blanco o lila. Texto carbón, acento e íconos violeta, botón `.btn-primary`. Cards violeta
  `.card-violet` (servicios, bloque de Casos): texto blanco, lila para texto secundario, íconos y botones en blanco
  (`.btn-light`).
- Sobre fondo carbón nunca va una card violeta; sobre una card violeta nunca va lima. Lima nunca como texto, ícono fino
  o línea sobre blanco o lila.

`.hl` toma el color de acento que corresponde al fondo de la sección. Todas las combinaciones cumplen WCAG AA.

## Cómo editar

- **Texto del hero**: bloque `TEXTO DEL HERO (editable)` en `index.html`. Es provisorio hasta que Claudio pase la versión definitiva.
- **Imagen o video del hero**: dentro de `.hero__media` hay un ejemplo comentado de `<img>` y de `<video>` en loop. El overlay oscuro se aplica solo.
- **Servicios**: doce tarjetas violeta tomadas de la presentación institucional 2026, en un carrusel que muestra siempre tres por vista. Para sumar un servicio, agregá una tarjeta al último `.carousel__slide` (o un `.carousel__slide` nuevo al completar tres). La descripción va dentro de un `<details>`: queda en el DOM (indexable) y se despliega con "Ver más".
- **Provincias del mapa**: agregá `on` a la clase de la provincia. Se pinta, se prende en la animación y se suma sola a la descripción accesible. Hoy están Buenos Aires, CABA, Santa Fe, Entre Ríos, Córdoba, San Luis, Mendoza, San Juan, Neuquén, Corrientes, Misiones y Salta.
- **Notas internas** (`.nota`): indicaciones del borrador para Carlos. El botón del pie las oculta o muestra (equivale al switch `notesDisplay` del diseño) y recuerda la elección en `localStorage`.

## Medición

- En el `<head>` y al inicio del `<body>` hay slots comentados para Google Tag Manager, Google Analytics 4 y Microsoft Clarity, sin IDs cargados.
- Cada botón "Agendá tu asesoría" lleva `id` único y `data-cta`:

  | id | data-cta |
  |---|---|
  | `cta-header` | `header-agendar` |
  | `cta-hero` | `hero-agendar` |
  | `cta-servicios` | `servicios-agendar` |
  | `cta-como-trabajamos` | `como-trabajamos-agendar` |
  | `cta-final` | `final-agendar` |

- Al hacer clic, además se envía al `dataLayer` el evento `cta_click` con `cta_id`, `cta_section` y `cta_url`.
- Los CTA apuntan a `/asesoria` y le reenvían los parámetros de campaña de la URL de entrada (`utm_*`, `gclid`, `gbraid`, `wbraid`, `fbclid`, `msclkid`). Se guardan en la sesión por si el visitante navega antes de hacer clic.

## Comportamiento

- **Animaciones de entrada**: los elementos `.rv` aparecen al entrar en pantalla. En el hero primero aparece la imagen y después el texto. Se activan solo si hay `IntersectionObserver` y no se pidió reducir movimiento; si no, todo se ve estático.
- **Carrusel**: avanza solo cada 7 s. Se detiene con el mouse encima, con foco en una tarjeta, con un "Ver más" abierto o fuera de pantalla, y tiene botón de pausa. Con "reducir movimiento" no avanza solo. Sin JS queda como scroll horizontal.
- **Mapa**: al entrar en pantalla las provincias con presencia se prenden de a una. Al pasar el mouse o tocar una provincia se muestra su nombre.
- **Preguntas frecuentes**: `<details name="faq">` nativo; al abrir una se cierra la anterior, sin JS.

## Pendientes antes de publicar

- [ ] Texto definitivo del hero (Claudio).
- [ ] Crear la landing `/asesoria`. Todos los CTA apuntan ahí.
- [ ] Validar los doce servicios del carrusel (nombres, orden y marcas mencionadas).
- [ ] Instalar GTM, GA4 y Clarity en los slots (Claudio).
- [ ] Número real de WhatsApp (`wa.me/5491100000000`, aparece dos veces).
- [ ] Links reales de Blog y LinkedIn en el pie.
- [ ] Imagen o video del hero, fotos del equipo y testimonios (están como notas).
- [ ] Validar qué logos de clientes se pueden mostrar (hoy están los 48 de la presentación institucional).
- [ ] Respuesta de "¿Cuánto tarda en comenzar un servicio?".
- [ ] Quitar las notas internas (o el botón) en la versión pública.
- [ ] Favicon e imagen para compartir en redes (`og:image`).
