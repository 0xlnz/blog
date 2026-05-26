// Wireframe icosahedron renderer. Used for the header logo and reusable via
// the {{< icosahedron >}} shortcode. Exposes window.createIcosahedron(canvas, opts).
//
// Options:
//   autospin:  bool   — slow auto-rotation when not being dragged (default true)
//   draggable: bool   — desktop mouse drag rotates the shape (default true)
//   color:     string — 'auto' follows data-theme (white/dark, black/light), or any CSS color

(function () {
  const mounted = new WeakSet();

  function createIcosahedron(canvas, opts) {
    if (!canvas || mounted.has(canvas)) return null;
    mounted.add(canvas);

    const options = Object.assign({
      autospin: true,
      draggable: true,
      color: 'auto',
    }, opts || {});

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

    // Per-instance state
    let angleY = 0, angleX = 0, frame = 0, rafId = null;
    let dragging = false;
    let lastPointerX = 0, lastPointerY = 0;
    let velX = 0, velY = 0; // residual angular velocity in deg/frame (Y from x-drag, X from y-drag)

    // Auto-spin increments (matches the pre-refactor values)
    const AUTO_SPIN_Y = 0.75;
    const AUTO_SPIN_X = 0.18;
    const DRAG_SENSITIVITY = 0.4;     // deg/px
    const INERTIA_DECAY = 0.93;       // per-frame multiplier
    const RESUME_THRESHOLD = 0.2;     // deg/frame; below this auto-spin contributes

    function colors() {
      if (options.color && options.color !== 'auto') {
        return { color: options.color, isDark: false };
      }
      const t = document.documentElement.dataset.theme;
      const isDark = t === 'dark'
        ? true
        : t === 'light'
          ? false
          : window.matchMedia('(prefers-color-scheme: dark)').matches;
      return { color: isDark ? '#ffffff' : '#000000', isDark };
    }

    // ── Pointer drag (desktop mouse only) ───────────────────────────────
    function onPointerDown(e) {
      if (e.pointerType !== 'mouse') return;
      dragging = true;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      velX = 0;
      velY = 0;
      canvas.classList.add('dragging');
      try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault();
    }

    function onPointerMove(e) {
      if (!dragging || e.pointerType !== 'mouse') return;
      const dx = e.clientX - lastPointerX;
      const dy = e.clientY - lastPointerY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      const dyaw = dx * DRAG_SENSITIVITY;
      const dpitch = dy * DRAG_SENSITIVITY;
      angleY += dyaw;
      angleX += dpitch;
      velY = dyaw;     // velocity for Y angle (from horizontal drag)
      velX = dpitch;   // velocity for X angle (from vertical drag)
    }

    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      canvas.classList.remove('dragging');
      if (e && canvas.hasPointerCapture && canvas.hasPointerCapture(e.pointerId)) {
        try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
      }
    }

    if (options.draggable) {
      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerup', endDrag);
      canvas.addEventListener('pointercancel', endDrag);
      canvas.addEventListener('lostpointercapture', endDrag);
    }

    // ── Animation step ──────────────────────────────────────────────────
    function update() {
      if (dragging) return; // angles already updated by pointermove
      // Apply residual inertia, decaying each frame.
      angleY += velY;
      angleX += velX;
      velY *= INERTIA_DECAY;
      velX *= INERTIA_DECAY;
      // Once inertia has faded, layer the auto-spin back in.
      if (options.autospin && Math.abs(velY) < RESUME_THRESHOLD && Math.abs(velX) < RESUME_THRESHOLD) {
        angleY += AUTO_SPIN_Y;
        angleX += AUTO_SPIN_X;
      }
    }

    function render() {
      const { color, isDark } = colors();
      const glowScale = isDark ? 0.6 : 1;
      frame++;
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
        ctx.shadowBlur = (1.5 + 3 * dn) * dpr * glowScale;
        ctx.beginPath();
        ctx.moveTo(p0.px, p0.py);
        ctx.lineTo(p1.px, p1.py);
        ctx.stroke();
        ctx.restore();
      }

      const pulse = 0.55 + 0.45 * Math.sin(angleY * 0.06);
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        const dn = Math.max(0.25, Math.min(1, (p.z + Z_RANGE / 2) / Z_RANGE));
        const r = (0.8 + 0.7 * pulse) * dn * dpr;

        ctx.save();
        ctx.globalAlpha = 0.5 + 0.5 * dn;
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 4 * pulse * dpr * glowScale;
        ctx.beginPath();
        ctx.arc(p.px, p.py, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    function loop() {
      update();
      render();
      rafId = requestAnimationFrame(loop);
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      render();
    } else {
      rafId = requestAnimationFrame(loop);
    }

    return {
      destroy() {
        if (rafId != null) cancelAnimationFrame(rafId);
        rafId = null;
        canvas.removeEventListener('pointerdown', onPointerDown);
        canvas.removeEventListener('pointermove', onPointerMove);
        canvas.removeEventListener('pointerup', endDrag);
        canvas.removeEventListener('pointercancel', endDrag);
        canvas.removeEventListener('lostpointercapture', endDrag);
      },
    };
  }

  // Expose for the shortcode and any external callers.
  window.createIcosahedron = createIcosahedron;

  function autoMount() {
    const headerCanvas = document.getElementById('site-logo-canvas');
    if (headerCanvas) {
      createIcosahedron(headerCanvas, { autospin: true, draggable: true, color: 'auto' });
    }
    const shortcodeCanvases = document.querySelectorAll('canvas[data-icosahedron-config]');
    shortcodeCanvases.forEach(c => {
      let cfg = {};
      try { cfg = JSON.parse(c.dataset.icosahedronConfig || '{}'); } catch (_) {}
      createIcosahedron(c, cfg);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoMount);
  } else {
    autoMount();
  }
})();
