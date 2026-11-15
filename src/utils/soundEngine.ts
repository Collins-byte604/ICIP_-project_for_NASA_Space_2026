import { AppLanguage, EmergencyLevel } from "../types/icip";

// Web Audio API + SpeechSynthesis aerospace sound & voice engine for ICIP

class IcipSoundEngine {
  private ctx: AudioContext | null = null;
  private alarmInterval: number | null = null;
  private muted = false;
  private cachedVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.cachedVoices = window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.cachedVoices = window.speechSynthesis.getVoices();
      };
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
    if (mute) {
      this.stopEmergencyAlarm();
      this.stopSpeech();
    }
  }

  public playStartupChime(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.075);

      gain.gain.setValueAtTime(0.0001, now + idx * 0.075);
      gain.gain.exponentialRampToValueAtTime(0.08, now + idx * 0.075 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.075 + 0.38);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.075);
      osc.stop(now + idx * 0.075 + 0.4);
    });
  }

  public playScanPulse(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.45);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.52);
  }

  public playSuccessTone(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [523.25, 783.99].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.11);

      gain.gain.setValueAtTime(0.001, now + idx * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.07, now + idx * 0.11 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.11 + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.11);
      osc.stop(now + idx * 0.11 + 0.32);
    });
  }

  private playAlarmBurst(level: EmergencyLevel): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs =
      level === 3
        ? [960, 680, 960] // Nivel 3 Rojo: urgente
        : level === 2
        ? [740, 587] // Nivel 2 Amarillo: precaución media
        : [523, 659]; // Nivel 1 Azul: alerta preventiva leve

    freqs.forEach((freq, idx) => {
      const start = now + idx * 0.19;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = level === 3 ? "sawtooth" : level === 2 ? "triangle" : "sine";
      osc.frequency.setValueAtTime(freq, start);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(level === 3 ? 2100 : 1600, start);

      const peak = level === 3 ? 0.075 : level === 2 ? 0.065 : 0.055;
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(peak, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.17);
    });
  }

  public startEmergencyAlarm(level: EmergencyLevel = 3): void {
    this.stopEmergencyAlarm();
    if (this.muted) return;

    const intervalMs = level === 3 ? 2000 : level === 2 ? 2800 : 3600;
    this.playAlarmBurst(level);
    this.alarmInterval = window.setInterval(() => {
      this.playAlarmBurst(level);
    }, intervalMs);
  }

  public stopEmergencyAlarm(): void {
    if (this.alarmInterval !== null) {
      window.clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
  }

  public speak(text: string, lang: AppLanguage = "en"): void {
    if (this.muted || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const targetPrefix = lang === "es" ? "es" : "en";
      utterance.lang = lang === "es" ? "es-ES" : "en-US";
      utterance.rate = 0.96;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const voices =
        this.cachedVoices.length > 0
          ? this.cachedVoices
          : window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find((v) => v.lang.toLowerCase().startsWith(`${targetPrefix}-`)) ||
        voices.find((v) => v.lang.toLowerCase().includes(targetPrefix));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      window.speechSynthesis.speak(utterance);
      window.speechSynthesis.resume();
    } catch {
      // Ignore speech synthesis errors in restricted environments
    }
  }

  public stopSpeech(): void {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
  }
}

export const soundEngine = new IcipSoundEngine();
