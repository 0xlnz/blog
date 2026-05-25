// Core Terminal Application State Manager
class RetroTerminal {
  constructor() {
    this.history = [];
    this.historyIndex = -1;
    this.isMuted = false;
    
    // Asynchronous typewriter/runner state
    this.isWriting = false;
    this.scriptQueue = [];
    
    // Matrix effect state
    this.matrixActive = false;
    this.matrixCanvas = null;
    this.matrixCtx = null;
    this.matrixInterval = null;
    this.matrixDrops = [];
    this.matrixFontSize = 16;
    
    // Web Audio Context (created lazily on interaction)
    this.audioCtx = null;

    // Bind event handlers
    this.resizeCanvas = this.resizeCanvas.bind(this);
  }

  init() {
    // DOM Element References
    this.root = document.getElementById('technologic-soup-terminal');
    this.input = document.getElementById('terminal-input');
    this.inputDisplay = document.getElementById('input-display');
    this.output = document.getElementById('output');
    this.body = document.getElementById('terminal-body');
    this.screen = document.getElementById('screen');

    this.soundToggle = document.getElementById('terminal-sound-toggle');
    this.soundIcon = document.getElementById('terminal-sound-icon');
    
    // Setup event listeners
    this.input.addEventListener('input', () => this.handleInput());
    this.input.addEventListener('keydown', (e) => this.handleKeyDown(e));
    
    // Refocus terminal input when clicking anywhere on screen
    this.screen.addEventListener('click', () => {
      this.input.focus();
      this.initAudioContext();
    });

    this.soundToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMute();
      this.playBeep(600, 0.08, 'sine');
    });

    // Mobile helper keys
    document.querySelectorAll('.mobile-key').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleMobileKey(btn.getAttribute('data-key'));
        this.input.focus();
      });
    });

    // Listen for screen resize to adjust matrix canvas
    window.addEventListener('resize', this.resizeCanvas);

    // Initial focus
    this.input.focus();

    // Trigger boot sequence
    this.bootSequence();
  }

  // Initialize Web Audio Context on first interaction
  initAudioContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Web Audio retro synthesizer helpers
  playBeep(frequency = 440, duration = 0.1, type = 'sine') {
    this.initAudioContext();
    if (this.isMuted || !this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
      // Fast decay to avoid clicks
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('Audio Context error: ', e);
    }
  }

  playKeyClick(isTypewriter = false) {
    this.initAudioContext();
    if (this.isMuted || !this.audioCtx) return;

    try {
      // Create a mechanical sounding key click using a brief bandpass-filtered noise burst
      const bufferSize = this.audioCtx.sampleRate * 0.02; // 20ms
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      
      // Typewriter clicks are higher frequency and thinner for a soft "read head chatter" vibe
      filter.frequency.value = isTypewriter ? (1600 + Math.random() * 400) : (1200 + Math.random() * 600);
      filter.Q.value = isTypewriter ? 8.0 : 5.0;

      const gain = this.audioCtx.createGain();
      
      // Much lower volume for automatic typing click to prevent spam sound (0.008 vs 0.08)
      const vol = isTypewriter ? 0.008 : 0.08;
      gain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + (isTypewriter ? 0.008 : 0.015));

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);

      noise.start();
    } catch (e) {
      // Fallback simple high pitch beep click
      this.playBeep(isTypewriter ? 1500 : 1200, isTypewriter ? 0.008 : 0.015, 'sine');
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.soundIcon.textContent = this.isMuted ? '🔇' : '🔊';
    return this.isMuted;
  }

  clearScreen() {
    this.output.innerHTML = '';
    this.scrollToBottom();
  }

  scrollToBottom() {
    this.body.scrollTop = this.body.scrollHeight;
  }

  // Power-cycle: shut down transient overlays, replay the init animation.
  async reboot() {
    this.isWriting = true;
    this.input.disabled = true;

    if (this.matrixActive) this.toggleMatrix();

    await this.writeLineAsync('\n<span class="bright">⏻ System reboot requested.</span> Reinitializing...', 'system', 8);
    this.playBeep(440, 0.12, 'sawtooth');
    await this.sleep(140);
    this.playBeep(220, 0.28, 'sawtooth');
    await this.sleep(450);

    this.clearScreen();
    await this.sleep(280);

    await this.bootSequence();
  }

  // Async boot up simulator: 3D wireframe icosahedron (left) + kernel-style boot logs (right)
  async bootSequence() {
    this.isWriting = true;
    this.input.disabled = true;

    const bootContainer = document.createElement('div');
    bootContainer.className = 'boot-container';

    const logoContainer = document.createElement('div');
    logoContainer.className = 'boot-logo';
    const canvas = document.createElement('canvas');
    canvas.width = 360;
    canvas.height = 360;
    logoContainer.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const logsContainer = document.createElement('div');
    logsContainer.className = 'boot-logs';

    // Logo on the LEFT, logs on the RIGHT
    bootContainer.appendChild(logoContainer);
    bootContainer.appendChild(logsContainer);
    this.output.appendChild(bootContainer);

    // ── Wireframe icosahedron geometry ──────────────────────────────────
    // 12 vertices defined via the golden ratio (vertex-transitive regular
    // polyhedron). Edges (30) are derived at setup by collecting all
    // vertex pairs at the canonical edge length (= 2).
    const PHI = (1 + Math.sqrt(5)) / 2;
    const vertices = [
      [ 0,    1,    PHI], [ 0,    1,   -PHI], [ 0,   -1,    PHI], [ 0,   -1,   -PHI],
      [ 1,    PHI,  0  ], [ 1,   -PHI,  0  ], [-1,    PHI,  0  ], [-1,   -PHI,  0  ],
      [ PHI,  0,    1  ], [ PHI,  0,   -1  ], [-PHI,  0,    1  ], [-PHI,  0,   -1  ],
    ];

    const edges = (() => {
      const out = [];
      const EDGE_LEN_SQ = 4; // canonical icosahedron edge length squared
      for (let i = 0; i < vertices.length; i++) {
        for (let j = i + 1; j < vertices.length; j++) {
          const dx = vertices[i][0] - vertices[j][0];
          const dy = vertices[i][1] - vertices[j][1];
          const dz = vertices[i][2] - vertices[j][2];
          if (Math.abs(dx * dx + dy * dy + dz * dz - EDGE_LEN_SQ) < 0.01) {
            out.push([i, j]);
          }
        }
      }
      return out;
    })();

    // Circumradius ≈ √(1 + φ²) ≈ 1.9 → depth ranges ~±1.9 after rotation.
    const Z_RANGE = 3.8;

    const pitch0 = 14 * Math.PI / 180;
    let angleY = 0;
    let angleX = 0;
    let frame = 0;
    let rafId = null;

    const renderFrame = () => {
      if (!document.body.contains(logoContainer)) {
        cancelAnimationFrame(rafId);
        return;
      }

      const styles = getComputedStyle(this.root);
      const color = styles.getPropertyValue('--text-color').trim() || '#3dfa72';

      frame++;
      angleY += 0.75;
      angleX += 0.18; // slow secondary tumble around X for richer motion
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
        // Yaw around Y
        let rx = x * cosY - z * sinY;
        let rz = x * sinY + z * cosY;
        let ry = y;
        // Slow tumble around X
        const ny = ry * cosX - rz * sinX;
        const nz = ry * sinX + rz * cosX;
        ry = ny; rz = nz;
        // Viewer pitch (+ wobble)
        const fy = ry * cosP - rz * sinP;
        const fz = ry * sinP + rz * cosP;
        const f = 1 / (D - fz);
        return { px: cx + rx * scale * f, py: cy - fy * scale * f, z: fz };
      };

      const projected = vertices.map(v => project(v[0], v[1], v[2]));

      const sortedEdges = edges.map((e, i) => {
        const [u, v] = e;
        const avgZ = (projected[u].z + projected[v].z) / 2;
        return { u, v, i, avgZ };
      }).sort((a, b) => a.avgZ - b.avgZ);

      // 1) Wireframe edges with depth-modulated glow + bright inner core
      for (const edge of sortedEdges) {
        const { u, v, avgZ } = edge;
        const p0 = projected[u], p1 = projected[v];
        const dn = Math.max(0, Math.min(1, (avgZ + Z_RANGE / 2) / Z_RANGE));
        const op = 0.16 + 0.72 * dn;
        const lw = 0.9 + 2.2 * dn;

        ctx.save();
        ctx.globalAlpha = op;
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.lineCap = 'round';
        ctx.shadowColor = color;
        ctx.shadowBlur = 8 + 16 * dn;
        ctx.beginPath();
        ctx.moveTo(p0.px, p0.py);
        ctx.lineTo(p1.px, p1.py);
        ctx.stroke();

        ctx.shadowBlur = 2;
        ctx.globalAlpha = op * 0.6;
        ctx.lineWidth = lw * 0.35;
        ctx.strokeStyle = '#fff';
        ctx.stroke();
        ctx.restore();
      }

      // 2) Energy packets traveling along each edge (sparser with 30 edges)
      const t = performance.now() * 0.001;
      const cyclePeriod = 2.0; // 1.0s travel + 1.0s gap
      for (const edge of sortedEdges) {
        const { u, v, avgZ, i } = edge;
        const local = (t * 0.45 + i * 0.09) % cyclePeriod;
        if (local > 1) continue;
        const phase = local;
        const p0 = projected[u], p1 = projected[v];
        const px = p0.px + (p1.px - p0.px) * phase;
        const py = p0.py + (p1.py - p0.py) * phase;
        const dn = Math.max(0, Math.min(1, (avgZ + Z_RANGE / 2) / Z_RANGE));

        ctx.save();
        ctx.globalAlpha = 0.35 + 0.55 * dn;
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(px, py, 2.0 + 1.5 * dn, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 3) Vertex dots — uniform pulse (icosahedron is vertex-transitive)
      const pulse = 0.55 + 0.45 * Math.sin(angleY * 0.06);
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        const dn = Math.max(0.25, Math.min(1, (p.z + Z_RANGE / 2) / Z_RANGE));
        const r = (2.2 + 2.0 * pulse) * dn;

        ctx.save();
        ctx.globalAlpha = 0.45 + 0.55 * dn;
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 18 * pulse;
        ctx.beginPath();
        ctx.arc(p.px, p.py, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.globalAlpha *= 0.85;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(p.px, p.py, r * 0.38, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };

    const animLoop = () => {
      renderFrame();
      if (document.body.contains(logoContainer)) {
        rafId = requestAnimationFrame(animLoop);
      }
    };
    rafId = requestAnimationFrame(animLoop);

    // ── Boot log helpers (scoped to logsContainer) ──────────────────────
    // Like writeLineAsync but writes into the right-column pane and
    // appends HTML tags atomically so inline <span> styling renders.
    const writeBootLog = (text, styleClass = '', speed = 3) => {
      return new Promise((resolve) => {
        const lineDiv = document.createElement('div');
        lineDiv.className = `line ${styleClass}`;
        logsContainer.appendChild(lineDiv);

        let index = 0;
        const type = () => {
          if (index < text.length) {
            if (text[index] === '<') {
              const tagEnd = text.indexOf('>', index);
              if (tagEnd !== -1) {
                lineDiv.innerHTML += text.substring(index, tagEnd + 1);
                index = tagEnd + 1;
              } else {
                lineDiv.innerHTML += text[index];
                index++;
              }
            } else {
              lineDiv.innerHTML += text[index];
              index++;
            }
            if (index % 5 === 0) this.playKeyClick(true);
            this.scrollToBottom();
            setTimeout(type, speed);
          } else {
            resolve();
          }
        };

        if (speed <= 0) {
          lineDiv.innerHTML = text;
          this.scrollToBottom();
          resolve();
        } else {
          type();
        }
      });
    };


    // Animated in-place progress bar (rAF-driven).
    // Renders `label[bar] pct%` while running; on completion swaps pct for finalSuffix.
    const progressBar = (durationMs = 600, label = '', finalSuffix = '<span class="bright">[OK]</span>', styleClass = 'system') => {
      const lineDiv = document.createElement('div');
      lineDiv.className = `line ${styleClass}`;
      logsContainer.appendChild(lineDiv);

      return new Promise(resolve => {
        const start = performance.now();
        const width = 18;
        const tick = () => {
          const ratio = Math.min(1, (performance.now() - start) / durationMs);
          const filled = Math.floor(ratio * width);
          const done = ratio >= 1;
          const suffix = done ? finalSuffix : `${String(Math.floor(ratio * 100)).padStart(3, ' ')}%`;
          lineDiv.innerHTML =
            `${label}[<span class="bright">${'█'.repeat(filled)}</span>` +
            `<span class="dim">${'░'.repeat(width - filled)}</span>] ${suffix}`;
          this.scrollToBottom();
          if (!done) requestAnimationFrame(tick);
          else resolve();
        };
        tick();
      });
    };

    // ── Compact boot sequence: BIOS header + 4 progress stages + ready ──
    this.playBeep(820, 0.08, 'square');
    await writeBootLog('<span class="dim">[ 0.000000]</span> TECHNOLOGIC SOUP BIOS v1.82.04 <span class="dim">(build 2024.11.21)</span>', 'bright', 3);
    await writeBootLog('<span class="dim">[ 0.012451]</span> CPU: 80486-DX2 @ 66MHz / FPU / L1=16KB  <span class="bright">[verified]</span>', 'system', 2);
    await this.sleep(80);

    await progressBar(540,
      '<span class="dim">[ 0.058997]</span> Memory diag ........ ',
      '<span class="bright">640K + 7168K  [OK]</span>');
    this.playBeep(900, 0.03, 'sine');

    await progressBar(500,
      '<span class="dim">[ 0.912998]</span> PCI bus scan ....... ',
      '<span class="bright">HOST/VGA/SCSI/NIC  [OK]</span>');

    await progressBar(560,
      '<span class="dim">[ 1.302881]</span> Kernel modules ..... ',
      '<span class="bright">4/4 loaded  [OK]</span>');

    this.playBeep(700, 0.04, 'sine');
    await progressBar(620,
      '<span class="dim">[ 1.712998]</span> Net uplink (TLS) ... ',
      '<span class="bright">AUTH GRANTED</span>');

    await this.sleep(60);
    this.playBeep(1200, 0.04, 'sine');
    this.playBeep(1500, 0.05, 'sine');
    await writeBootLog('<span class="dim">[ 2.142220]</span> systemd[1]: target <span class="bright">Terminal Ready</span> reached', 'system', 2);
    await writeBootLog('<span class="dim">[ 2.158334]</span> login: guest <span class="dim">(auto)</span>', 'dim', 2);

    // Welcome banner (full-width below the boot panes)
    await this.writeLineAsync('\n<span class="bright">guest@technologic-soup</span> connected successfully.', 'system', 8);
    await this.writeLineAsync('Type <span class="bright">help</span> for available commands.  Use <span class="bright">Tab</span> for autocomplete, <span class="bright">↑/↓</span> for history.', 'dim', 6);
    await this.writeLineAsync('\n', '', 0);

    this.isWriting = false;
    this.input.disabled = false;
    this.input.focus();
  }

  // Asynchronous typewriter effect
  writeLineAsync(text, styleClass = '', speed = 20) {
    return new Promise((resolve) => {
      const lineDiv = document.createElement('div');
      lineDiv.className = `line ${styleClass}`;
      this.output.appendChild(lineDiv);
      
      let index = 0;
      
      const type = () => {
        if (index < text.length) {
          // If we encounter an HTML tag, append it entirely at once
          if (text[index] === '<') {
            const tagEnd = text.indexOf('>', index);
            if (tagEnd !== -1) {
              lineDiv.innerHTML += text.substring(index, tagEnd + 1);
              index = tagEnd + 1;
            } else {
              lineDiv.innerHTML += text[index];
              index++;
            }
          } else {
            lineDiv.innerHTML += text[index];
            index++;
          }
          if (index % 4 === 0) {
            this.playKeyClick(true);
          }
          this.scrollToBottom();
          setTimeout(type, speed);
        } else {
          resolve();
        }
      };

      if (speed <= 0) {
        lineDiv.innerHTML = text;
        this.scrollToBottom();
        resolve();
      } else {
        type();
      }
    });
  }

  // Standard instantaneous write helper
  writeLine(text, styleClass = '') {
    const lineDiv = document.createElement('div');
    lineDiv.className = `line ${styleClass}`;
    lineDiv.innerHTML = text;
    this.output.appendChild(lineDiv);
    this.scrollToBottom();
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Shell script parser
  async runScript(scriptText) {
    this.isWriting = true;
    this.input.disabled = true;

    const lines = scriptText.split('\n');
    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      if (line.startsWith('echo ')) {
        // Extract string inside quotes or raw string
        let msg = line.substring(5);
        if ((msg.startsWith('"') && msg.endsWith('"')) || (msg.startsWith("'") && msg.endsWith("'"))) {
          msg = msg.substring(1, msg.length - 1);
        }
        await this.writeLineAsync(msg, 'system', 15);
      } else if (line.startsWith('sleep ')) {
        const duration = parseFloat(line.substring(6)) * 1000;
        await this.sleep(duration);
      }
    }

    this.isWriting = false;
    this.input.disabled = false;
    this.input.focus();
  }

  // Input Handlers
  handleInput() {
    this.inputDisplay.textContent = this.input.value;
    this.playKeyClick();
  }

  handleKeyDown(e) {
    if (this.isWriting) {
      e.preventDefault();
      return;
    }

    if (e.key === 'Enter') {
      const val = this.input.value;
      this.input.value = '';
      this.inputDisplay.textContent = '';
      
      this.processCommand(val);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this.history.length > 0) {
        if (this.historyIndex === -1) {
          this.historyIndex = this.history.length - 1;
        } else if (this.historyIndex > 0) {
          this.historyIndex--;
        }
        this.input.value = this.history[this.historyIndex];
        this.inputDisplay.textContent = this.input.value;
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this.history.length > 0 && this.historyIndex !== -1) {
        if (this.historyIndex < this.history.length - 1) {
          this.historyIndex++;
          this.input.value = this.history[this.historyIndex];
        } else {
          this.historyIndex = -1;
          this.input.value = '';
        }
        this.inputDisplay.textContent = this.input.value;
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      this.handleAutocomplete();
    }
  }

  handleMobileKey(key) {
    if (this.isWriting) return;

    if (key === 'Tab') {
      this.handleAutocomplete();
    } else if (key === 'ArrowUp') {
      this.handleKeyDown({ key: 'ArrowUp', preventDefault: () => {} });
    } else if (key === 'ArrowDown') {
      this.handleKeyDown({ key: 'ArrowDown', preventDefault: () => {} });
    } else {
      // Standard quick command buttons (help, matrix, clear)
      this.input.value = key;
      this.inputDisplay.textContent = key;
      this.processCommand(key);
    }
  }

  handleAutocomplete() {
    const suggestions = getAutocompleteSuggestions(this.input.value);
    
    if (suggestions.length === 1) {
      // Single match, fill it
      const parts = this.input.value.split(/\s+/);
      if (parts.length > 1 && parts[0].toLowerCase() === 'cat') {
        this.input.value = `cat ${suggestions[0]}`;
      } else {
        this.input.value = suggestions[0];
      }
      this.inputDisplay.textContent = this.input.value;
      this.playKeyClick();
    } else if (suggestions.length > 1) {
      // Multiple matches, write prompt line + options list
      this.writeLine(`guest@technologic-soup:~$ ${this.input.value}`, 'dim');
      this.writeLine(suggestions.join('    '), 'system');
      this.playBeep(700, 0.05, 'sine');
    }
  }

  async processCommand(rawInput) {
    const input = rawInput.trim();
    
    // Log prompt and typed command to terminal buffer
    this.writeLine(`guest@technologic-soup:~$ ${rawInput}`);

    if (!input) return;

    // Push to command history
    this.history.push(input);
    if (this.history.length > 50) this.history.shift(); // Cap history buffer
    this.historyIndex = -1;

    // Execute command handler from commands.js
    const result = executeCommand(input, this);
    
    // If output is generated (not clear or script runner)
    if (result !== null) {
      this.isWriting = true;
      this.input.disabled = true;
      
      // Write command response output with typewriter speed = 0 (instant) or 10ms for style
      await this.writeLineAsync(result, '', 3);
      
      this.isWriting = false;
      this.input.disabled = false;
      this.input.focus();
    }
  }

  // Matrix Overlay System
  toggleMatrix() {
    this.matrixActive = !this.matrixActive;
    
    if (this.matrixActive) {
      if (!this.matrixCanvas) {
        this.matrixCanvas = document.createElement('canvas');
        this.matrixCanvas.id = 'matrix-canvas';
        this.screen.appendChild(this.matrixCanvas);
        this.matrixCtx = this.matrixCanvas.getContext('2d');
      }
      
      this.matrixCanvas.style.display = 'block';
      this.resizeCanvas();
      this.setupMatrixDrops();
      
      // Start render loop
      this.matrixInterval = setInterval(() => this.drawMatrix(), 35);
    } else {
      if (this.matrixCanvas) {
        this.matrixCanvas.style.display = 'none';
      }
      clearInterval(this.matrixInterval);
    }
    return this.matrixActive;
  }

  resizeCanvas() {
    if (this.matrixCanvas) {
      this.matrixCanvas.width = this.screen.offsetWidth;
      this.matrixCanvas.height = this.screen.offsetHeight;
      this.setupMatrixDrops();
    }
  }

  setupMatrixDrops() {
    if (!this.matrixCanvas) return;
    const columns = Math.floor(this.matrixCanvas.width / this.matrixFontSize);
    this.matrixDrops = [];
    for (let i = 0; i < columns; i++) {
      this.matrixDrops[i] = Math.random() * -100; // staggered offset starts
    }
  }

  drawMatrix() {
    if (!this.matrixCtx || !this.matrixCanvas) return;

    // Fetch colors dynamically from CSS variables so canvas matches active theme!
    const styles = getComputedStyle(this.root);
    const textColor = styles.getPropertyValue('--text-color').trim();
    const bgColor = styles.getPropertyValue('--bg-color').trim();

    // Darken screen background slightly per frame to leave trails
    this.matrixCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    this.matrixCtx.fillRect(0, 0, this.matrixCanvas.width, this.matrixCanvas.height);

    this.matrixCtx.fillStyle = textColor;
    this.matrixCtx.font = `${this.matrixFontSize}px monospace`;

    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890@#$%^&*()_+=-{}[]|:;<>?,./*";

    for (let i = 0; i < this.matrixDrops.length; i++) {
      const char = characters.charAt(Math.floor(Math.random() * characters.length));
      const x = i * this.matrixFontSize;
      const y = this.matrixDrops[i] * this.matrixFontSize;

      // Draw the character
      this.matrixCtx.fillText(char, x, y);

      // Randomly reset column to top after reaching bottom
      if (y > this.matrixCanvas.height && Math.random() > 0.975) {
        this.matrixDrops[i] = 0;
      }

      this.matrixDrops[i]++;
    }
  }
}

// Initialise the application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const terminal = new RetroTerminal();
  window.terminalInstance = terminal; // Expose globally for commands.js
  terminal.init();
});
