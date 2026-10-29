# Genera img/waves.svg (fondo de las secciones lila). Correr: python3 img/waves.py
# Campo de ondas: líneas finas violeta en paralelo que forman una superficie ondulada y fluyen despacio hacia un lado.
# Las líneas son periódicas en x (período P) y el grupo se desplaza -P en loop, así el movimiento no tiene cortes.
# Sobrio: opacidades bajas y desvanecido hacia el centro para no competir con el contenido.
import math, os
W, H = 1440, 900
PURPLE = "#B8A3D1"  # violeta aclarado (47 % violeta + 53 % blanco), pedido del cliente

def layer(n, y0, spacing, P, a1, a2, k1, k2, op_lo, op_hi, sw, step=20):
    paths = []
    for k in range(n):
        yk = y0 + k * spacing
        pts = []
        x = -P
        while x <= W + P + step:
            t = 2 * math.pi * x / P
            y = yk + a1 * math.sin(t + k * k1) + a2 * math.sin(2 * t + k * k2 + 1.1)
            pts.append(f"{x:.0f} {y:.0f}")
            x += step
        # brillo por bandas: algunas líneas más presentes, como el reflejo de la luz sobre la superficie
        op = op_lo + (op_hi - op_lo) * (0.5 + 0.5 * math.sin(k * 0.42 + 0.6))
        paths.append(f'<path d="M{"L".join(pts)}" stroke-width="{sw}" stroke-opacity="{op:.3f}"/>')
    return "\n".join(paths)

# Las dos capas cubren toda la altura (con margen por la amplitud), así el fondo llena cualquier sección con `cover`
front = layer(n=140, y0=-160, spacing=9, P=1440, a1=95, a2=38, k1=0.055, k2=0.11, op_lo=.26, op_hi=.70, sw=1.25)
back = layer(n=90, y0=-120, spacing=13, P=960, a1=60, a2=24, k1=0.07, k2=0.09, op_lo=.12, op_hi=.32, sw=1.1)

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice">
<style>
.w{{fill:none;stroke:{PURPLE};stroke-linecap:round}}
.flow-a{{animation:flowA 84s linear infinite}}
.flow-b{{animation:flowB 120s linear infinite}}
.sway{{animation:sway 24s ease-in-out infinite}}
@keyframes flowA{{to{{transform:translateX(-1440px)}}}}
@keyframes flowB{{to{{transform:translateX(960px)}}}}
@keyframes sway{{50%{{transform:translateY(-14px)}}}}
@media (prefers-reduced-motion:reduce){{.flow-a,.flow-b,.sway{{animation:none}}}}
</style>
<defs>
<radialGradient id="fade" cx="50%" cy="50%" r="72%">
<stop offset="0" stop-color="#333"/><stop offset=".3" stop-color="#666"/><stop offset="1" stop-color="#fff"/>
</radialGradient>
<mask id="edges"><rect width="{W}" height="{H}" fill="url(#fade)"/></mask>
</defs>
<g class="sway" mask="url(#edges)">
<g class="w flow-b" transform="translate(-960 0)">
{back}
</g>
<g class="w flow-a">
{front}
</g>
</g>
</svg>'''
open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "waves.svg"), "w").write(svg)
print("ok", len(svg) // 1024, "KB")
