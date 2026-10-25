// Sound Manager using Web Audio API for rich, kid-friendly sound effects & chiptune background music

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isMusicEnabled: boolean = true;
  private bgmInterval: any = null;
  private currentStep: number = 0;
  private currentTheme: string = 'candy';

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopBGM();
    } else if (this.isMusicEnabled) {
      this.startBGM(this.currentTheme);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMusic(): boolean {
    this.isMusicEnabled = !this.isMusicEnabled;
    if (!this.isMusicEnabled) {
      this.stopBGM();
    } else if (!this.isMuted) {
      this.startBGM(this.currentTheme);
    }
    return this.isMusicEnabled;
  }

  public getMusicEnabled(): boolean {
    return this.isMusicEnabled;
  }

  // Play a simple synthesized oscillator tone
  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.15, endFreq?: number) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (endFreq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), now + duration);
      }

      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // AudioContext could be blocked by autoplay policies
    }
  }

  // White noise burst for explosions & pops
  private playNoise(duration: number, cutoff: number, volume: number = 0.2) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(cutoff, now);
      filter.frequency.exponentialRampToValueAtTime(60, now + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start(now);
    } catch {}
  }

  // --- Sound Effects for Kids ---

  // Pop sound (menus, bubbles, buttons)
  public sfxPop(pitch: number = 1) {
    this.playTone(450 * pitch, 0.08, 'sine', 0.12, 750 * pitch);
  }

  // Camera Shutter Click
  public sfxCameraClick() {
    this.playNoise(0.04, 3000, 0.25);
    setTimeout(() => {
      this.playTone(800, 0.06, 'triangle', 0.15, 1200);
      this.playNoise(0.08, 1800, 0.3);
    }, 60);
  }

  // Countdown Beep (3, 2, 1)
  public sfxCountdown(final: boolean = false) {
    if (final) {
      this.playTone(880, 0.25, 'triangle', 0.22, 1100);
    } else {
      this.playTone(520, 0.12, 'sine', 0.16);
    }
  }

  // Star collection sound with progressive pitch
  public sfxStar(combo: number = 1) {
    const base = 523.25; // C5
    const multiplier = Math.pow(1.12, Math.min(combo, 12));
    const f1 = base * multiplier;
    this.playTone(f1, 0.14, 'sine', 0.15, f1 * 1.4);
    setTimeout(() => {
      this.playTone(f1 * 1.5, 0.2, 'triangle', 0.12);
    }, 60);
  }

  // Powerup Pickup (Shield, Magnet, Mystery Box)
  public sfxPowerup() {
    const notes = [440, 554, 659, 880];
    notes.forEach((f, idx) => {
      setTimeout(() => {
        this.playTone(f, 0.12, 'triangle', 0.14, f * 1.1);
      }, idx * 60);
    });
  }

  // Cute Boing sound (trampolines, bouncy turns)
  public sfxBoing() {
    this.playTone(220, 0.28, 'sine', 0.18, 550);
  }

  // Bubble Pop
  public sfxBubblePop() {
    const f = 600 + Math.random() * 400;
    this.playTone(f, 0.06, 'sine', 0.15, f * 1.6);
  }

  // Comic Bomb explosion (soft cartoon boom)
  public sfxBoom() {
    this.playNoise(0.5, 2000, 0.4);
    this.playTone(130, 0.45, 'sawtooth', 0.25, 35);
    this.playTone(80, 0.5, 'sine', 0.3, 30);
  }

  // Bee / Obstacle buzz
  public sfxBee() {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.playTone(320 + (i % 2) * 60, 0.06, 'sawtooth', 0.09);
      }, i * 40);
    }
  }

  // Proximity warning (soft chirp when dangerously close to bomb)
  public sfxWarning() {
    this.playTone(600, 0.05, 'triangle', 0.05);
  }

  // Oops / Fall off edge
  public sfxOops() {
    const notes = [440, 370, 311, 261];
    notes.forEach((f, idx) => {
      setTimeout(() => {
        this.playTone(f, 0.22, 'triangle', 0.14, f * 0.92);
      }, idx * 130);
    });
  }

  // Combo chime effect with escaled melody
  public sfxCombo(comboLevel: number = 2) {
    const scale = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    const notesToPlay = Math.min(comboLevel + 2, scale.length);
    for (let i = 0; i < notesToPlay; i++) {
      setTimeout(() => {
        this.playTone(scale[i], 0.15, 'triangle', 0.18, scale[i] * 1.2);
      }, i * 70);
    }
  }

  // Audience cheering / applause synthesis
  public sfxApplause() {
    for (let i = 0; i < 12; i++) {
      setTimeout(() => {
        this.playNoise(0.08, 1500 + Math.random() * 2000, 0.12);
        this.playTone(600 + Math.random() * 400, 0.08, 'sine', 0.08);
      }, Math.random() * 350);
    }
  }

  // Funny animal squeak
  public sfxSqueak() {
    this.playTone(900, 0.07, 'sine', 0.16, 1600);
  }

  // Water splash for frog
  public sfxSplash() {
    this.playNoise(0.18, 1200, 0.22);
    this.playTone(300, 0.12, 'sine', 0.15, 150);
  }

  // Slingshot stretch tone (rising pitch pitch bend as drag distance grows)
  public sfxSlingshotStretch(distRatio: number = 0.5) {
    const f = 180 + distRatio * 320;
    this.playTone(f, 0.05, 'sine', 0.1, f + 20);
  }

  // Slingshot release snap
  public sfxSlingshotRelease() {
    this.playTone(600, 0.08, 'sawtooth', 0.22, 180);
    this.playNoise(0.06, 2500, 0.2);
  }

  // Pinball Bumper chime
  public sfxPinballBumper() {
    this.playTone(880, 0.12, 'triangle', 0.25, 1320);
    this.playTone(440, 0.1, 'sine', 0.15);
  }

  // Pinball Flipper thud
  public sfxPinballFlipper() {
    this.playTone(180, 0.07, 'triangle', 0.2, 350);
  }

  // Nitro Boost acceleration roar
  public sfxNitro() {
    this.playTone(200, 0.4, 'sawtooth', 0.2, 900);
    this.playNoise(0.3, 3500, 0.15);
  }

  // Golden Coin collect chime
  public sfxCoin() {
    this.playTone(987.77, 0.08, 'sine', 0.2, 1318.51);
  }

  // Slow motion impact effect
  public sfxSlowMo() {
    this.playTone(350, 0.35, 'sine', 0.2, 90);
  }

  // Win fanfare (arpeggiated triumphant kid victory song)
  public sfxWin() {
    const melody = [
      { f: 523.25, d: 0.15 }, // C5
      { f: 659.25, d: 0.15 }, // E5
      { f: 783.99, d: 0.15 }, // G5
      { f: 1046.5, d: 0.28 }, // C6
      { f: 880.0, d: 0.15 },  // A5
      { f: 1046.5, d: 0.45 }  // C6
    ];
    let time = 0;
    melody.forEach((note) => {
      setTimeout(() => {
        this.playTone(note.f, note.d, 'triangle', 0.2);
        this.playTone(note.f / 2, note.d, 'sine', 0.12);
      }, time);
      time += note.d * 900;
    });
    this.sfxApplause();
  }

  // --- Background Music System ---

  public startBGM(theme: string = 'candy') {
    this.currentTheme = theme;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    if (!this.isMusicEnabled || this.isMuted) return;

    this.initCtx();
    this.currentStep = 0;

    // Theme-based melodic lines (pentatonic & joyful scales)
    const candyMelody = [523, 659, 784, 659, 880, 784, 659, 587, 523, 659, 784, 880, 1046, 784, 659, 587];
    const candyBass = [261, 261, 329, 329, 392, 392, 349, 349];

    const jungleMelody = [440, 523, 587, 659, 587, 523, 440, 392, 440, 523, 659, 784, 659, 587, 523, 440];
    const jungleBass = [220, 220, 261, 261, 293, 293, 196, 220];

    const spaceMelody = [587, 740, 880, 740, 987, 880, 740, 659, 587, 740, 880, 1174, 987, 880, 740, 659];
    const spaceBass = [293, 293, 370, 370, 440, 440, 329, 293];

    const oceanMelody = [493, 659, 784, 659, 880, 784, 659, 587, 493, 587, 659, 784, 987, 784, 659, 587];
    const oceanBass = [246, 246, 329, 329, 392, 392, 293, 246];

    let melody = candyMelody;
    let bass = candyBass;

    if (theme === 'jungle') {
      melody = jungleMelody;
      bass = jungleBass;
    } else if (theme === 'space') {
      melody = spaceMelody;
      bass = spaceBass;
    } else if (theme === 'ocean') {
      melody = oceanMelody;
      bass = oceanBass;
    }

    this.bgmInterval = setInterval(() => {
      if (!this.isMusicEnabled || this.isMuted || document.hidden) return;
      const idx = this.currentStep;
      const note = melody[idx % melody.length];
      const bassNote = bass[(idx >> 1) % bass.length];

      // Soft melodic lead
      this.playTone(note, 0.16, 'triangle', 0.038);
      // Soft bass note on every other step
      if (idx % 2 === 0) {
        this.playTone(bassNote, 0.28, 'sine', 0.05);
      }
      this.currentStep++;
    }, 240);
  }

  public stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const sounds = new SoundManager();
