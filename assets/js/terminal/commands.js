// Virtual Filesystem
const FILESYSTEM = {
  'README.md': 'Welcome to Retro-Term shell!\n\nThis is a portfolio/sandbox web terminal.\nType "help" to display a list of all available commands.\n\nUse "ls" to list files and "cat [filename]" to read files.',
  'about.txt': '--- BIOGRAPHY ---\n\nName: guest_developer\nRole: Agentic Systems engineer & Web UI artisan\nAffiliation: Advanced Agentic Coding, DeepMind\nStatus: Online & Ready for Deployment\n\nBio: Passionate about blending rich, high-fidelity visual design with core software engineering. Believes that command-line interfaces are the ultimate expression of human-computer interaction, especially with a CRT filter.',
  'skills.txt': '==================== SKILLS & TECHNOLOGIES ====================\n\n  [LANGUAGES]    JavaScript (ES6+), TypeScript, HTML5/CSS3, Python, C++\n  [FRAMEWORKS]   React, Next.js, Vue, Node.js, Express, Fastify\n  [DEV-TOOLS]    Git, Docker, Kubernetes, Linux Bash Shell, Vim\n  [AI/AGENTS]    Gemini API, LLM Prompt Engineering, Agent Workflows\n\n===============================================================',
  'projects.txt': '========================= PROJECTS =========================\n\n* Project-Alpha (Voxel Engine)\n  - A hardware-accelerated 3D voxel sandbox in Vanilla JS.\n  - Tech: Three.js, WebGL, Web Audio API\n\n* Project-Beta (Agentic Coder)\n  - Multi-agent programming environment with execution feedback.\n  - Tech: Python, Gemini 1.5 Pro, WebSockets\n\n* Project-Gamma (Retro Synth)\n  - A retro-style modular synthesizer that runs in the browser.\n  - Tech: HTML5 Canvas, Web Audio API\n\n=============================================================',
  'contact.txt': 'Email:    guest@retro-term.dev\nGitHub:   github.com/retro-term\nLinkedIn: linkedin.com/in/retro-term\nTwitter:  @retro_term_dev\n\nFeel free to reach out via transmission links!',
  'secret.sh': 'echo "INTRUDER ALERT! Initiating security purge..."\nsleep 1.5\necho "Purge canceled. Just kidding. Try running the \'matrix\' command!"'
};

// Available command descriptions
const COMMANDS = {
  'help': 'Display a guide of all available console instructions',
  'about': 'Show system pilot bio and biographical info',
  'ls': 'List files available in current directory',
  'cat': 'Read the contents of a file (Usage: cat [filename])',
  'skills': 'Display catalog of developer skillset',
  'projects': 'List prominent projects and software builds',
  'contact': 'Show frequencies and contact coordinates',
  'matrix': 'Toggle the full-screen digital rain simulator',
  'beep': 'Emit a retro status sound alert',
  'mute': 'Toggle hardware keyboard click feedback sounds',
  'clear': 'Clear screen buffer',
  'reboot': 'Reboot the terminal (rerun init sequence)',
  'sudo': 'Execute command with root administrative privileges',
  'secret.sh': 'Run a retro system shell script'
};

// Process Command Input
function executeCommand(input, terminal) {
  const trimmed = input.trim();
  if (!trimmed) return '';

  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  if (cmd === 'help') {
    let output = '<span class="bright">AVAILABLE COMMANDS:</span>\n\n';
    Object.keys(COMMANDS).sort().forEach(name => {
      // Pad names for alignment
      const paddedName = name.padEnd(12, ' ');
      output += `  <span class="grid-key">${paddedName}</span> - <span class="grid-val">${COMMANDS[name]}</span>\n`;
    });
    output += '\nUse <span class="bright">Tab</span> for autocomplete, and <span class="bright">Up/Down arrows</span> for command history.';
    return output;
  }

  if (cmd === 'about') {
    return FILESYSTEM['about.txt'];
  }

  if (cmd === 'skills') {
    return FILESYSTEM['skills.txt'];
  }

  if (cmd === 'projects') {
    return FILESYSTEM['projects.txt'];
  }

  if (cmd === 'contact') {
    return FILESYSTEM['contact.txt'];
  }

  if (cmd === 'ls') {
    return Object.keys(FILESYSTEM)
      .map(file => {
        const isExecutable = file.endsWith('.sh');
        const colorClass = isExecutable ? 'bright' : 'dim';
        return `<span class="${colorClass}">${file}</span>`;
      })
      .join('    ');
  }

  if (cmd === 'cat') {
    if (args.length === 0) {
      return '<span class="error">Usage: cat [filename]</span>';
    }
    const filename = args[0];
    if (FILESYSTEM[filename]) {
      return FILESYSTEM[filename];
    } else {
      return `<span class="error">cat: ${filename}: File not found.</span>`;
    }
  }

  if (cmd === 'clear') {
    terminal.clearScreen();
    return null; // Return null so terminal knows it was cleared
  }

  if (cmd === 'reboot') {
    terminal.reboot();
    return null; // reboot is async and writes its own output
  }

  if (cmd === 'mute') {
    const muted = terminal.toggleMute();
    return `Audio systems: <span class="bright">${muted ? 'OFF (MUTED)' : 'ON'}</span>`;
  }

  if (cmd === 'beep') {
    terminal.playBeep(440, 0.15, 'square');
    return 'Status alert frequency emitted.';
  }

  if (cmd === 'matrix') {
    const active = terminal.toggleMatrix();
    return active 
      ? 'Matrix Digital Rain system: <span class="bright">ONLINE</span>. Type "matrix" again to shutdown overlay.'
      : 'Matrix Digital Rain system: <span class="dim">OFFLINE</span>.';
  }

  if (cmd === 'sudo') {
    terminal.playBeep(220, 0.35, 'sawtooth');
    return '<span class="error">ACCESS RESTRICTED: guest_user is not in the sudoers file. This incident will be reported to the virtual operator.</span>';
  }

  if (cmd === 'secret.sh' || cmd === './secret.sh') {
    // Run secret.sh instructions sequentially (via terminal logging API)
    terminal.runScript(FILESYSTEM['secret.sh']);
    return null; // Output is generated asynchronously by terminal script runner
  }

  // Check if user is typing the file name directly (like executing an executable script)
  if (cmd.endsWith('.sh') && FILESYSTEM[cmd]) {
    terminal.runScript(FILESYSTEM[cmd]);
    return null;
  }

  return `<span class="error">Command not found: "${cmd}". Type "help" for a list of valid terminal inputs.</span>`;
}

// Auto-complete utility
function getAutocompleteSuggestions(input) {
  const trimmed = input.trim();
  if (!trimmed) return [];

  const parts = trimmed.split(/\s+/);
  const word = parts[parts.length - 1].toLowerCase();

  // If we are typing cat, suggest files
  if (parts.length > 1 && parts[0].toLowerCase() === 'cat') {
    return Object.keys(FILESYSTEM).filter(name => name.toLowerCase().startsWith(word));
  }

  // Otherwise suggest command names
  const allSuggestions = [...Object.keys(COMMANDS), ...Object.keys(FILESYSTEM)];
  return allSuggestions.filter(name => name.toLowerCase().startsWith(word));
}

// Export for application use
window.executeCommand = executeCommand;
window.getAutocompleteSuggestions = getAutocompleteSuggestions;
