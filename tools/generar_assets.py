#!/usr/bin/env python3
"""
generar_assets.py - Pack PNG de "Juegofy: Mundo Mágico"
Salida: ./assets-png/*.png  y  ./assets-svg/*.svg
"""
import os, math, random

try:
    import cairosvg
except ImportError:
    raise SystemExit("Falta cairosvg -> pip install cairosvg")

OUT_PNG, OUT_SVG = "assets-png", "assets-svg"
os.makedirs(OUT_PNG, exist_ok=True)
os.makedirs(OUT_SVG, exist_ok=True)

MORADO, VIOLETA = "#6C5CE7", "#8B7CF6"
TURQUESA, AMARILLO = "#00CEC9", "#FFD166"
CORAL, ROSA = "#FF6B6B", "#FFB8C6"
BLANCO, TEXTO = "#FFFFFF", "#2D3436"


def guardar(nombre, svg, w, h):
    base = nombre.replace(".png", "")
    open(os.path.join(OUT_SVG, base + ".svg"), "w", encoding="utf-8").write(svg)
    cairosvg.svg2png(bytestring=svg.encode("utf-8"),
                     write_to=os.path.join(OUT_PNG, nombre),
                     output_width=w, output_height=h, background_color=None)
    print("  OK", nombre)


def estrella(cx, cy, r, fill, inner=0.45, rot=-90):
    pts = []
    for i in range(10):
        a = math.radians(rot + i * 36)
        rad = r if i % 2 == 0 else r * inner
        pts.append("{:.1f},{:.1f}".format(cx + rad * math.cos(a), cy + rad * math.sin(a)))
    return '<polygon points="{}" fill="{}"/>'.format(" ".join(pts), fill)


# ---------------- LOGO ----------------
def svg_logo_icono():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="{MORADO}"/><stop offset="1" stop-color="{TURQUESA}"/></linearGradient></defs>
<circle cx="256" cy="256" r="200" fill="url(#g)"/>
<ellipse cx="196" cy="120" rx="36" ry="52" fill="{MORADO}" transform="rotate(-16 196 120)"/>
<ellipse cx="316" cy="120" rx="36" ry="52" fill="{MORADO}" transform="rotate(16 316 120)"/>
<circle cx="200" cy="248" r="30" fill="{BLANCO}"/><circle cx="312" cy="248" r="30" fill="{BLANCO}"/>
<circle cx="209" cy="239" r="11" fill="{TEXTO}"/><circle cx="321" cy="239" r="11" fill="{TEXTO}"/>
<path d="M208 310 Q256 356 304 310" stroke="{BLANCO}" stroke-width="22" fill="none" stroke-linecap="round"/>
{estrella(256, 380, 40, AMARILLO, 0.44)}
</svg>'''


def svg_logo():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 512" width="1024" height="512">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="{MORADO}"/><stop offset="1" stop-color="{TURQUESA}"/></linearGradient></defs>
<circle cx="256" cy="256" r="176" fill="url(#g)"/>
<ellipse cx="204" cy="140" rx="34" ry="48" fill="{MORADO}" transform="rotate(-16 204 140)"/>
<ellipse cx="308" cy="140" rx="34" ry="48" fill="{MORADO}" transform="rotate(16 308 140)"/>
<circle cx="208" cy="250" r="24" fill="{BLANCO}"/><circle cx="304" cy="250" r="24" fill="{BLANCO}"/>
<circle cx="215" cy="243" r="9" fill="{TEXTO}"/><circle cx="311" cy="243" r="9" fill="{TEXTO}"/>
<path d="M216 306 Q256 344 296 306" stroke="{BLANCO}" stroke-width="18" fill="none" stroke-linecap="round"/>
{estrella(256, 360, 34, AMARILLO, 0.44)}
<text x="470" y="255" font-family="Nunito, Baloo 2, Segoe UI, sans-serif" font-size="104"
 font-weight="800" fill="{TEXTO}">Juegofy</text>
<text x="474" y="332" font-family="Nunito, Segoe UI, sans-serif" font-size="44"
 font-weight="700" fill="{MORADO}">Mundo Magico</text>
</svg>'''


