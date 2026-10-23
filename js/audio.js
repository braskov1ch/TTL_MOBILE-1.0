'use strict';
/* =====================================================================
   AUDIO: мрачный синтезатор звуков, реверберация и процедурная музыка
   ===================================================================== */
const Snd = {
  ctx: null, master: null, sfxBus: null, musBus: null, noiseBuf: null, muted: false, last: {},

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        try {
          const c = this.ctx = new AC();
          this.master = c.createGain(); this.master.gain.value = this.muted ? 0 : 0.9;
          const comp = c.createDynamicsCompressor();
          this.master.connect(comp); comp.connect(c.destination);
          // реверберация: затухающий шум
          const irLen = Math.floor(c.sampleRate * 2.2);
          const ir = c.createBuffer(2, irLen, c.sampleRate);
          for (let ch = 0; ch < 2; ch++) {
            const d = ir.getChannelData(ch);
            for (let i = 0; i < irLen; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 2.6);
          }
          const conv = c.createConvolver(); conv.buffer = ir;
          const wet = c.createGain(); wet.gain.value = 0.55;
          conv.connect(wet); wet.connect(this.master);
          this.sfxBus = c.createGain(); this.musBus = c.createGain();
          const sfxSend = c.createGain(); sfxSend.gain.value = 0.22;
          const musSend = c.createGain(); musSend.gain.value = 0.6;
          this.sfxBus.connect(this.master); this.sfxBus.connect(sfxSend); sfxSend.connect(conv);
          this.musBus.connect(this.master); this.musBus.connect(musSend); musSend.connect(conv);
          const len = c.sampleRate;
          this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
          const nd = this.noiseBuf.getChannelData(0);
          for (let i = 0; i < len; i++) nd[i] = Math.random() * 2 - 1;
          this.applyVolumes();
        } catch (e) { this.ctx = null; }
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  applyVolumes() {
    if (!this.ctx) return;
    const s = cfg();
    this.sfxBus.gain.value = s.sfx;
    this.musBus.gain.value = s.music;
    this.master.gain.value = this.muted ? 0 : 0.9;
  },
  setMuted(m) { this.muted = m; this.applyVolumes(); },

  tone(f0, f1, dur, type = 'sine', vol = 0.15, delay = 0, bus = 'sfx') {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + Math.min(0.02, dur * 0.2));
    g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    o.connect(g); g.connect(bus === 'music' ? this.musBus : this.sfxBus);
    o.start(t); o.stop(t + dur + 0.03);
  },

  noise(dur, vol = 0.2, fc = 1800, delay = 0, fc1 = null, type = 'lowpass') {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime + delay;
    const src = c.createBufferSource(); src.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type;
    f.frequency.setValueAtTime(fc, t);
    if (fc1) f.frequency.exponentialRampToValueAtTime(fc1, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    src.connect(f); f.connect(g); g.connect(this.sfxBus);
    src.start(t, Math.random() * 0.5, dur + 0.02);
  },

  bell(f, vol = 0.12, delay = 0) {
    this.tone(f, f, 2.2, 'sine', vol, delay);
    this.tone(f * 2.76, f * 2.76, 1.2, 'sine', vol * 0.4, delay);
    this.tone(f * 5.4, f * 5.4, 0.6, 'sine', vol * 0.2, delay);
  },

  play(name) {
    if (!this.ctx || this.muted) return;
    const now = performance.now();
    if (now - (this.last[name] || 0) < 30) return;
    this.last[name] = now;
    try {
      switch (name) {
        case 'bolt':   this.tone(340, 120, 0.12, 'triangle', 0.13); this.noise(0.08, 0.1, 4000, 0, 800, 'highpass'); break;
        case 'orb':    this.tone(620, 880, 0.1, 'sine', 0.07); break;
        case 'swing':  this.noise(0.14, 0.15, 2400, 0, 500, 'bandpass'); break;
        case 'hit':    this.tone(130, 45, 0.12, 'triangle', 0.2); this.noise(0.06, 0.08, 1500); break;
        case 'hurt':   this.tone(200, 60, 0.3, 'sawtooth', 0.22); this.noise(0.18, 0.12, 700); break;
        case 'enemy_die': this.tone(180, 50, 0.22, 'square', 0.07); this.noise(0.22, 0.12, 1100, 0, 150); break;
        case 'relic':  [220, 261.6, 329.6, 440].forEach((f, i) => this.tone(f, f, 0.9, 'triangle', 0.09, i * 0.09)); this.bell(880, 0.05, 0.3); break;
        case 'stair':  [220, 196, 164.8, 130.8].forEach((f, i) => this.tone(f, f, 0.5, 'sine', 0.13, i * 0.14)); break;
        case 'boss_die': this.noise(1.2, 0.35, 2600, 0, 70); this.tone(110, 28, 1.1, 'sawtooth', 0.2); break;
        case 'door':   this.tone(90, 55, 0.2, 'square', 0.08); this.noise(0.15, 0.08, 500); break;
        case 'unlock': this.tone(500, 800, 0.1, 'square', 0.07); this.tone(800, 1200, 0.12, 'square', 0.07, 0.09); break;
        case 'burst':  this.noise(0.6, 0.4, 2400, 0, 70); this.tone(85, 28, 0.5, 'sawtooth', 0.22); break;
        case 'flask':  this.noise(0.25, 0.1, 1800, 0, 500, 'bandpass'); break;
        case 'silver': this.tone(1500, 1500, 0.07, 'square', 0.04); this.tone(2200, 2200, 0.14, 'sine', 0.05, 0.05); break;
        case 'pickup': this.tone(420, 640, 0.12, 'triangle', 0.1); break;
        case 'key':    this.tone(620, 620, 0.08, 'triangle', 0.1); this.tone(930, 930, 0.18, 'triangle', 0.1, 0.08); break;
        case 'potion': [300, 380, 460].forEach((f, i) => this.tone(f, f * 1.2, 0.2, 'sine', 0.09, i * 0.09)); break;
        case 'oil':    this.tone(700, 1050, 0.25, 'sine', 0.09); this.noise(0.2, 0.04, 3000, 0, 1000, 'highpass'); break;
        case 'wisp':   this.tone(1100, 1500, 0.1, 'sine', 0.05); break;
        case 'buy':    this.tone(900, 1300, 0.1, 'square', 0.06); this.tone(1300, 1800, 0.14, 'square', 0.06, 0.1); break;
        case 'error':  this.tone(160, 110, 0.18, 'square', 0.1); break;
        case 'select': this.tone(520, 520, 0.05, 'triangle', 0.06); break;
        case 'confirm': this.tone(330, 495, 0.14, 'triangle', 0.09); break;
        case 'poop':   this.noise(0.2, 0.15, 800, 0, 150); break;
        case 'zap':    this.tone(1800, 300, 0.12, 'sawtooth', 0.05); break;
        case 'charge': [440, 554, 659].forEach((f, i) => this.tone(f, f, 0.2, 'triangle', 0.08, i * 0.07)); break;
        case 'use':    this.tone(160, 700, 0.35, 'sawtooth', 0.09); break;
        case 'boss_intro': this.tone(55, 30, 1.6, 'sawtooth', 0.2); this.noise(1.3, 0.18, 400, 0, 70); this.bell(110, 0.15); break;
        case 'stomp':  this.tone(70, 28, 0.3, 'triangle', 0.28); this.noise(0.25, 0.2, 500, 0, 90); break;
        case 'spawn':  this.tone(240, 520, 0.2, 'sine', 0.04); break;
        case 'shield': this.tone(800, 400, 0.16, 'triangle', 0.1); break;
        case 'block':  this.tone(1100, 600, 0.07, 'square', 0.05); break;
        case 'parry':  this.tone(1400, 900, 0.18, 'square', 0.1); this.bell(1760, 0.07); break;
        case 'dash':   this.noise(0.18, 0.13, 1800, 0, 300, 'bandpass'); break;
        case 'trap':   this.tone(300, 80, 0.12, 'square', 0.12); this.noise(0.1, 0.1, 2000); break;
        case 'sanctum': this.bell(523, 0.1); this.bell(784, 0.06, 0.15); break;
        case 'note':   this.bell(330, 0.1); break;
        case 'blood':  this.tone(160, 40, 0.5, 'sawtooth', 0.14); this.noise(0.4, 0.1, 600); break;
        case 'win':    [261.6, 329.6, 392, 523.3, 659.3].forEach((f, i) => this.tone(f, f, 1.2, 'triangle', 0.12, i * 0.22)); this.bell(1046, 0.08, 1); break;
        case 'lead':   this.tone(120, 55, 0.16, 'triangle', 0.22); this.noise(0.07, 0.09, 1200); break;
        case 'axe':    this.noise(0.22, 0.2, 1500, 0, 280, 'bandpass'); this.tone(95, 50, 0.22, 'sawtooth', 0.12); break;
        case 'scythe': this.noise(0.22, 0.14, 2800, 0, 600, 'bandpass'); this.tone(620, 300, 0.2, 'sine', 0.05); break;
        case 'acid':   this.noise(0.3, 0.13, 2200, 0, 800, 'bandpass'); this.tone(900, 300, 0.25, 'sine', 0.05); break;
        case 'mad':    this.tone(300, 900, 0.3, 'sine', 0.08); this.tone(700, 200, 0.3, 'triangle', 0.07, 0.1); break;
        case 'crow':   this.tone(900, 420, 0.12, 'sawtooth', 0.07); this.tone(720, 300, 0.12, 'sawtooth', 0.06, 0.1); break;
        case 'necro':  this.tone(160, 60, 0.35, 'sawtooth', 0.1); this.noise(0.25, 0.08, 700, 0, 150); break;
        case 'echo':   this.tone(440, 330, 0.5, 'sine', 0.09); this.tone(660, 500, 0.4, 'sine', 0.05, 0.1); break;
        case 'harvest': this.tone(110, 220, 0.8, 'sawtooth', 0.08); this.noise(0.8, 0.1, 900, 0, 2000, 'bandpass'); break;
        case 'reapdash': this.noise(0.3, 0.2, 2400, 0, 300, 'bandpass'); this.tone(200, 70, 0.3, 'sawtooth', 0.1); break;
        case 'execute': this.tone(70, 25, 0.5, 'triangle', 0.3); this.noise(0.4, 0.25, 700, 0, 80); break;
        case 'exec_wind': this.tone(120, 260, 0.3, 'sawtooth', 0.06); break;
        case 'coin':   this.tone(1800, 2400, 0.08, 'square', 0.05); this.tone(2400, 3200, 0.15, 'sine', 0.06, 0.06); break;
        case 'shatter': this.noise(0.3, 0.2, 6000, 0, 800, 'highpass'); this.tone(1400, 500, 0.2, 'square', 0.05); break;
        case 'weep':   this.tone(520, 380, 0.5, 'sine', 0.05); break;
        case 'sing':   this.bell(523, 0.06); this.bell(659, 0.04, 0.12); break;
        case 'lose':   [196, 174.6, 146.8, 110].forEach((f, i) => this.tone(f, f * 0.95, 0.8, 'sawtooth', 0.09, i * 0.35)); break;
      }
    } catch (e) { /* звук не критичен */ }
  }
};

