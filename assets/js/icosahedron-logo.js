// Small rotating wireframe icosahedron next to the site title.
// Color follows PaperMod's theme: white in dark, black in light.
// Derived from /home/l/code/agy boot-logo renderer, tuned for ~30px display.

(function () {
  function mount(canvas) {
    const ctx = canvas.getContext('2d');
    const dpr = Math.max(1, window.devicePixelRatio || 1);

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    resize();
    window.addEventListener('resize', resize);

    // ── Icosahedron geometry (golden-ratio vertices) ────────────────────
    const PHI = (1 + Math.sqrt(5)) / 2;
    const vertices = [
      [ 0,    1,    PHI], [ 0,    1,   -PHI], [ 0,   -1,    PHI], [ 0,   -1,   -PHI],
      [ 1,    PHI,  0  ], [ 1,   -PHI,  0  ], [-1,    PHI,  0  ], [-1,   -PHI,  0  ],
      [ PHI,  0,    1  ], [ PHI,  0,   -1  ], [-PHI,  0,    1  ], [-PHI,  0,   -1  ],
    ];
    const edges = [];
    const EDGE_LEN_SQ = 4;
    for (let i = 0; i < vertices.length; i++) {
      for (let j = i + 1; j < vertices.length; j++) {
        const dx = vertices[i][0] - vertices[j][0];
        const dy = vertices[i][1] - vertices[j][1];
        const dz = vertices[i][2] - vertices[j][2];
        if (Math.abs(dx * dx + dy * dy + dz * dz - EDGE_LEN_SQ) < 0.01) {
          edges.push([i, j]);
        }
      }
    }

    const Z_RANGE = 3.8;
    const pitch0 = 14 * Math.PI / 180;
    let angleY = 0, angleX = 0, frame = 0, rafId = null;

    function currentTheme() {
      const t = document.documentElement.dataset.theme;
      const isDark = t === 'dark'
        ? true
        : t === 'light'
          ? false
          : window.matchMedia('(prefers-color-scheme: dark)').matches;
      return { color: isDark ? '#ffffff' : '#000000', isDark };
    }

    function render() {
      const { color, isDark } = currentTheme();
      // Dark mode: white glow against dark bg is intense, so dampen it.
      const glowScale = isDark ? 0.4 : 1;
      frame++;
      angleY += 0.75;
      angleX += 0.18;
      const wobble = Math.sin(frame * 0.018) * 0.10;

      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2, cy = h / 2;
      const D = 3.8;
      const scale = w * 0.34;

      const radY = angleY * Math.PI / 180;
      const radX = angleX * Math.PI / 180;
      const cosY = Math.cos(radY), sinY = Math.sin(radY);
      const cosX = Math.cos(radX), sinX = Math.sin(radX);
      const cosP = Math.cos(pitch0 + wobble), sinP = Math.sin(pitch0 + wobble);

      const project = (x, y, z) => {
        let rx = x * cosY - z * sinY;
        let rz = x * sinY + z * cosY;
        let ry = y;
        const ny = ry * cosX - rz * sinX;
        const nz = ry * sinX + rz * cosX;
        ry = ny; rz = nz;
        const fy = ry * cosP - rz * sinP;
        const fz = ry * sinP + rz * cosP;
        const f = 1 / (D - fz);
        return { px: cx + rx * scale * f, py: cy - fy * scale * f, z: fz };
      };

      const projected = vertices.map(v => project(v[0], v[1], v[2]));

      const sortedEdges = edges.map((e, i) => {
        const [u, v] = e;
        return { u, v, i, avgZ: (projected[u].z + projected[v].z) / 2 };
      }).sort((a, b) => a.avgZ - b.avgZ);

      // Wireframe edges with depth-modulated opacity + subtle glow
      for (const edge of sortedEdges) {
        const { u, v, avgZ } = edge;
        const p0 = projected[u], p1 = projected[v];
        const dn = Math.max(0, Math.min(1, (avgZ + Z_RANGE / 2) / Z_RANGE));
        const op = 0.22 + 0.68 * dn;
        const lw = (0.6 + 1.0 * dn) * dpr;

        ctx.save();
        ctx.globalAlpha = op;
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.lineCap = 'round';
        ctx.shadowColor = color;
        ctx.shadowBlur = (1.5 + 3 * dn) * dpr;
        ctx.beginPath();
        ctx.moveTo(p0.px, p0.py);
        ctx.lineTo(p1.px, p1.py);
        ctx.stroke();
        ctx.restore();
      }

      // Vertex dots with pulse
      const pulse = 0.55 + 0.45 * Math.sin(angleY * 0.06);
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        const dn = Math.max(0.25, Math.min(1, (p.z + Z_RANGE / 2) / Z_RANGE));
        const r = (0.8 + 0.7 * pulse) * dn * dpr;

        ctx.save();
        ctx.globalAlpha = 0.5 + 0.5 * dn;
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 4 * pulse * dpr;
        ctx.beginPath();
        ctx.arc(p.px, p.py, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    function loop() {
      render();
      rafId = requestAnimationFrame(loop);
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      render();
    } else {
      rafId = requestAnimationFrame(loop);
    }
  }

  function init() {
    const canvas = document.getElementById('site-logo-canvas');
    if (canvas) mount(canvas);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
