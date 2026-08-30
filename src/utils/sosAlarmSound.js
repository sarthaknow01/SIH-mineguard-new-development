// Web Audio API Synthesizer for Industrial SOS Emergency Alarm Tone
class SOSAlarmSound {
  constructor() {
    this.audioCtx = null;
    this.intervalId = null;
    this.isPlaying = false;
  }

  start() {
    if (this.isPlaying) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      
      this.audioCtx = new AudioContextClass();
      this.isPlaying = true;

      // Resume context if suspended by browser autoplay policy
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      let highTone = true;

      const playBeep = () => {
        if (!this.audioCtx || !this.isPlaying) return;
        try {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          
          osc.type = 'sawtooth';
          const freq = highTone ? 880 : 660; // Alternating 880Hz and 660Hz dual-tone
          osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
          
          gain.gain.setValueAtTime(0.35, this.audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.22);
          
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          
          osc.start();
          osc.stop(this.audioCtx.currentTime + 0.22);
          
          highTone = !highTone;
        } catch (e) {
          console.warn('SOS Audio beep playback error:', e);
        }
      };

      playBeep();
      this.intervalId = setInterval(playBeep, 260);
    } catch (err) {
      console.warn('Could not initialize Web Audio API for SOS Alarm:', err);
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (e) {}
      this.audioCtx = null;
    }
  }
}

export const sosAlarmSound = new SOSAlarmSound();
