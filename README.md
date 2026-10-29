# Intellihelp — Home

Landing de Intellihelp (ITH): HTML, CSS y JavaScript estáticos, sin dependencias ni paso de build.

## Estructura

```
index.html               Página completa (contenido + mapa de provincias en SVG inline)
css/styles.css           Estilos: paleta en :root, componentes por sección y animaciones
js/main.js               Menú, CTAs (UTM + medición), revelado, contadores, carrusel, mapa y notas
img/circuit.svg          Fondo animado de las secciones oscuras (uno solo, cacheado)
img/logo-intellihelp.png Logo
```

## Ver localmente

Abrí `index.html` en el navegador, o levantá un servidor estático:

```bash
python3 -m http.server
```

y entrá a <http://localhost:8000>.

## Paleta

Solo se usan los colores de `:root` (blanco, carbón `#2A2A2A`, violeta `#663399`, lila `#F0EBF5`, lima `#98CC32`
y los neutros `#333333`, `#444444`, `#4A4A4A`). Regla por fondo:

- **Carbón**: texto blanco, acento lima (`.hl`, íconos, líneas) y botón `.btn-lime`.
- **Blanco o lila**: texto carbón, acento violeta (`.hl`, íconos, bordes) y botón `.btn-primary`.
- **Cards violeta** (`.card-violet`): letras siempre blancas; lima solo en íconos (nunca en texto).
- Lima nunca como texto, ícono fino o línea sobre blanco o lila.

`.hl` toma el color de acento que corresponde al fondo de la sección. Todas las combinaciones cumplen WCAG AA.

## Cómo editar

- **Texto del hero**: bloque `TEXTO DEL HERO (editable)` en `index.html`. Es provisorio hasta que Claudio pase la versión definitiva.
- **Imagen o video del hero**: dentro de `.hero__media` hay un ejemplo comentado de `<img>` y de `<video>` en loop. El overlay oscuro se aplica solo.
- **Servicios**: el carrusel muestra siempre tres tarjetas por vista. Para sumar servicios, agregá otro `.carousel__slide` con tres tarjetas, una de ellas `.card-violet`. La descripción va dentro de un `<details>`: queda en el DOM (indexable) y se despliega con "Ver más".
- **Provincias del mapa**: agregá `on` a la clase de la provincia. Se pinta, se prende en la animación y se suma sola a la descripción accesible. Neuquén está marcada con un comentario, lista para activar.
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
- [ ] Confirmar Neuquén en el mapa.
- [ ] Validar las descripciones nuevas de Desarrollo de aplicaciones, Soluciones IoT y Energía solar.
- [ ] El hero dice "+10 provincias"; el mapa marca 8 provincias + CABA (9 con Neuquén): alinear.
- [ ] Instalar GTM, GA4 y Clarity en los slots (Claudio).
- [ ] Número real de WhatsApp (`wa.me/5491100000000`, aparece dos veces).
- [ ] Links reales de Blog y LinkedIn en el pie.
- [ ] Imagen o video del hero, fotos del equipo, logos de clientes y testimonios (están como notas).
- [ ] Respuesta de "¿Cuánto tarda en comenzar un servicio?".
- [ ] Quitar las notas internas (o el botón) en la versión pública.
- [ ] Favicon e imagen para compartir en redes (`og:image`).
