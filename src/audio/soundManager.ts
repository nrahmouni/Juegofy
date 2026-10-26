// Sound Manager using Web Audio API for rich, kid-friendly sound effects, chiptune music & 100% synchronized voice synthesis

export interface SpeechItem {
  text: string;
  lang?: string;
  pauseAfterMs?: number;
}

type SpeakingListener = (isSpeaking: boolean) => void;

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isMusicEnabled: boolean = true;
  private bgmInterval: any = null;
  private currentStep: number = 0;
  private currentTheme: string = 'candy';
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private isSpeakingNow: boolean = false;
  private speechToken: number = 0;
  private lastSpokenKey: string = '';
  private lastSpokenAt: number = 0;
  private speakingListeners: Set<SpeakingListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        try {
          const list = window.speechSynthesis.getVoices();
          if (list && list.length > 0) {
            this.cachedVoices = list;
          }
        } catch {}
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  public subscribeSpeaking(listener: SpeakingListener): () => void {
    this.speakingListeners.add(listener);
    listener(this.isSpeakingNow);
    return () => {
      this.speakingListeners.delete(listener);
    };
  }

  private setSpeakingState(speaking: boolean) {
    if (this.isSpeakingNow === speaking) return;
    this.isSpeakingNow = speaking;
    this.speakingListeners.forEach((cb) => {
      try {
        cb(speaking);
      } catch {}
    });
  }

  public getIsSpeaking(): boolean {
    return this.isSpeakingNow;
  }

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
      this.cancelSpeech();
    } else if (this.isMusicEnabled) {
      this.startBGM(this.currentTheme);
    }
  }

  public cancelSpeech() {
    this.speechToken++;
    this.setSpeakingState(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
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

  // Play a synthesized oscillator tone
  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.15,
    endFreq?: number
  ) {
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
    } catch {}
  }

  // White noise burst for explosions, splashes & pops
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

  public sfxPop(pitch: number = 1) {
    this.playTone(450 * pitch, 0.08, 'sine', 0.14, 780 * pitch);
  }

  public sfxWhoosh() {
    this.playNoise(0.14, 2400, 0.18);
    this.playTone(280, 0.14, 'sine', 0.12, 680);
  }

  public sfxChomp() {
    this.playNoise(0.09, 1600, 0.28);
    this.playTone(260, 0.1, 'triangle', 0.22, 120);
    setTimeout(() => {
      this.playNoise(0.08, 1900, 0.24);
      this.playTone(320, 0.1, 'triangle', 0.2, 160);
    }, 110);
  }

  public sfxSizzle() {
    this.playNoise(0.24, 3200, 0.18);
    this.playTone(520, 0.12, 'sine', 0.12, 880);
  }

  public sfxCatch() {
    this.playTone(480, 0.09, 'sine', 0.18, 920);
    setTimeout(() => {
      this.playTone(720, 0.12, 'triangle', 0.16, 1180);
    }, 55);
  }

  public sfxPinataHit() {
    this.playNoise(0.16, 2800, 0.26);
    this.playTone(340, 0.12, 'triangle', 0.22, 760);
  }

  public sfxMagic() {
    const sparkle = [587.33, 783.99, 987.77, 1174.66, 1567.98];
    sparkle.forEach((f, idx) => {
      setTimeout(() => {
        this.playTone(f, 0.14, 'sine', 0.13, f * 1.15);
      }, idx * 45);
    });
  }

  public sfxCameraClick() {
    this.playNoise(0.04, 3000, 0.25);
    setTimeout(() => {
      this.playTone(800, 0.06, 'triangle', 0.15, 1200);
      this.playNoise(0.08, 1800, 0.3);
    }, 60);
  }

  public sfxCountdown(final: boolean = false) {
    if (final) {
      this.playTone(880, 0.25, 'triangle', 0.22, 1100);
    } else {
      this.playTone(520, 0.12, 'sine', 0.16);
    }
  }

  public sfxStar(combo: number = 1) {
    const base = 523.25; // C5
    const multiplier = Math.pow(1.12, Math.min(combo, 12));
    const f1 = base * multiplier;
    this.playTone(f1, 0.14, 'sine', 0.16, f1 * 1.4);
    setTimeout(() => {
      this.playTone(f1 * 1.5, 0.2, 'triangle', 0.13);
    }, 60);
  }

  public sfxPowerup() {
    const notes = [440, 554, 659, 880];
    notes.forEach((f, idx) => {
      setTimeout(() => {
        this.playTone(f, 0.12, 'triangle', 0.14, f * 1.1);
      }, idx * 60);
    });
  }

  public sfxBoing() {
    this.playTone(220, 0.28, 'sine', 0.18, 550);
  }

  public sfxBubblePop() {
    const f = 600 + Math.random() * 400;
    this.playTone(f, 0.06, 'sine', 0.16, f * 1.6);
  }

  public sfxBoom() {
    this.playNoise(0.5, 2000, 0.4);
    this.playTone(130, 0.45, 'sawtooth', 0.25, 35);
    this.playTone(80, 0.5, 'sine', 0.3, 30);
  }

  public sfxBee() {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.playTone(320 + (i % 2) * 60, 0.06, 'sawtooth', 0.09);
      }, i * 40);
    }
  }

  public sfxWarning() {
    this.playTone(600, 0.05, 'triangle', 0.05);
  }

  public sfxError() {
    this.playTone(280, 0.15, 'triangle', 0.16, 190);
    setTimeout(() => {
      this.playTone(210, 0.2, 'triangle', 0.16, 150);
    }, 110);
  }

  public sfxOops() {
    const notes = [440, 370, 311, 261];
    notes.forEach((f, idx) => {
      setTimeout(() => {
        this.playTone(f, 0.22, 'triangle', 0.14, f * 0.92);
      }, idx * 130);
    });
  }

  public sfxCombo(comboLevel: number = 2) {
    const scale = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    const notesToPlay = Math.min(comboLevel + 2, scale.length);
    for (let i = 0; i < notesToPlay; i++) {
      setTimeout(() => {
        this.playTone(scale[i], 0.15, 'triangle', 0.18, scale[i] * 1.2);
      }, i * 70);
    }
  }

  public sfxApplause() {
    for (let i = 0; i < 12; i++) {
      setTimeout(() => {
        this.playNoise(0.08, 1500 + Math.random() * 2000, 0.12);
        this.playTone(600 + Math.random() * 400, 0.08, 'sine', 0.08);
      }, Math.random() * 350);
    }
  }

  public sfxSqueak() {
    this.playTone(900, 0.07, 'sine', 0.16, 1600);
  }

  public sfxSplash() {
    this.playNoise(0.18, 1200, 0.22);
    this.playTone(300, 0.12, 'sine', 0.15, 150);
  }

  public sfxSlingshotStretch(distRatio: number = 0.5) {
    const f = 180 + distRatio * 320;
    this.playTone(f, 0.05, 'sine', 0.1, f + 20);
  }

  public sfxSlingshotRelease() {
    this.playTone(600, 0.08, 'sawtooth', 0.22, 180);
    this.playNoise(0.06, 2500, 0.2);
  }

  public sfxPinballBumper() {
    this.playTone(880, 0.12, 'triangle', 0.25, 1320);
    this.playTone(440, 0.1, 'sine', 0.15);
  }

  public sfxPinballFlipper() {
    this.playTone(180, 0.07, 'triangle', 0.2, 350);
  }

  public sfxNitro() {
    this.playTone(200, 0.4, 'sawtooth', 0.2, 900);
    this.playNoise(0.3, 3500, 0.15);
  }

  public sfxCoin() {
    this.playTone(987.77, 0.08, 'sine', 0.2, 1318.51);
  }

  public sfxSlowMo() {
    this.playTone(350, 0.35, 'sine', 0.2, 90);
  }

  public sfxWin() {
    const melody = [
      { f: 523.25, d: 0.15 }, // C5
      { f: 659.25, d: 0.15 }, // E5
      { f: 783.99, d: 0.15 }, // G5
      { f: 1046.5, d: 0.28 }, // C6
      { f: 880.0, d: 0.15 }, // A5
      { f: 1046.5, d: 0.45 }, // C6
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

  public startBGM(theme: string = 'candy') {
    this.currentTheme = theme;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    if (!this.isMusicEnabled || this.isMuted) return;

    this.initCtx();
    this.currentStep = 0;

    const candyMelody = [523, 659, 784, 659, 880, 784, 659, 587, 523, 659, 784, 880, 1046, 784, 659, 587];
    const candyBass = [261, 261, 329, 329, 392, 392, 349, 349];

    const jungleMelody = [440, 523, 587, 659, 587, 523, 440, 392, 440, 523, 659, 784, 659, 587, 523, 440];
    const jungleBass = [220, 220, 261, 261, 293, 293, 196, 220];

    const spaceMelody = [587, 740, 880, 740, 987, 880, 740, 659, 587, 740, 880, 1174, 987, 880, 740, 659];
    const spaceBass = [293, 293, 370, 370, 440, 440, 329, 293];

    const oceanMelody = [493, 659, 784, 659, 880, 784, 659, 587, 493, 587, 659, 784, 987, 784, 659, 587];
    const oceanBass = [246, 246, 329, 329, 392, 392, 293, 246];

    const volcanoMelody = [523, 622, 698, 784, 698, 622, 523, 466, 523, 622, 784, 932, 784, 698, 622, 523];
    const volcanoBass = [196, 196, 233, 233, 262, 262, 220, 196];

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
    } else if (theme === 'volcano') {
      melody = volcanoMelody;
      bass = volcanoBass;
    }

    this.bgmInterval = setInterval(() => {
      if (!this.isMusicEnabled || this.isMuted || document.hidden) return;
      // Duck BGM volume automatically while voice synthesis is speaking so voice is crystal clear!
      const volScale = this.isSpeakingNow ? 0.2 : 1.0;
      const idx = this.currentStep;
      const note = melody[idx % melody.length];
      const bassNote = bass[(idx >> 1) % bass.length];

      this.playTone(note, 0.16, 'triangle', 0.03 * volScale);
      if (idx % 2 === 0) {
        this.playTone(bassNote, 0.28, 'sine', 0.04 * volScale);
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

  // Pick the highest quality, most natural-sounding voice for the requested language
  private pickBestVoice(lang: string): SpeechSynthesisVoice | null {
    const voices =
      this.cachedVoices.length > 0
        ? this.cachedVoices
        : typeof window !== 'undefined' && 'speechSynthesis' in window
        ? window.speechSynthesis.getVoices()
        : [];

    if (!voices || voices.length === 0) return null;

    const targetLower = lang.toLowerCase();
    const langPrefix = targetLower.split('-')[0];

    const matching = voices.filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith(langPrefix));
    if (matching.length === 0) return null;

    const scoreVoice = (v: SpeechSynthesisVoice): number => {
      let score = 0;
      const vLang = v.lang.toLowerCase().replace('_', '-');
      const name = v.name.toLowerCase();

      if (vLang === targetLower) score += 25;
      if (name.includes('natural') || name.includes('online') || name.includes('neural') || name.includes('wavenet') || name.includes('studio')) score += 55;
      if (name.includes('google')) score += 45;
      if (name.includes('microsoft')) score += 28;
      // Prefer remote/cloud voices over compact offline robotic ones
      if (v.localService) score -= 15;
      if (name.includes('premium') || name.includes('enhanced') || name.includes('siri')) score += 30;
      if (
        name.includes('monica') ||
        name.includes('paulina') ||
        name.includes('helena') ||
        name.includes('sabina') ||
        name.includes('luciana') ||
        name.includes('elvira') ||
        name.includes('amelie') ||
        name.includes('thomas') ||
        name.includes('denise') ||
        name.includes('colette') ||
        name.includes('xander') ||
        name.includes('ellen') ||
        name.includes('laila') ||
        name.includes('mariam') ||
        name.includes('maged') ||
        name.includes('tarik')
      ) {
        score += 25;
      }
      if (!v.localService) score += 10;
      return score;
    };

    const sorted = [...matching].sort((a, b) => scoreVoice(b) - scoreVoice(a));
    return sorted[0] || matching[0];
  }

  private speakSingleRaw(text: string, lang: string, token: number): Promise<void> {
    return new Promise((resolve) => {
      if (this.isMuted || !text || token !== this.speechToken) {
        resolve();
        return;
      }
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve();
        return;
      }

      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(fallbackTimer);
        if (token === this.speechToken) {
          this.setSpeakingState(false);
        }
        resolve();
      };

      // Estimated duration fallback so if mobile browser TTS drops onend event, gameplay never hangs
      const estimatedMs = Math.max(850, Math.min(3400, text.trim().length * 78 + 420));
      const fallbackTimer = setTimeout(finish, estimatedMs);

      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;

        const bestVoice = this.pickBestVoice(lang);
        if (bestVoice) {
          utterance.voice = bestVoice;
        }

        // Softer, more "storyteller" cadence (robotic = high rate + high pitch)
        const isSpanish = lang.toLowerCase().startsWith('es');
        const wordCount = text.trim().split(/\s+/).length;
        if (isSpanish) {
          utterance.rate = wordCount > 4 ? 0.88 : 0.92;
          utterance.pitch = 1.0;
        } else if (lang.toLowerCase().startsWith('fr')) {
          utterance.rate = 0.9;
          utterance.pitch = 1.02;
        } else if (lang.toLowerCase().startsWith('ar')) {
          utterance.rate = 0.86;
          utterance.pitch = 1.0;
        } else {
          utterance.rate = wordCount > 2 ? 0.9 : 0.93;
          utterance.pitch = 1.0;
        }
        utterance.volume = 1.0;

        utterance.onstart = () => {
          if (token === this.speechToken) {
            this.setSpeakingState(true);
          }
        };
        utterance.onend = finish;
        utterance.onerror = finish;

        this.setSpeakingState(true);
        window.speechSynthesis.speak(utterance);
      } catch {
        finish();
      }
    });
  }

  /**
   * Normalize kid prompts: never stack "¡Atrapa X!" + "El X" back-to-back.
   * Speaks only the learning audio once.
   */
  public async speakPrompt(
    item: { audioText: string; audioLang?: string; es?: string },
    style: 'word' | 'find' | 'catch' = 'word'
  ): Promise<void> {
    const word = (item.audioText || item.es || '').trim();
    if (!word) return;
    let phrase = word;
    if (style === 'find') phrase = `¿Dónde está? ${word}`;
    if (style === 'catch') phrase = `¡Atrapa! ${word}`;
    // "find/catch" already includes the word once — do not speak word again after
    await this.speakAsync(phrase, item.audioLang || 'es-ES', true);
  }

  /** Praise only — skips if the exact same line just played */
  public async speakPraise(text: string): Promise<void> {
    await this.speakAsync(text, 'es-ES', true);
  }

  /**
   * Speaks a single utterance and resolves when the voice finishes speaking.
   */
  /** Soft punctuation so TTS breathes more naturally */
  private humanizeSpeechText(text: string, lang: string): string {
    let t = text.trim().replace(/\s+/g, ' ');
    // Avoid shouting ALL CAPS (very robotic)
    if (t === t.toUpperCase() && t.length > 2) {
      t = t.toLowerCase();
      t = t.charAt(0).toUpperCase() + t.slice(1);
    }
    // Tiny pause after article-like words for Spanish
    if (lang.toLowerCase().startsWith('es')) {
      t = t.replace(/\b(El|La|Los|Las|Un|Una)\s+/g, '$1, ');
    }
    return t;
  }

  public async speakAsync(
    text: string,
    lang: string = 'es-ES',
    interrupt: boolean = true
  ): Promise<void> {
    if (this.isMuted || !text) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const clean = this.humanizeSpeechText(text, lang);
    if (!clean) return;
    const key = `${lang}|${clean.toLowerCase()}`;
    const now = Date.now();
    // Prevent "el el perro" / double prompts within 1.6s
    if (key === this.lastSpokenKey && now - this.lastSpokenAt < 1600) {
      return;
    }
    this.lastSpokenKey = key;
    this.lastSpokenAt = now;

    const myToken = interrupt ? ++this.speechToken : this.speechToken;
    if (interrupt) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    await this.speakSingleRaw(text, lang, myToken);
  }

  /**
   * Speaks a sequence of utterances one after another (e.g., first the target word in French/Arabic/Flemish,
   * then the personalized praise in Spanish) without cutting off any word!
   * Resolves `true` if completed uninterrupted, or `false` if superseded by a newer action.
   */
  public async speakSequence(items: SpeechItem[], interrupt: boolean = true): Promise<boolean> {
    if (this.isMuted || items.length === 0) return true;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return true;

    const myToken = interrupt ? ++this.speechToken : this.speechToken;
    if (interrupt) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    for (let i = 0; i < items.length; i++) {
      if (myToken !== this.speechToken || this.isMuted) {
        return false;
      }
      const item = items[i];
      if (!item.text) continue;
      await this.speakSingleRaw(item.text, item.lang || 'es-ES', myToken);
      if (myToken !== this.speechToken) return false;
      if (item.pauseAfterMs && item.pauseAfterMs > 0) {
        await new Promise((r) => setTimeout(r, item.pauseAfterMs));
      }
    }

    return myToken === this.speechToken;
  }

  // Backward-compatible fire-and-forget wrapper
  public speak(text: string, lang: string = 'es-ES', interrupt: boolean = true) {
    void this.speakAsync(text, lang, interrupt);
  }

  /**
   * Resolves when the current utterance finishes (or immediately if not speaking).
   * Use this to keep gameplay perfectly in sync with voice.
   */
  public waitUntilNotSpeaking(timeoutMs: number = 5000): Promise<void> {
    if (!this.isSpeakingNow) return Promise.resolve();
    return new Promise((resolve) => {
      const unsub = this.subscribeSpeaking((speaking) => {
        if (!speaking) {
          unsub();
          resolve();
        }
      });
      // Safety timeout so the game never hangs forever on broken TTS
      setTimeout(() => {
        unsub();
        this.setSpeakingState(false);
        resolve();
      }, Math.max(800, timeoutMs));
    });
  }

  /** Light haptic feedback for kids (supported on most modern mobile browsers). */
  public haptic(pattern: number | number[] = 25) {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {}
  }

  public hapticSuccess() {
    this.haptic([18, 40, 28]);
  }

  public hapticError() {
    this.haptic([40, 30, 40]);
  }
}

export const sounds = new SoundManager();
