# Intellihelp — Home

Landing de Intellihelp (ITH): HTML, CSS y JavaScript estáticos, sin dependencias ni paso de build.

## Estructura

```
index.html               Página completa (contenido + mapa de provincias en SVG inline)
css/styles.css           Estilos: paleta en :root, componentes por sección y animaciones
js/main.js               Menú, CTAs (UTM + medición), hero, revelado, contadores, carruseles, fichero, mapa
img/logo-intellihelp.png Logo
img/clientes/*.webp      Logos de clientes (48, con transparencia) para el fichero de clientes y las tarjetas de casos
img/socios/*.webp        Logos de socios tecnológicos (35), recortados de la lámina de socios de la presentación
video/hero-placeholder.mp4  Video provisorio del hero (degradé generado con ffmpeg, 16 s en loop, 125 KB). Lo reemplaza el video real
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

Solo se usan los colores de `:root` (blanco, carbón `#2A2A2A`, violeta `#663399`, lila `#F0EBF5`, lima `#98CC32`,
gris de fondo `#E6E2EA` y los neutros `#333333`, `#444444`, `#4A4A4A`).

**Fondos (reunión de octubre 2026).** Sin animaciones de fondo: solo color. Las secciones alternan blanco y gris `#E6E2EA`
(clases `.bg-white` y `.bg-gray` en cada `<section>`), empezando en gris por el hero. La barra superior es blanca; el pie
sigue en carbón `#333333`. Orden: hero (video) · servicios (blanco) · soluciones (gris) · presencia nacional (blanco) · presencia regional (gris) · clientes (blanco) · socios tecnológicos (gris) · equipo (blanco) · historia (gris) · cómo trabajamos (blanco) · casos (gris) · preguntas (blanco) · agenda (gris). Problema y Testimonios se quitaron en la reunión de octubre 2026.

**Acentos.** Las clases `.section--alt` y `.section--dark` ya no pintan fondo, pero conservan la familia de acentos de cada
sección mientras se revisa sección por sección:
- Sin modificador (problema, casos, testimonios, preguntas): gris y verde. Texto carbón y `#444444`, título chico con barra
  lima, palabra clave del título en letras lima, recuadros con borde gris `#4A4A4A`, chips y barras con relleno lima.
- `.section--alt` (clientes, servicios, equipo, presencia, cómo trabajamos): violeta. Acento violeta, botón `.btn-primary`,
  cards violeta `.card-violet` con íconos y texto secundario en lila.
- `.section--dark` (hero, historia, agenda): texto carbón y `#444444`, barras lima, botón `.btn-lime`, secundario `.btn-light`
  con borde carbón; la card del CTA final es lima (`.card-lime`) con botón gris que pasa a blanco (`.btn-gray`). El WhatsApp
  flotante es un círculo carbón con el logo oficial en lima.
- Lima como texto solo en la palabra clave del título (grande y en negrita; contraste 1,9:1, pedido del cliente). Nunca en
  texto corrido ni íconos finos: ahí va como relleno o barra.

`.hl` toma el color de acento que corresponde a la sección.

## Cómo editar

