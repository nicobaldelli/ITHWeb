# Intellihelp — Home

Landing de Intellihelp (ITH): HTML, CSS y JavaScript estáticos, sin dependencias ni paso de build.

## Estructura

```
index.html               Página completa (contenido + mapa de provincias en SVG inline)
css/styles.css           Estilos: paleta en :root, componentes por sección y animaciones
js/main.js               Menú, CTAs (UTM + medición), revelado, contadores, carrusel, mapa y notas
img/circuit.svg          Fondo animado de las secciones oscuras (uno solo, cacheado)
img/hex.svg              Fondo de las secciones blancas: hexágonos gris con trazos de circuito, pads y pulsos animados, desvanecidos al centro. Solo gris: el blanco sirve a las dos familias de color (se genera con un script, no editar a mano)
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

La familia de colores la decide el fondo de cada sección, y los fondos se alternan (ninguna sección repite el de la
anterior):

- **Blanco** (`.section`): gris y verde, sin lila. Texto carbón y `#444444`, título chico gris con barra lima, palabra
  clave como resaltador lima con letra carbón, recuadros con borde o relleno lima y texto carbón, botón `.btn-lime`.
  Secciones: problema, casos, testimonios, preguntas.
- **Lila** (`.section--alt`): violeta. Texto carbón, acento violeta, botón `.btn-primary`. Cards violeta `.card-violet`
  con íconos, numeración y texto secundario en lila (botón adentro: `.btn-light`).
  Secciones: clientes, servicios, equipo, presencia, cómo trabajamos.
- **Carbón** (`.section--dark`): hero, historia y agenda, más header y pie en `#333333`. Texto blanco, lila para texto
  secundario, acento lima, botón `.btn-lime`; la card del CTA final es lima (`.card-lime`) con botón `.btn-ghost`.
- Orden actual: hero (carbón) · clientes (lila) · problema (blanco) · servicios (lila) · historia (carbón) · equipo (lila) ·
  casos (blanco) · presencia (lila) · testimonios (blanco) · cómo trabajamos (lila) · preguntas (blanco) · agenda (carbón) ·
  pie (`#333333`).
- Lima nunca como texto fino sobre blanco: va como relleno, barra o resaltador.

`.hl` toma el color de acento que corresponde al fondo de la sección. Todas las combinaciones cumplen WCAG AA.

## Cómo editar

- **Texto del hero**: bloque `TEXTO DEL HERO (editable)` en `index.html`. Es provisorio hasta que Claudio pase la versión definitiva.
- **Imagen o video del hero**: dentro de `.hero__media` hay un ejemplo comentado de `<img>` y de `<video>` en loop. El overlay oscuro se aplica solo.
- **Servicios**: doce tarjetas violeta tomadas de la presentación institucional 2026, en un carrusel que muestra siempre tres por vista. Para sumar un servicio, agregá una tarjeta al último `.carousel__slide` (o un `.carousel__slide` nuevo al completar tres). La descripción va dentro de un `<details>`: queda en el DOM (indexable) y se despliega con "Ver más".
- **Casos**: un caso por vez (39, tomados de la presentación institucional), con logo, sector, etiquetas del servicio y qué hicimos. Avanzan solos cada 7 s o con las flechas; con más de diez tarjetas se muestra un contador "n de N" en vez de puntos. Si un cliente tiene varios proyectos (lista `data-steps`), se muestran de a uno cada 3,5 s con una barra de avance, y recién después pasa al cliente siguiente; también se pueden elegir con un clic.
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
- **Carruseles**: avanzan solos cada 7 s (el de casos, 3,5 s por proyecto dentro de un cliente). Se detienen con el mouse encima, con foco adentro, con un "Ver más" abierto o fuera de pantalla, y tienen botón de pausa. Con "reducir movimiento" no avanzan solos. Sin JS quedan como scroll horizontal. Se detiene con el mouse encima, con foco en una tarjeta, con un "Ver más" abierto o fuera de pantalla, y tiene botón de pausa. Con "reducir movimiento" no avanza solo. Sin JS queda como scroll horizontal.
- **Mapa**: al entrar en pantalla las provincias con presencia se prenden de a una. Al pasar el mouse o tocar una provincia se muestra su nombre.
- **Preguntas frecuentes**: `<details name="faq">` nativo; al abrir una se cierra la anterior, sin JS.

## Pendientes antes de publicar

- [ ] Texto definitivo del hero (Claudio).
- [ ] Crear la landing `/asesoria`. Todos los CTA apuntan ahí.
- [ ] Validar los doce servicios del carrusel (nombres, orden y marcas mencionadas).
- [ ] Validar qué casos de éxito se pueden publicar con nombre y en qué orden (hoy los 39 de la presentación, público y después privado).
- [ ] Instalar GTM, GA4 y Clarity en los slots (Claudio).
- [ ] Número real de WhatsApp (`wa.me/5491100000000`, aparece dos veces).
- [ ] Links reales de Blog y LinkedIn en el pie.
- [ ] Imagen o video del hero, fotos del equipo y testimonios (están como notas).
- [ ] Validar qué logos de clientes se pueden mostrar (hoy están los 48 de la presentación institucional).
- [ ] Respuesta de "¿Cuánto tarda en comenzar un servicio?".
- [ ] Quitar las notas internas (o el botón) en la versión pública.
- [ ] Favicon e imagen para compartir en redes (`og:image`).
