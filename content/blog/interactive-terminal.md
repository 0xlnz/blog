---
title: "There's a CRT on your screen"
date: 2026-05-25T18:00:00+02:00
draft: false
tags: ["Code", "design", "AI"]
categories: ["tech"]
summary: "Why does the /terminal/ page beep at you? Because vanilla JS, that's why."
cover:
  image: "images/retro.jpg"
  alt: "Fuck yeah retro"
  relative: true # To use relative path for cover image, used in hugo Page-bundle
ShowToc: false
TocOpen: false
---

I added an interactive terminal to the site. It lives at [`/terminal/`](/blog/terminal/) and pretends to be a CRT.

- Type `help` to see the commands.  
- Type `matrix` if you miss 1999.  
- Type `beep` to annoy yourself.

## How it works

Three files, no framework:

- `assets/js/terminal/commands.js` holds a virtual filesystem and the command table.
- `assets/js/terminal/app.js` runs the shell loop, the keyboard handler, the WebAudio beeps, and the matrix canvas.
- `assets/css/terminal.css` paints the bezel, the scanlines, the flicker, the phosphor glow.

The Hugo side is just a layout. The page declares `layout: "terminal"` in `content/terminal.md`, and Hugo resolves it to `layouts/_default/terminal.html`. That template fingerprints and minifies the assets, then dumps the CRT markup:

```html {title="layouts/_default/terminal.html"}
<div id="technologic-soup-terminal">
  <div class="crt-monitor">
    <div class="crt-bezel">
      <div class="crt-screen" id="screen">
        <div class="scanlines"></div>
        <div class="screen-flicker"></div>
        <div class="screen-glare"></div>
        ...
      </div>
    </div>
  </div>
</div>
```

The scanlines are a repeating `linear-gradient`. The flicker is a `0.15s infinite` keyframe nudging opacity. The glare is a `radial-gradient` riding on `mix-blend-mode: overlay`. No images, nothing pre-rendered, just CSS hurting your eyes the way nature intended.

Sounds are synthesized at runtime. Every keypress is a `playBeep(1200, 0.015, 'sine')` straight from WebAudio:

```javascript {title="assets/js/terminal/app.js"}
playBeep(frequency = 440, duration = 0.1, type = 'sine') {
  const ctx = this.audioCtx;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);

  gain.gain.setValueAtTime(0.04, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + duration);
}
```

If you find this insufferable, the `mute` command exists. Or `sound` in the header. I am not unreasonable.


## Try it

Hit [`/terminal/`](/blog/terminal/). Type `help`.  The rest you can figure out.

---

*Built with the help of Anthropic's [Claude Code](https://claude.com/claude-code).*
