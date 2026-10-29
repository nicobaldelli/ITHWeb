# Genera img/hex.svg (fondo de las secciones blancas). Correr: python3 img/hex.py
import math, random
random.seed(7)
W, H = 1440, 900
R = 44                      # radio del hexágono (vértice arriba)
dx = math.sqrt(3) * R       # paso horizontal
dy = 1.5 * R                # paso vertical
GRAY = "#2a2a2a"

def hex_pts(cx, cy, r=R):
    return [(cx + r*math.cos(math.radians(60*i - 90)), cy + r*math.sin(math.radians(60*i - 90))) for i in range(6)]

def key(p): return (round(p[0], 1), round(p[1], 1))
def fmt(p): return f"{p[0]:.1f} {p[1]:.1f}"

centers, grid_d, edges = [], [], set()
row = 0
y = -2*R
while y < H + 2*R:
    xoff = dx/2 if row % 2 else 0
    x = -dx + xoff
    while x < W + dx:
        centers.append((x, y))
        pts = hex_pts(x, y)
        grid_d.append("M" + "L".join(fmt(p) for p in pts) + "Z")
        for i in range(6):
            a, b = key(pts[i]), key(pts[(i+1) % 6])
            edges.add(tuple(sorted((a, b))))
        x += dx
    y += dy; row += 1

adj = {}
for a, b in edges:
    adj.setdefault(a, set()).add(b); adj.setdefault(b, set()).add(a)
verts = [v for v in adj if 0 <= v[0] <= W and 0 <= v[1] <= H]

def walk(n):
    cur = random.choice(verts); prev = None; path = [cur]
    for _ in range(n):
        opts = [v for v in adj[cur] if v != prev]
        if not opts: break
        prev, cur = cur, random.choice(opts); path.append(cur)
    return path

traces = []
for i in range(16):
    traces.append(walk(random.randint(4, 8)))

hx = random.sample(centers, 14)

def trace_d(p): return "M" + "L".join(fmt(v) for v in p)

out = []
out.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice">')
out.append(f'''<style>
.grid{{fill:none;stroke:{GRAY};stroke-width:1.25;stroke-opacity:.17;stroke-linejoin:round}}
.hx{{fill:{GRAY};fill-opacity:.06;animation:breathe 9s ease-in-out infinite}}
.tr{{fill:none;stroke:{GRAY};stroke-width:1.6;stroke-opacity:.36;stroke-linejoin:round;stroke-linecap:round}}
.pulse{{fill:none;stroke:{GRAY};stroke-width:2.2;stroke-linecap:round;stroke-opacity:.75;stroke-dasharray:70 930;stroke-dashoffset:1000;animation:run 9s linear infinite}}
.pad{{fill:#fff;stroke:{GRAY};stroke-width:1.5;stroke-opacity:.5}}
.dot{{fill:{GRAY};fill-opacity:.45;animation:twinkle 5s ease-in-out infinite}}
.drift{{animation:drift 60s ease-in-out infinite}}
@keyframes breathe{{0%,100%{{fill-opacity:.04}}50%{{fill-opacity:.14}}}}
@keyframes run{{to{{stroke-dashoffset:-1000}}}}
@keyframes twinkle{{0%,100%{{fill-opacity:.25}}50%{{fill-opacity:.7}}}}
@keyframes drift{{50%{{transform:translate(-14px,10px)}}}}
@media (prefers-reduced-motion:reduce){{.hx,.pulse,.dot,.drift{{animation:none}}.pulse{{display:none}}}}
</style>''')
out.append('''<defs>
<radialGradient id="fade" cx="50%%" cy="50%%" r="72%%">
<stop offset="0" stop-color="#111"/><stop offset=".3" stop-color="#333"/><stop offset="1" stop-color="#fff"/>
</radialGradient>
<mask id="edges"><rect width="%d" height="%d" fill="url(#fade)"/></mask>
</defs>''' % (W, H))
out.append('<g class="drift" mask="url(#edges)">')
out.append('<path class="grid" d="' + "".join(grid_d) + '"/>')
for c in hx:
    out.append(f'<path class="hx" style="animation-delay:-{random.uniform(0,9):.1f}s" d="M{"L".join(fmt(p) for p in hex_pts(c[0], c[1], R-4))}Z"/>')
for i, p in enumerate(traces):
    d = trace_d(p)
    dur = random.uniform(7, 13); delay = -random.uniform(0, dur)
    out.append(f'<path class="tr" d="{d}"/>')
    out.append(f'<path class="pulse" pathLength="1000" style="animation-duration:{dur:.1f}s;animation-delay:{delay:.1f}s" d="{d}"/>')
    out.append(f'<circle class="pad" cx="{p[0][0]}" cy="{p[0][1]}" r="3.2"/>')
    out.append(f'<circle class="pad" cx="{p[-1][0]}" cy="{p[-1][1]}" r="3.2"/>')
    for v in p[1:-1]:
        if random.random() < .35:
            out.append(f'<circle class="dot" style="animation-delay:-{random.uniform(0,5):.1f}s" cx="{v[0]}" cy="{v[1]}" r="1.8"/>')
out.append('</g></svg>')
import os; open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "hex.svg"), "w").write("\n".join(out))
print("ok", len(grid_d), "hex,", len(traces), "trazos")
