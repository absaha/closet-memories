const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.1) {
  if (!audioContext) return;
  
  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (e) {
    console.log('Audio not available');
  }
}

export const sounds = {
  like: () => {
    playTone(880, 0.1, 'sine', 0.15);
    setTimeout(() => playTone(1100, 0.15, 'sine', 0.1), 50);
  },
  
  unlike: () => {
    playTone(440, 0.1, 'sine', 0.1);
  },
  
  share: () => {
    playTone(523, 0.08, 'sine', 0.1);
    setTimeout(() => playTone(659, 0.08, 'sine', 0.1), 60);
    setTimeout(() => playTone(784, 0.12, 'sine', 0.1), 120);
  },
  
  comment: () => {
    playTone(600, 0.1, 'triangle', 0.1);
  },
  
  success: () => {
    playTone(523, 0.1, 'sine', 0.12);
    setTimeout(() => playTone(659, 0.1, 'sine', 0.12), 100);
    setTimeout(() => playTone(784, 0.15, 'sine', 0.12), 200);
  },
  
  pop: () => {
    playTone(800, 0.05, 'sine', 0.1);
  },
  
  click: () => {
    playTone(1000, 0.03, 'square', 0.05);
  },
  
  swipe: () => {
    playTone(400, 0.08, 'sine', 0.08);
  },
  
  notification: () => {
    playTone(880, 0.1, 'sine', 0.12);
    setTimeout(() => playTone(1100, 0.1, 'sine', 0.1), 100);
  },
  
  vote: () => {
    playTone(600, 0.1, 'sine', 0.12);
    setTimeout(() => playTone(800, 0.15, 'sine', 0.1), 80);
  },
  
  upload: () => {
    playTone(400, 0.1, 'sine', 0.1);
    setTimeout(() => playTone(500, 0.1, 'sine', 0.1), 100);
    setTimeout(() => playTone(600, 0.1, 'sine', 0.1), 200);
    setTimeout(() => playTone(800, 0.2, 'sine', 0.12), 300);
  },
  
  error: () => {
    playTone(200, 0.15, 'square', 0.1);
    setTimeout(() => playTone(180, 0.2, 'square', 0.1), 150);
  },
  
  tabSwitch: () => {
    playTone(700, 0.04, 'sine', 0.08);
  }
};

export function initAudio() {
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
}