// ===== ПРОЦЕДУРНАЯ МУЗЫКА =====
const Music = {
  on: true, mode: 'calm', step: 0, t: 0, root: 55,
  scale: [0, 2, 3, 7, 8, 10, 12, 14, 15],   // фригийско-минорный оттенок
  roots: [55, 49, 61.7, 46.2, 58.3, 41.2],
  setFloor(n) { this.root = this.roots[(n - 1) % this.roots.length]; },
  note(semi, oct = 1) { return this.root * oct * Math.pow(2, semi / 12); },
  update(dt) {
    if (!Snd.ctx || Snd.muted || !this.on || (state !== 'play' && state !== 'pause')) return;
    if (state === 'pause') return;
    this.t -= dt;
    if (this.t > 0) return;
    const boss = this.mode === 'boss';
    this.t += boss ? 0.34 : 0.62;
    const s = this.step++;
    const r = this.root;
    if (s % 12 === 0) {
      Snd.tone(r, r, 8, 'sine', 0.09, 0, 'music');
      Snd.tone(r * 1.5, r * 1.5, 7, 'sine', 0.035, 0, 'music');
      Snd.tone(r * 2.003, r * 2.003, 7, 'triangle', 0.02, 0, 'music');
    }
    if (boss) {
      if (s % 2 === 0) { Snd.tone(r * 2, r * 0.9, 0.3, 'sine', 0.16, 0, 'music'); Snd.tone(r * 2, r * 0.9, 0.3, 'sine', 0.1, 0.14, 'music'); }
      const arp = [0, 1, 7, 6, 3, 1, 8, 6];
      if (s % 2 === 1) Snd.tone(this.note(arp[(s >> 1) % 8], 4), this.note(arp[(s >> 1) % 8], 4), 0.5, 'triangle', 0.03, 0, 'music');
    } else if (Math.random() < 0.38) {
      const n = pick(this.scale);
      Snd.tone(this.note(n, 4), this.note(n, 4), 2.4, 'sine', 0.035, 0, 'music');
      if (Math.random() < 0.3) Snd.tone(this.note(n, 8), this.note(n, 8), 1.4, 'sine', 0.012, 0.1, 'music');
    }
  }
};
