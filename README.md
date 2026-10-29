# Intellihelp — Home

Landing de Intellihelp (ITH): HTML, CSS y JavaScript estáticos, sin dependencias ni paso de build.

## Estructura

```
index.html               Página completa (contenido + mapa de provincias en SVG inline)
css/styles.css           Estilos: paleta en :root, componentes por sección y animaciones
js/main.js               Menú, CTAs (UTM + medición), revelado, contadores, carrusel, mapa y notas
img/circuit.svg          Fondo animado de las secciones oscuras (uno solo, cacheado)
img/hex.svg              Fondo de las secciones blancas: plano de hexágonos gris en perspectiva, con trazos de circuito, pads y pulsos animados, desvanecido al centro. Solo gris: el blanco sirve a las dos familias de color. Lo genera img/hex.py, no editar a mano
img/waves.svg            Fondo de las secciones lila: campo de ondas violeta (líneas finas en paralelo) que fluye despacio, desvanecido al centro. Lo genera img/waves.py, no editar a mano
img/logo-intellihelp.png Logo
img/clientes/*.webp      Logos de clientes (48, con transparencia) para el fichero de clientes y las tarjetas de casos
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
  clave del título en letras lima, recuadros con borde gris (`#4A4A4A`), chips y barras con relleno lima, botón `.btn-lime`.
  Secciones: problema, casos, testimonios, preguntas.
- **Lila** (`.section--alt`): violeta. Texto carbón, acento violeta, botón `.btn-primary`. Cards violeta `.card-violet`
  con íconos, numeración y texto secundario en lila (botón adentro: `.btn-light`).
  Secciones: clientes, servicios, equipo, presencia, cómo trabajamos.
- **Carbón** (`.section--dark`): hero, historia y agenda, más header y pie en `#333333`. Texto blanco, lila para texto
  secundario, acento lima, botón `.btn-lime`; la card del CTA final es lima (`.card-lime`) con botón gris que pasa a blanco al pasar el mouse (`.btn-gray`). El WhatsApp flotante es un círculo carbón con el logo oficial en lima.
- Orden actual: hero (carbón) · clientes (lila) · problema (blanco) · servicios (lila) · historia (carbón) · equipo (lila) ·
  casos (blanco) · presencia (lila) · testimonios (blanco) · cómo trabajamos (lila) · preguntas (blanco) · agenda (carbón) ·
  pie (`#333333`).
- Lima como texto sobre blanco solo en la palabra clave del título (grande y en negrita; contraste 1,9:1, pedido del
  cliente). Nunca en texto corrido ni íconos finos: ahí va como relleno o barra.

`.hl` toma el color de acento que corresponde al fondo de la sección. Todas las combinaciones cumplen WCAG AA.

## Cómo editar

- **Texto del hero**: bloque `TEXTO DEL HERO (editable)` en `index.html`. Es provisorio hasta que Claudio pase la versión definitiva.
- **Imagen o video del hero**: dentro de `.hero__media` hay un ejemplo comentado de `<img>` y de `<video>` en loop. El overlay oscuro se aplica solo.
- **Clientes**: fichero. Los rubros (sector público, seguros y salud, laboratorios e industria, medios y tecnología, servicios y comercio) son pestañas: sin elegir ninguna pasan los 48 logos; al elegir una, solo los de ese rubro, y volver a tocarla la destilda. Los logos van en fichas blancas de hasta seis, de un mismo rubro, apiladas: la de adelante cae hacia el frente girando cada 2,8 s (la primera, 1,4 s después de entrar en pantalla) (o con las flechas, o tocando la ficha). Se detiene con foco adentro o fuera de pantalla (no con el mouse encima, para que todas las pasadas duren igual); con "reducir movimiento" no pasa sola. La fuente de datos es la lista `.filecab__all` (un `li` por cliente con `data-group`); sin JS se ve como grilla con los 48. El rubro de cada cliente lo asignamos nosotros: validar con Carlos.
- **Servicios**: doce tarjetas violeta tomadas de la presentación institucional 2026, en un carrusel que muestra siempre tres por vista. Para sumar un servicio, agregá una tarjeta al último `.carousel__slide` (o un `.carousel__slide` nuevo al completar tres). La descripción va dentro de un `<details>`: queda en el DOM (indexable) y se despliega con "Ver más".
- **Casos**: mini menú a la izquierda y un caso por vez a la derecha (39, tomados de la presentación institucional), con logo, sector, etiquetas del servicio y qué hicimos. Sin elegir nada, los 39 pasan solos en orden aleatorio (se vuelve a barajar en cada vuelta); con las flechas van en orden lineal. Al elegir un sector (público o privado) aparecen los logos de sus clientes y pasan al azar solo los de ese sector; al elegir un cliente queda fija su tarjeta con la lista de proyectos. Volver a tocar el sector o el cliente lo destilda; "Ver todos los casos" vuelve al azar. El menú lo arma el JS con los datos de las tarjetas (sector por el eyebrow, logo por `.case-card__logo`); sin JS no aparece y queda el carrusel. Si un cliente tiene varios proyectos (lista `data-steps`), se muestran de a uno cada 3,5 s con una barra de avance; con el cliente fijo, vuelven a empezar.
- **Provincias del mapa**: agregá `on` a la clase de la provincia. Se pinta, se prende en la animación y se suma sola a la descripción accesible. Hoy están Buenos Aires, CABA, Santa Fe, Entre Ríos, Córdoba, San Luis, Mendoza, San Juan, Neuquén, Corrientes, Misiones, Salta y Tucumán.
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
- **Carruseles**: avanzan solos cada 7 s (el de casos, 3,5 s por proyecto dentro de un cliente). Se detienen con el mouse encima, con foco adentro, con un "Ver más" abierto o fuera de pantalla, y tienen botón de pausa. Con "reducir movimiento" no avanzan solos. Sin JS quedan como scroll horizontal.
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