- **Texto del hero**: bloque `TEXTO DEL HERO (editable)` en `index.html`. Es provisorio hasta que Claudio pase la versión definitiva.
- **Video del hero**: `video/hero-placeholder.mp4` es un degradé provisorio; el real va en el mismo `<video>` de `.hero__media` (corto, en loop, sin audio, con `poster`). Con JS el hero arranca mostrando solo el video, con velo suave y un botón gris claro con flecha abajo; al tocarlo, o al scrollear (rueda, dedo, teclado), aparece el texto encima con el velo oscuro y el botón se va. Sin JS, o con "reducir movimiento", el texto se ve de entrada.
- **Clientes**: fichero con solapas a la izquierda. Los rubros (sector público, seguros y salud, laboratorios e industria, medios y tecnología, servicios y comercio) son separadores escalonados en profundidad y botones que filtran: sin elegir ninguno pasan los 48 logos; al elegir uno, solo los suyos; volver a tocarlo lo destilda. Cada ficha lleva pegada la solapa de su rubro, que baja con ella al pasar (la de adelante cae hacia el frente girando cada 2,8 s, la primera 1,4 s después de entrar en pantalla; también con las flechas o tocando la ficha). Sin bordes. En celular los rubros van arriba como botones. La fuente de datos es la lista `.filecab__all` (un `li` por cliente con `data-group`); sin JS se ve como grilla con los 48. El rubro de cada cliente lo asignamos nosotros: validar con Carlos.
- **Socios tecnológicos**: grilla fija de celdas blancas (seis columnas, dos filas; en celular dos columnas y tres filas). Un barrido recorre la fila de arriba celda por celda de izquierda a derecha (1,8 s por fila), después la siguiente; terminado el barrido, los logos quedan 2,5 s y arranca el próximo. Cada celda toma el próximo logo de la cola y manda el suyo al final, en orden lineal. Sin JS, o con "reducir movimiento", se ven los 35 logos en grilla. Para sumar un socio, agregar un `li.slot` con su imagen en `img/socios`.
- **Servicios** y **Soluciones**: dos secciones con la misma estructura, separadas según las láminas "Servicios" (7) y "Soluciones" (9) de la presentación institucional 2026. Carrusel de tres tarjetas por vista con "Ver más" que despliega descripción y chips. Servicios: fondo blanco, cards grises sin borde, ícono violeta en círculo blanco, letras negras. Soluciones: títulos negro con lima, fondo gris, cards carbón (`.service--dark`) como la card "Así trabajamos con vos": letras blancas, texto secundario lila, círculo lima con ícono carbón, chips lima. CTA "Agendá reunión" gris oscuro en las dos.
- **Casos**: mini menú a la izquierda y un caso por vez a la derecha (39, tomados de la presentación institucional), con logo, sector, etiquetas del servicio y qué hicimos. Sin elegir nada, los 39 pasan solos en orden aleatorio (se vuelve a barajar en cada vuelta); con las flechas van en orden lineal. Al elegir un sector (público o privado) aparecen los logos de sus clientes y pasan al azar solo los de ese sector; al elegir un cliente queda fija su tarjeta con la lista de proyectos. Volver a tocar el sector o el cliente lo destilda; "Ver todos los casos" vuelve al azar. El menú lo arma el JS con los datos de las tarjetas (sector por el eyebrow, logo por `.case-card__logo`); sin JS no aparece y queda el carrusel. Si un cliente tiene varios proyectos (lista `data-steps`), se muestran de a uno cada 3,5 s con una barra de avance; con el cliente fijo, vuelven a empezar.
- **Provincias del mapa**: agregá `on` a la clase de la provincia. Se pinta, se prende en la animación y se suma sola a la descripción accesible. Hoy están Buenos Aires, CABA, Santa Fe, Entre Ríos, Córdoba, San Luis, Mendoza, San Juan, Neuquén, Corrientes, Misiones, Salta y Tucumán.

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
- **Mapas**: el nacional (provincias, violeta) y el regional (Latinoamérica, de México a Tierra del Fuego: Argentina, Chile, Uruguay, Paraguay y Perú en lima; contornos de Natural Earth simplificados). Al entrar en pantalla las zonas con presencia se prenden de a una en el orden de `data-map-order`. Al pasar el mouse se muestra el nombre. Para sumar una zona, agregar `on` a su clase.
- **Preguntas frecuentes**: `<details name="faq">` nativo; al abrir una se cierra la anterior, sin JS.

## Pendientes antes de publicar

- [ ] Texto definitivo del hero (Claudio).
- [ ] Crear la landing `/asesoria`. Todos los CTA apuntan ahí.
- [ ] Validar los 7 servicios y las 9 soluciones (nombres, orden, descripciones y marcas mencionadas). "Salas de reunión y telefonía IP" quedó afuera: VoIP está en Redes de acceso.
- [ ] Validar qué casos de éxito se pueden publicar con nombre y en qué orden (hoy los 39 de la presentación, público y después privado).
- [ ] Instalar GTM, GA4 y Clarity en los slots (Claudio).
- [ ] Número real de WhatsApp (`wa.me/5491100000000`, aparece dos veces).
- [ ] Links reales de Blog y LinkedIn en el pie.
- [ ] Video real del hero, fotos del equipo (las cajas están vacías) y testimonios reales (hoy hay tres textos de ejemplo).
- [ ] Validar qué logos de clientes se pueden mostrar (hoy están los 48 de la presentación institucional).
- [ ] Respuesta de "¿Cuánto tarda en comenzar un servicio?".
- [ ] Favicon e imagen para compartir en redes (`og:image`).
