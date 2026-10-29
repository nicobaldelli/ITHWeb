# Intellihelp — Home

Landing de Intellihelp (ITH): HTML, CSS y JavaScript estáticos, sin dependencias ni paso de build.

## Estructura

```
index.html               Página completa (contenido + mapa de provincias en SVG inline)
css/styles.css           Estilos: tokens de color en :root, componentes por sección y animaciones
js/main.js               Revelado al hacer scroll, contadores, mapa, formulario y notas internas
img/circuit.svg          Fondo animado de las secciones oscuras (uno solo, cacheado)
img/logo-intellihelp.png Logo
```

## Ver localmente

Abrí `index.html` en el navegador, o levantá un servidor estático:

```bash
python3 -m http.server
```

y entrá a <http://localhost:8000>.

## Comportamiento

- **Animaciones de entrada**: los elementos `.rv` aparecen al entrar en pantalla. Se activan solo si el navegador
  tiene `IntersectionObserver` y no se pidió reducir movimiento; si no, todo se ve estático desde el inicio.
  La demora sale de `data-d` (segundos) o se escalona entre hermanos.
- **Contadores**: dentro de `[data-counter="<demora ms>"]`, cada `[data-count]` cuenta de 0 al valor final.
- **Preguntas frecuentes**: `<details name="faq">` nativo; al abrir una se cierra la anterior, sin JS.
- **Notas internas** (`.nota`): indicaciones del borrador para Carlos. El botón del pie las oculta/muestra y
  recuerda la elección en `localStorage`.

## Pendientes antes de publicar

- [ ] Número real de WhatsApp (`wa.me/5491100000000`, aparece dos veces).
- [ ] Enviar el formulario a un backend o servicio de formularios (`js/main.js`, hoy solo muestra la confirmación).
- [ ] Links reales de Blog y LinkedIn en el pie.
- [ ] Fotos del hero y del equipo, logos de clientes y testimonios (están como notas).
- [ ] Respuesta de "¿Cuánto tarda en arrancar un servicio?".
- [ ] El hero dice "+10 provincias", pero el mapa marca 6 provincias + CABA: alinear dato y mapa.
- [ ] Quitar las notas internas (o el botón) en la versión pública.
- [ ] Favicon e imagen para compartir en redes (`og:image`).