# ---------------- MASCOTA ----------------
def svg_mascota(celebrando=False):
    brazos = (
        f'<ellipse cx="196" cy="420" rx="82" ry="56" fill="{MORADO}" transform="rotate(-55 196 420)"/>'
        f'<ellipse cx="828" cy="420" rx="82" ry="56" fill="{MORADO}" transform="rotate(55 828 420)"/>'
        if celebrando else
        f'<ellipse cx="212" cy="660" rx="78" ry="54" fill="{MORADO}" transform="rotate(22 212 660)"/>'
        f'<ellipse cx="812" cy="660" rx="78" ry="54" fill="{MORADO}" transform="rotate(-22 812 660)"/>'
    )
    if celebrando:
        ojos = (f'<path d="M394 505 Q430 460 466 505" stroke="{TEXTO}" stroke-width="18" fill="none" stroke-linecap="round"/>'
                f'<path d="M558 505 Q594 460 630 505" stroke="{TEXTO}" stroke-width="18" fill="none" stroke-linecap="round"/>')
        boca = f'<ellipse cx="512" cy="600" rx="54" ry="44" fill="{TEXTO}"/><ellipse cx="512" cy="618" rx="30" ry="22" fill="{CORAL}"/>'
    else:
        ojos = (f'<ellipse cx="430" cy="490" rx="36" ry="42" fill="{TEXTO}"/>'
                f'<ellipse cx="594" cy="490" rx="36" ry="42" fill="{TEXTO}"/>'
                f'<circle cx="443" cy="474" r="13" fill="{BLANCO}"/><circle cx="607" cy="474" r="13" fill="{BLANCO}"/>')
        boca = f'<path d="M444 578 Q512 646 580 578" stroke="{TEXTO}" stroke-width="18" fill="none" stroke-linecap="round"/>'

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
<ellipse cx="512" cy="930" rx="255" ry="44" fill="{TEXTO}" opacity="0.13"/>
<ellipse cx="292" cy="330" rx="92" ry="124" fill="{MORADO}" transform="rotate(-16 292 330)"/>
<ellipse cx="732" cy="330" rx="92" ry="124" fill="{MORADO}" transform="rotate(16 732 330)"/>
<ellipse cx="300" cy="342" rx="46" ry="72" fill="{ROSA}" transform="rotate(-16 300 342)"/>
<ellipse cx="724" cy="342" rx="46" ry="72" fill="{ROSA}" transform="rotate(16 724 342)"/>
{brazos}
<ellipse cx="512" cy="580" rx="292" ry="298" fill="{MORADO}"/>
<ellipse cx="512" cy="700" rx="186" ry="150" fill="#EAF7FF"/>
<ellipse cx="512" cy="700" rx="186" ry="150" fill="{TURQUESA}" opacity="0.16"/>
{estrella(512, 360, 44, AMARILLO, 0.44)}
{ojos}
{boca}
<ellipse cx="368" cy="570" rx="42" ry="26" fill="{ROSA}" opacity="0.8"/>
<ellipse cx="656" cy="570" rx="42" ry="26" fill="{ROSA}" opacity="0.8"/>
</svg>'''


# ---------------- FONDOS ----------------
def svg_fondo_hub():
    random.seed(7)
    est = "".join(f'<circle cx="{random.uniform(0,1920):.0f}" cy="{random.uniform(0,760):.0f}" '
                  f'r="{random.uniform(2,6):.1f}" fill="{BLANCO}" opacity="{random.uniform(.35,.95):.2f}"/>'
                  for _ in range(90))
    nubes = ""
    for cx, cy, s in [(280,240,1.0),(820,170,.75),(1450,300,1.2),(620,430,.6),(1660,520,.85),(120,570,.7)]:
        nubes += (f'<g opacity="0.28" transform="translate({cx} {cy}) scale({s})">'
                  f'<ellipse cx="0" cy="0" rx="130" ry="52" fill="{BLANCO}"/>'
                  f'<ellipse cx="-70" cy="16" rx="80" ry="38" fill="{BLANCO}"/>'
                  f'<ellipse cx="74" cy="18" rx="86" ry="40" fill="{BLANCO}"/></g>')
    islas = ""
    for cx, cy, s, col in [(360,860,1.0,TURQUESA),(1560,790,.85,CORAL),(980,960,1.15,AMARILLO)]:
        islas += (f'<g transform="translate({cx} {cy}) scale({s})">'
                  f'<ellipse cx="0" cy="70" rx="150" ry="46" fill="{col}" opacity="0.30"/>'
                  f'<path d="M-170 40 Q0 -70 170 40 Q0 96 -170 40 Z" fill="{col}" opacity="0.5"/>'
                  f'<ellipse cx="0" cy="36" rx="150" ry="40" fill="{col}"/></g>')
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
<defs><linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#3B2E8F"/><stop offset="0.5" stop-color="{MORADO}"/>
<stop offset="1" stop-color="{TURQUESA}"/></linearGradient></defs>
<rect width="1920" height="1080" fill="url(#cielo)"/>
{est}{nubes}{islas}
</svg>'''


