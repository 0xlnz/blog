// Bootstrap dynamic site identity from the Hugo template's data-* attributes.
// (defer-loaded JS runs after DOM parse, so #crt-shell is available here.)
const shellRoot = document.getElementById('crt-shell');
window.SITE_TITLE = shellRoot?.dataset.siteTitle || 'Terminal';
window.SITE_TITLE_SLUG = shellRoot?.dataset.siteSlug || 'terminal';
window.HOME_URL = shellRoot?.dataset.homeUrl || '/';

// Virtual Filesystem
const FILESYSTEM = {
  'README.md': `Welcome to ${window.SITE_TITLE || 'Terminal'} shell!\n\nThis is a portfolio/sandbox web terminal.\nType "help" to display a list of all available commands.\n\nUse "ls" to list files and "cat [filename]" to read files.`,
  'about.txt': '--- BIOGRAPHY ---\n\nName: Lorenzo\nHandle: 0xlnz\nRole: Staff Solutions Architect\nSpecialty: Enterprise Storage & DevOps Automation\nLocation: Italy\nStatus: Online & Automating\n\nBio: Solutions Architect focused on enterprise data storage, disaster recovery, and cloud-native automation. I design and operate complex, secure platforms and lean on Infrastructure as Code to keep humans out of the toil loop.',
  'skills.txt': '==================== SKILLS & TECHNOLOGIES ====================\n\n  [STORAGE]      NFS Enthusiast, S3,  NVMe, SMB, FCP\n  [CLOUD]        AWS, Azure, GCP, OCI\n  [CONTAINERS]   K8s, OpenShift, Docker\n  [IAC/CI-CD]    Ansible, Terraform, ArgoCD, Git\n  [LANGUAGES]    Python, Bash, GO, RUST\n  [VIRT]         VMware vSphere, KVM, OpenStack, Proxmox\n  [PRACTICES]    Disaster Recovery, Business Continuity   \n\n===============================================================',
  'projects.txt': '========================= PROJECTS =========================\n\n* Geo-distributed Cloud Storage\n  - Multi-region storage with automated DR and 3-2-1 backup.\n  - Tech: NetApp, Ansible, Object Storage\n\n* Metro-cluster for Mission-Critical Continuity\n  - Synchronous metro-cluster supporting always-on workloads.\n  - Tech: NetApp MetroCluster, VMware\n\n* Kubernetes Persistent Storage on Public Cloud\n  - K8s persistent volumes with cross-region disaster recovery.\n  - Tech: Azure, Trident, NetApp Cloud Volumes\n\n* Zero-RPO/RTO File Storage DR\n  - Fully automated DR runbook for global file services.\n  - Tech: Ansible, SnapMirror, Python\n\n* Distributed Storage for High-IOPS Workloads\n  - Hyperconverged storage tier for analysis-heavy VM workloads.\n  - Tech: NetApp, VMware\n\n* Multi-site Converged Infrastructure\n  - FlexPod rollout across primary and DR datacenters.\n  - Tech: NetApp, Cisco UCS, VMware\n\n=============================================================',
  'contact.txt': 'GitHub:   github.com/0xlnz\nBlog:     0xlnz.github.io/blog\n\nReach out via GitHub — transmissions over public channels only.',
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
  'shutdown': 'Power down the CRT and return to home',
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

  if (cmd === 'shutdown') {
    terminal.shutdown();
    return null; // shutdown is async and redirects when complete
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
    return '<span class="error">ACCESS DENIED: [guest] is not in the sudoers file. This incident will be reported.</span>';
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
