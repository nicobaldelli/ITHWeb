# Genera img/hex.svg (fondo de las secciones blancas). Correr: python3 img/hex.py
# Grilla de hexágonos sobre un plano en perspectiva (se aleja hacia arriba, girado en diagonal),
# con trazos de circuito sobre las aristas, pads y pulsos. Solo gris: el blanco sirve a las dos familias de color.
import math, random, os
random.seed(11)
W, H = 1440, 900
GRAY = "#2a2a2a"

# ---- plano ----
R = 58                      # radio del hexágono en el plano
dx = math.sqrt(3) * R
dy = 1.5 * R
YAW = math.radians(22)      # giro de la grilla dentro del plano (diagonal)

# ---- cámara ----
F = 950                     # distancia focal
ALPHA = math.radians(28)    # inclinación hacia abajo
HEYE = 420                  # altura del ojo sobre el plano
CY = 300                    # centro vertical de proyección (horizonte queda arriba del cuadro)

def project(u, v):
    # giro en el plano
    ur = u*math.cos(YAW) - v*math.sin(YAW)
    vr = u*math.sin(YAW) + v*math.cos(YAW) + 260   # 260: empuja el plano hacia adelante
    y, z = -HEYE, vr
    yc = y*math.cos(ALPHA) + z*math.sin(ALPHA)
    zc = -y*math.sin(ALPHA) + z*math.cos(ALPHA)
    if zc <= 40: return None
    return (W/2 + F*ur/zc, CY - F*yc/zc, zc)

def hex_pts(cx, cy, r=R):
    return [(cx + r*math.cos(math.radians(60*i - 90)), cy + r*math.sin(math.radians(60*i - 90))) for i in range(6)]
def key(p): return (round(p[0], 1), round(p[1], 1))
def fmt(p): return f"{p[0]:.1f} {p[1]:.1f}"

# grilla en el plano, amplia para cubrir el cuadro tras la proyección
hexes = []        # (pts_plano, pts_pantalla, z medio)
edges = set()
row = 0
v = -1200
while v < 4200:
    xoff = dx/2 if row % 2 else 0
    u = -3600 + xoff
    while u < 3600:
        pts = hex_pts(u, v)
        pr = [project(*p) for p in pts]
        if all(pr):
            xs = [p[0] for p in pr]; ys = [p[1] for p in pr]
            size = max(xs) - min(xs)
            if max(xs) > -80 and min(xs) < W+80 and max(ys) > -80 and min(ys) < H+80 and size > 22:
                hexes.append((pts, pr, sum(p[2] for p in pr)/6))
                for i in range(6):
                    edges.add(tuple(sorted((key(pts[i]), key(pts[(i+1) % 6])))))
        u += dx
    v += dy; row += 1

zs = sorted(h[2] for h in hexes)
zmin, zmax = zs[0], zs[-1]
def depth(z): return (z - zmin) / (zmax - zmin)      # 0 cerca, 1 lejos

# ---- grilla por bandas de profundidad ----
BANDS = 6
band_d = [[] for _ in range(BANDS)]
for pts, pr, z in hexes:
    b = min(BANDS-1, int(depth(z)*BANDS))
    band_d[b].append("M" + "L".join(fmt(p) for p in pr) + "Z")

# ---- trazos de circuito ----
adj = {}
for a, b in edges:
    adj.setdefault(a, set()).add(b); adj.setdefault(b, set()).add(a)
def on_screen(p):
    q = project(*p)
    return q and 0 <= q[0] <= W and 0 <= q[1] <= H
verts = [p for p in adj if on_screen(p)]
# más peso a los vértices cercanos: lejos hay muchos más y los trazos se irían todos al fondo
weights = [(1 - depth(project(*p)[2]))**2 + .05 for p in verts]

def walk(n):
    cur = random.choices(verts, weights)[0]; prev = None; path = [cur]
    for _ in range(n):
        opts = [q for q in adj[cur] if q != prev and project(*q)]
        if not opts: break
        prev, cur = cur, random.choice(opts); path.append(cur)
    return path

traces = [walk(random.randint(4, 8)) for _ in range(18)]

out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice">']
out.append(f'''<style>
.g{{fill:none;stroke:{GRAY};stroke-linejoin:round}}
.tr{{fill:none;stroke:{GRAY};stroke-linejoin:round;stroke-linecap:round}}
.pulse{{fill:none;stroke:{GRAY};stroke-linecap:round;stroke-dasharray:70 930;stroke-dashoffset:1000;animation:run 7s linear infinite}}
.pad{{fill:#fff;stroke:{GRAY}}}
.dot{{fill:{GRAY};animation:twinkle 4s ease-in-out infinite}}
.drift{{animation:drift 42s ease-in-out infinite}}
@keyframes run{{to{{stroke-dashoffset:-1000}}}}
@keyframes twinkle{{0%,100%{{fill-opacity:.2}}50%{{fill-opacity:.65}}}}
@keyframes drift{{50%{{transform:translate(-12px,8px)}}}}
@media (prefers-reduced-motion:reduce){{.pulse,.dot,.drift{{animation:none}}.pulse{{display:none}}}}
</style>''')
out.append(f'''<defs>
<radialGradient id="fade" cx="50%" cy="52%" r="70%">
<stop offset="0" stop-color="#111"/><stop offset=".3" stop-color="#333"/><stop offset="1" stop-color="#fff"/>
</radialGradient>
<mask id="edges"><rect width="{W}" height="{H}" fill="url(#fade)"/></mask>
</defs>''')
out.append('<g class="drift" mask="url(#edges)">')
for b, ds in enumerate(band_d):
    t = (b + .5) / BANDS
    sw = round(1.6 - 1.1*t, 2)            # 1.5 cerca → .6 lejos
    so = round(.27 - .20*t, 3)            # .25 cerca → .09 lejos
    out.append(f'<path class="g" stroke-width="{sw}" stroke-opacity="{so}" d="{"".join(ds)}"/>')

for p in traces:
    pr = [project(*q) for q in p]
    t = depth(sum(q[2] for q in pr)/len(pr))
    d = "M" + "L".join(fmt(q) for q in pr)
    sw = round(2.0 - 1.2*t, 2); so = round(.48 - .26*t, 2)
    dur = random.uniform(5, 9.5); delay = -random.uniform(0, dur)
    out.append(f'<path class="tr" stroke-width="{sw}" stroke-opacity="{so}" d="{d}"/>')
    out.append(f'<path class="pulse" pathLength="1000" stroke-width="{round(sw+.8,2)}" stroke-opacity="{round(.8-.4*t,2)}" style="animation-duration:{dur:.1f}s;animation-delay:{delay:.1f}s" d="{d}"/>')
    r = round(3.6 - 2.0*t, 1)
    for q in (pr[0], pr[-1]):
        out.append(f'<circle class="pad" stroke-width="{round(1.6-.8*t,2)}" stroke-opacity="{round(.55-.25*t,2)}" cx="{q[0]:.1f}" cy="{q[1]:.1f}" r="{r}"/>')
    for q in pr[1:-1]:
        if random.random() < .35:
            out.append(f'<circle class="dot" style="animation-delay:-{random.uniform(0,5):.1f}s" cx="{q[0]:.1f}" cy="{q[1]:.1f}" r="{round(2.0-1.1*t,1)}"/>')
out.append('</g></svg>')
open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "hex.svg"), "w").write("\n".join(out))
print("ok", len(hexes), "hex,", len(traces), "trazos")