def svg_fondo_turbo():
    random.seed(3)
    est = "".join(f'<circle cx="{random.uniform(0,1920):.0f}" cy="{random.uniform(0,1080):.0f}" '
                  f'r="{random.uniform(1.5,4):.1f}" fill="{BLANCO}" opacity="{random.uniform(.2,.7):.2f}"/>'
                  for _ in range(70))
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
<defs><linearGradient id="esp" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#221C4A"/><stop offset="1" stop-color="#4B3FC4"/></linearGradient></defs>
<rect width="1920" height="1080" fill="url(#esp)"/>
{est}
<path d="M600 1080 L880 0 L1040 0 L1320 1080 Z" fill="#2D3436"/>
<path d="M600 1080 L880 0 L900 0 L636 1080 Z" fill="{TURQUESA}" opacity="0.85"/>
<path d="M1320 1080 L1040 0 L1020 0 L1284 1080 Z" fill="{TURQUESA}" opacity="0.85"/>
<line x1="840" y1="1080" x2="933" y2="0" stroke="{AMARILLO}" stroke-width="16" stroke-dasharray="48 44"/>
<line x1="1080" y1="1080" x2="987" y2="0" stroke="{AMARILLO}" stroke-width="16" stroke-dasharray="48 44"/>
<path d="M960 200 L1020 300 L900 300 Z" fill="{CORAL}" opacity="0.85"/>
<path d="M960 380 L1020 480 L900 480 Z" fill="{CORAL}" opacity="0.65"/>
<path d="M960 560 L1020 660 L900 660 Z" fill="{CORAL}" opacity="0.45"/>
</svg>'''


def svg_fondo_puzzle():
    cols, rows, pw, ph, gap = 4, 3, 320, 260, 28
    ox = (1920 - cols * pw - (cols - 1) * gap) / 2
    oy = (1080 - rows * ph - (rows - 1) * gap) / 2
    piezas = ""
    for r in range(rows):
        for c in range(cols):
            x, y = ox + c * (pw + gap), oy + r * (ph + gap)
            piezas += (f'<rect x="{x:.0f}" y="{y:.0f}" width="{pw}" height="{ph}" rx="36" '
                       f'fill="{BLANCO}" fill-opacity="0.18" stroke="{BLANCO}" '
                       f'stroke-width="4" stroke-opacity="0.5"/>')
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
<defs><radialGradient id="mesa" cx="50%" cy="42%" r="72%">
<stop offset="0" stop-color="#00A8A4"/><stop offset="1" stop-color="#0B3B5C"/></radialGradient></defs>
<rect width="1920" height="1080" fill="url(#mesa)"/>
<circle cx="960" cy="500" r="520" fill="{TURQUESA}" opacity="0.12"/>
{piezas}
</svg>'''


# ---------------- OBJETOS ----------------
def svg_vehiculo():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
<ellipse cx="512" cy="890" rx="220" ry="40" fill="{TEXTO}" opacity="0.15"/>
<path d="M420 700 Q512 950 604 700 Z" fill="{CORAL}"/>
<path d="M462 700 Q512 870 562 700 Z" fill="{AMARILLO}"/>
<path d="M300 560 L200 770 L320 726 Z" fill="{VIOLETA}"/>
<path d="M724 560 L824 770 L704 726 Z" fill="{VIOLETA}"/>
<path d="M512 90 L700 360 Q760 460 740 660 Q730 790 512 806 Q294 790 284 660 Q264 460 324 360 Z" fill="{MORADO}"/>
<path d="M512 250 L644 430 Q664 520 644 584 L380 584 Q360 520 380 430 Z" fill="{TURQUESA}"/>
<path d="M512 250 L644 430 Q664 520 644 584 L512 584 Z" fill="{BLANCO}" opacity="0.35"/>
{estrella(512, 175, 38, AMARILLO, 0.44)}
</svg>'''


def svg_pieza():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
<path d="M80 140 h90 a40 40 0 1 1 80 0 h182 v90 a40 40 0 1 1 0 80 v122 h-352 z"
 fill="{MORADO}" stroke="{BLANCO}" stroke-width="10" stroke-linejoin="round"/>
<path d="M80 140 h90 a40 40 0 1 1 80 0 h182 v90 a40 40 0 1 1 0 80 v122 h-352 z"
 fill="{BLANCO}" opacity="0.12"/>
</svg>'''


def svg_badge():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
<path d="M180 320 L146 480 L216 442 L256 508 L296 442 L366 480 L332 320 Z" fill="{CORAL}"/>
<circle cx="256" cy="228" r="152" fill="{MORADO}"/>
<circle cx="256" cy="228" r="118" fill="{AMARILLO}"/>
{estrella(256, 228, 82, BLANCO, 0.46)}
</svg>'''


def svg_confeti():
    random.seed(11)
    fig = ""
    cols = [AMARILLO, CORAL, TURQUESA, ROSA, BLANCO, VIOLETA]
    for _ in range(120):
        x, y = random.uniform(0, 1024), random.uniform(0, 1024)
        s, rot, c = random.uniform(8, 26), random.uniform(0, 360), random.choice(cols)
        if random.random() < 0.55:
            fig += f'<rect x="{x:.0f}" y="{y:.0f}" width="{s:.0f}" height="{s*0.5:.0f}" rx="4" fill="{c}" transform="rotate({rot:.0f} {x:.0f} {y:.0f})" opacity="0.95"/>'
        else:
            fig += f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{s/2:.0f}" fill="{c}" opacity="0.95"/>'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">{fig}</svg>'''


def svg_flecha():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
<path d="M150 90 L360 256 L150 422" fill="none" stroke="{BLANCO}" stroke-width="64" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M150 90 L360 256 L150 422" fill="none" stroke="{AMARILLO}" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>
</svg>'''


# ---------------- ICONOS UI ----------------
def svg_iconos():
    def env(inner):
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">'
                f'<rect x="8" y="8" width="240" height="240" rx="66" fill="{MORADO}"/>'
                f'<g stroke="{BLANCO}" stroke-width="14" fill="none" stroke-linecap="round" '
                f'stroke-linejoin="round">{inner}</g></svg>')

    spokes = "".join(
        f'<line x1="{128+32*math.cos(math.radians(a)):.0f}" y1="{128+32*math.sin(math.radians(a)):.0f}" '
        f'x2="{128+58*math.cos(math.radians(a)):.0f}" y2="{128+58*math.sin(math.radians(a)):.0f}"/>'
        for a in range(0, 360, 45))

    return {
        "icono-audio.png": env(
            f'<path d="M96 100 L128 100 L166 72 L166 184 L128 156 L96 156 Z" fill="{BLANCO}" stroke="none"/>'
            f'<path d="M190 100 a36 36 0 0 1 0 56"/>'
            f'<path d="M210 82 a62 62 0 0 1 0 92"/>'),
        "icono-play.png": env(f'<path d="M100 84 L178 128 L100 172 Z" fill="{BLANCO}" stroke="none"/>'),
        "icono-pausa.png": env(
            f'<rect x="98" y="84" width="22" height="88" rx="9" fill="{BLANCO}" stroke="none"/>'
            f'<rect x="136" y="84" width="22" height="88" rx="9" fill="{BLANCO}" stroke="none"/>'),
        "icono-home.png": env('<path d="M72 126 L128 78 L184 126"/>'
                              '<path d="M94 122 v52 a10 10 0 0 0 10 10 h48 a10 10 0 0 0 10-10 v-52"/>'),
        "icono-trofeo.png": env('<path d="M92 78 h72 v40 a36 36 0 0 1-72 0z"/>'
                                '<path d="M92 90 h-18 a18 18 0 0 0 18 18"/>'
                                '<path d="M164 90 h18 a18 18 0 0 1-18 18"/>'
                                '<path d="M128 154 v26"/><path d="M100 190 h56"/>'),
        "icono-estrella.png": env(f'<polygon points="128,70 150,114 198,122 162,157 172,205 128,180 84,205 94,157 58,122 106,114" fill="{BLANCO}" stroke="none"/>'),
        "icono-candado.png": env('<rect x="86" y="124" width="84" height="68" rx="18"/>'
                                 '<path d="M104 124 v-20 a24 24 0 0 1 48 0 v20"/>'),
        "icono-ajustes.png": env(f'<circle cx="128" cy="128" r="26"/>{spokes}'),
    }


# ---------------- MAIN ----------------
if __name__ == "__main__":
    print("Generando pack Juegofy...")
    guardar("logo-juegofy-horizontal.png", svg_logo(), 1024, 512)
    guardar("logo-juegofy-icon.png", svg_logo_icono(), 512, 512)
    guardar("mascota-jugi-feliz.png", svg_mascota(), 1024, 1024)
    guardar("mascota-jugi-celebra.png", svg_mascota(celebrando=True), 1024, 1024)
    guardar("bg-hub-magico.png", svg_fondo_hub(), 1920, 1080)
    guardar("bg-piloto-turbo.png", svg_fondo_turbo(), 1920, 1080)
    guardar("bg-puzzle-magico.png", svg_fondo_puzzle(), 1920, 1080)
    guardar("vehiculo-turbo.png", svg_vehiculo(), 1024, 1024)
    guardar("puzzle-pieza.png", svg_pieza(), 512, 512)
    guardar("badge-estrella.png", svg_badge(), 512, 512)
    guardar("fx-confeti.png", svg_confeti(), 1024, 1024)
    guardar("tutorial-flecha.png", svg_flecha(), 512, 512)
    for n, s in svg_iconos().items():
        guardar(n, s, 256, 256)
    print("Listo ->", OUT_PNG)
    print("SVG  ->", OUT_SVG)
