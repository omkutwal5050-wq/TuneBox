import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, CircleStop, Hand, HelpCircle, Mic2, Play, Radio, Save, Sparkles, Volume2, X } from 'lucide-react';
import * as Tone from 'tone';
import '@mediapipe/hands';
import '@mediapipe/drawing_utils';
import { mockSongs } from '../data/songsData';
import { PlayerContext } from '../context/Playercontext';

const INSTRUMENTS = [
  { id: 'guitar', label: 'Guitar', emoji: '🎸', color: '#34d399', tags: ['acoustic', 'rock', 'guitar', 'ambient'] },
  { id: 'tabla', label: 'Tabla', emoji: '🪘', color: '#fb923c', tags: ['punjabi', 'world', 'tabla', 'rhythm', 'hip hop'] },
  { id: 'flute', label: 'Flute', emoji: '🪈', color: '#67e8f9', tags: ['ambient', 'acoustic', 'flute', 'chill'] },
  { id: 'synth', label: 'Synthesizer', emoji: '🎹', color: '#c084fc', tags: ['synth', 'electronic', 'wave', 'ambient'] },
];

const RECORDING_FORMATS = [
  { id: 'webm', label: 'WebM', mimeTypes: ['video/webm;codecs=vp8,opus', 'video/webm'], extension: 'webm' },
  { id: 'mp4', label: 'MP4', mimeTypes: ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4'], extension: 'mp4' },
];

const SOUNDFONT_BASE = 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM';
const MEDIAPIPE_HANDS_SCRIPT = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js';
let handsScriptPromise;

const isConstructible = (value) => {
  if (typeof value !== 'function') return false;
  try {
    Reflect.construct(Object, [], value);
    return true;
  } catch {
    return false;
  }
};

const getHandsConstructor = () => {
  const handsGlobal = window.Hands;
  return [handsGlobal, handsGlobal?.Hands, handsGlobal?.default].find(isConstructible);
};

const loadHandsConstructor = () => {
  const handsConstructor = getHandsConstructor();
  if (handsConstructor) return Promise.resolve(handsConstructor);
  if (handsScriptPromise) return handsScriptPromise;

  handsScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${MEDIAPIPE_HANDS_SCRIPT}"]`);
    const script = existingScript || document.createElement('script');
    const handleLoad = () => {
      const loadedHandsConstructor = getHandsConstructor();
      if (loadedHandsConstructor) {
        script.dataset.loaded = 'true';
        resolve(loadedHandsConstructor);
      }
      else reject(new Error('The hand-tracking library loaded without a usable Hands constructor.'));
    };
    const handleError = () => reject(new Error('The hand-tracking library could not be loaded.'));

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });
    if (!existingScript) {
      script.src = MEDIAPIPE_HANDS_SCRIPT;
      script.async = true;
      document.head.appendChild(script);
    } else if (script.dataset.loaded === 'true' || script.readyState === 'complete') {
      handleLoad();
    }
  }).catch((error) => {
    handsScriptPromise = undefined;
    throw error;
  });

  return handsScriptPromise;
};

const SAMPLE_URLS = {
  guitar: {
    C3: `${SOUNDFONT_BASE}/acoustic_guitar_steel-mp3/C3.mp3`,
    E3: `${SOUNDFONT_BASE}/acoustic_guitar_steel-mp3/E3.mp3`,
    G3: `${SOUNDFONT_BASE}/acoustic_guitar_steel-mp3/G3.mp3`,
    C4: `${SOUNDFONT_BASE}/acoustic_guitar_steel-mp3/C4.mp3`,
  },
  flute: {
    C4: `${SOUNDFONT_BASE}/flute-mp3/C4.mp3`,
    E4: `${SOUNDFONT_BASE}/flute-mp3/E4.mp3`,
    G4: `${SOUNDFONT_BASE}/flute-mp3/G4.mp3`,
    C5: `${SOUNDFONT_BASE}/flute-mp3/C5.mp3`,
  },
  tabla: {
    // FluidR3 GM does not ship tabla_bayan/tabla_dayan banks; use the
    // physical-model tabla voice without issuing failing CDN requests.
  },
};

const distance = (first, second) => Math.hypot(first.x - second.x, first.y - second.y);

const isPinching = (landmarks) => {
  const thumbIndexDistance = distance(landmarks[4], landmarks[8]);
  const indexToPalmDistance = distance(landmarks[8], landmarks[0]);
  return thumbIndexDistance < 0.065 && indexToPalmDistance > 0.16;
};

const smoothLandmarks = (previous, next, alpha = 0.35) => next.map((landmark, index) => {
  const previousLandmark = previous?.[index];
  if (!previousLandmark) return { ...landmark };
  return {
    ...landmark,
    x: previousLandmark.x + (landmark.x - previousLandmark.x) * alpha,
    y: previousLandmark.y + (landmark.y - previousLandmark.y) * alpha,
    z: previousLandmark.z + (landmark.z - previousLandmark.z) * alpha,
  };
});

const updateToneParameter = (parameter, value, rampSeconds = 0.04) => {
  if (parameter && typeof parameter.rampTo === 'function') {
    parameter.rampTo(value, rampSeconds);
    return;
  }
  if (parameter && typeof parameter === 'object' && 'value' in parameter) {
    parameter.value = value;
  }
};

const isFist = (landmarks) => {
  const palm = landmarks[0];
  const fingertips = [landmarks[8], landmarks[12], landmarks[16], landmarks[20]];
  return fingertips.every((finger) => distance(finger, palm) < 0.28);
};

const getLyrics = (track) => String(track?.lyrics || '').split('\n').filter(Boolean);

const formatBytes = (bytes) => {
  if (!bytes) return '0 KB';
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function AirStudio({ songs = mockSongs, onSelectTrack }) {
  const { audioRef: playerAudioRef, currentTrack: playerTrack, time: playerTime, selectTrack: selectPlayerTrack } = useContext(PlayerContext);
  const [instrumentId, setInstrumentId] = useState('guitar');
  const [selectedTrack, setSelectedTrack] = useState(playerTrack || null);
  const [performanceMode, setPerformanceMode] = useState('catalog');
  const [ownLyrics, setOwnLyrics] = useState('');
  const [microphoneStarted, setMicrophoneStarted] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [handCount, setHandCount] = useState(0);
  const [handStates, setHandStates] = useState({ left: 'Not detected', right: 'Not detected' });
  const [masterVolume, setMasterVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingFormat, setRecordingFormat] = useState('webm');
  const [recordingReview, setRecordingReview] = useState(null);
  const [recordingQuality, setRecordingQuality] = useState('standard');
  const [guideOpen, setGuideOpen] = useState(false);
  const [tone, setTone] = useState(0.55);
  const [noteLength, setNoteLength] = useState(0.35);
  const [instrumentLevel, setInstrumentLevel] = useState(1.35);
  const [status, setStatus] = useState('Start the camera, then perform in the air');
  const [currentTime, setCurrentTime] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const handsRef = useRef(null);
  const toneEngineRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaDestinationRef = useRef(null);
  const recorderRef = useRef(null);
  const recorderStopTimerRef = useRef(null);
  const chunksRef = useRef([]);
  const recordingUrlRef = useRef('');
  const previousRightXRef = useRef(null);
  const rightPinchRef = useRef(false);
  const rightFistRef = useRef(false);
  const lastTriggerRef = useRef(0);
  const instrumentIdRef = useRef(null);
  const instrumentLabelRef = useRef('');
  const playInstrumentNoteRef = useRef(null);
  const microphoneRef = useRef(null);
  const handFrameBusyRef = useRef(false);
  const handFrameTimerRef = useRef(null);
  const handRenderRef = useRef(null);
  const latestLandmarksRef = useRef([]);
  const latestHandednessRef = useRef([]);
  const handSlotsRef = useRef({ left: null, right: null });
  const lastExpressionRef = useRef(null);
  const notePulseRef = useRef(0);
  const waveformRef = useRef(null);
  const waveformAnimationRef = useRef(null);
  const handUiUpdateRef = useRef(0);
  const lastHandCountRef = useRef(-1);
  const lastVolumeRef = useRef(masterVolume);
  const lastMuteRef = useRef(isMuted);

  const instrument = INSTRUMENTS.find((item) => item.id === instrumentId) || INSTRUMENTS[0];
  const [audioReady, setAudioReady] = useState(false);
  const [sampleStatus, setSampleStatus] = useState('Click sound check to load instruments');
  const availableFormats = useMemo(() => RECORDING_FORMATS.filter((format) => (
    typeof MediaRecorder !== 'undefined'
      && format.mimeTypes.some((mimeType) => MediaRecorder.isTypeSupported(mimeType))
  )), []);
  const activeTrack = performanceMode === 'catalog' ? (playerTrack || selectedTrack) : null;

  const recommendations = useMemo(() => {
    const matching = songs.filter((song) => {
      const searchable = `${song.title} ${song.artist} ${song.genre}`.toLowerCase();
      return instrument.tags.some((tag) => searchable.includes(tag));
    });
    return matching.length ? matching : songs;
  }, [instrument.tags, songs]);

  const lyrics = useMemo(() => (
    performanceMode === 'own'
      ? ownLyrics.split('\n').map((line) => line.trim()).filter(Boolean)
      : getLyrics(activeTrack)
  ), [activeTrack, ownLyrics, performanceMode]);
  const activeLyricIndex = lyrics.length
    ? Math.min(lyrics.length - 1, Math.floor((performanceMode === 'own' ? playerTime.currentTime : currentTime) / 4))
    : 0;

  const playInstrumentNote = useCallback(() => {
    const engine = toneEngineRef.current;
    if (!engine) {
      setStatus('Click sound check before performing');
      return;
    }
    const now = Tone.now();
    const velocity = isMuted ? 0.05 : 0.85;
    const note = instrumentId === 'guitar' ? (tone > 0.66 ? 'G3' : tone > 0.33 ? 'E3' : 'C3') : instrumentId === 'flute' ? (tone > 0.66 ? 'G4' : tone > 0.33 ? 'E4' : 'C4') : instrumentId === 'tabla' ? (tone > 0.5 ? 'C3' : 'C2') : (tone > 0.66 ? 'G4' : tone > 0.33 ? 'E4' : 'C4');
    if (instrumentId === 'guitar') {
      engine.guitar.detune = (tone - 0.5) * 2400;
      if (engine.guitar.loaded) engine.guitar.triggerAttackRelease(note, noteLength, now, velocity);
      else engine.guitarFallback.triggerAttackRelease(note, noteLength, now, velocity);
    } else if (instrumentId === 'tabla') {
      engine.tabla.detune = (tone - 0.5) * 1200;
      if (engine.tabla.loaded) engine.tabla.triggerAttackRelease(note, noteLength, now, velocity);
      else engine.tablaFallback.triggerAttackRelease(note === 'C2' ? 'C2' : 'G2', noteLength, now, velocity);
    } else if (instrumentId === 'flute') {
      engine.flute.detune = (tone - 0.5) * 1800;
      if (engine.flute.loaded) engine.flute.triggerAttackRelease(note, noteLength, now, velocity);
      else engine.fluteFallback.triggerAttackRelease(note, noteLength, now, velocity);
    } else {
      engine.synthFilter.frequency.value = 500 + tone * 6500;
      engine.synth.triggerAttackRelease(note, noteLength, now, velocity);
    }
    notePulseRef.current = 1;
  }, [instrumentId, isMuted, noteLength, setStatus, tone]);

  useEffect(() => {
    instrumentIdRef.current = instrumentId;
    instrumentLabelRef.current = instrument.label;
    playInstrumentNoteRef.current = playInstrumentNote;
  }, [instrument.label, instrumentId, playInstrumentNote]);

  const handleResults = useCallback((results) => {
    const hands = results.multiHandLandmarks || [];
    latestHandednessRef.current = results.multiHandedness || [];
    const now = performance.now();
    const detectedSlots = { left: null, right: null };
    hands.forEach((landmarks, index) => {
      const mirroredCenterX = landmarks.reduce((sum, landmark) => sum + (1 - landmark.x), 0) / landmarks.length;
      const visualSide = mirroredCenterX < 0.5 ? 'left' : 'right';
      const previousSlot = handSlotsRef.current[visualSide];
      const smoothedLandmarks = smoothLandmarks(previousSlot?.landmarks, landmarks);
      if (!detectedSlots[visualSide]) detectedSlots[visualSide] = { landmarks: smoothedLandmarks, seenAt: now };
      else {
        const fallbackSide = visualSide === 'left' ? 'right' : 'left';
        if (!detectedSlots[fallbackSide]) {
          const fallbackPrevious = handSlotsRef.current[fallbackSide];
          detectedSlots[fallbackSide] = { landmarks: smoothLandmarks(fallbackPrevious?.landmarks, landmarks), seenAt: now };
        }
      }
      if (!detectedSlots.left && latestHandednessRef.current[index]?.label === 'Right') {
        detectedSlots.left = { landmarks: smoothedLandmarks, seenAt: now };
      }
      if (!detectedSlots.right && latestHandednessRef.current[index]?.label === 'Left') {
        detectedSlots.right = { landmarks: smoothedLandmarks, seenAt: now };
      }
    });
    handSlotsRef.current = {
      left: detectedSlots.left || (handSlotsRef.current.left && now - handSlotsRef.current.left.seenAt < 220 ? handSlotsRef.current.left : null),
      right: detectedSlots.right || (handSlotsRef.current.right && now - handSlotsRef.current.right.seenAt < 220 ? handSlotsRef.current.right : null),
    };
    latestLandmarksRef.current = hands.length
      ? hands
      : Object.values(handSlotsRef.current).filter(Boolean).map((slot) => slot.landmarks);
    const uiNow = performance.now();
    const stableHandCount = Object.values(handSlotsRef.current).filter(Boolean).length;
    if (stableHandCount !== lastHandCountRef.current) {
      lastHandCountRef.current = stableHandCount;
      setHandCount(stableHandCount);
    }
    const leftHand = handSlotsRef.current.left?.landmarks;
    const rightHand = handSlotsRef.current.right?.landmarks;

    if (uiNow - handUiUpdateRef.current > 120) {
      handUiUpdateRef.current = uiNow;
      setHandStates({
        left: leftHand ? (isFist(leftHand) ? 'Fist' : isPinching(leftHand) ? 'Pinch' : 'Open') : 'Not detected',
        right: rightHand ? (isFist(rightHand) ? 'Fist' : isPinching(rightHand) ? 'Pinch' : 'Open') : 'Not detected',
      });
    }

    const engine = toneEngineRef.current;
    if (leftHand && engine) {
      const expression = Math.max(0, Math.min(1, 1 - leftHand[8].y));
      if (lastExpressionRef.current === null || Math.abs(expression - lastExpressionRef.current) > 0.025) {
        lastExpressionRef.current = expression;
        engine.guitarWah.baseFrequency = 250 + expression * 3000;
        updateToneParameter(engine.synthFilter.frequency, 250 + expression * 7000);
        engine.flute.detune = (expression - 0.5) * 500;
        engine.tablaFallback.pitchDecay = 0.04 + expression * 0.3;
      }
      const leftPinch = isPinching(leftHand);
      if (leftPinch !== lastMuteRef.current) {
        lastMuteRef.current = leftPinch;
        setIsMuted(leftPinch);
      }
      updateToneParameter(engine.master.gain, leftPinch ? 0.02 : masterVolume);
    }

    if (rightHand && engine) {
      const pinching = !isFist(rightHand) && isPinching(rightHand);
      const fist = isFist(rightHand);
      const crossedPinch = pinching && !rightPinchRef.current;
      if (crossedPinch && performance.now() - lastTriggerRef.current > 65) {
        lastTriggerRef.current = performance.now();
        playInstrumentNoteRef.current?.();
        setStatus(`${instrumentLabelRef.current} ${instrumentIdRef.current === 'tabla' ? 'stroke' : 'note'} triggered`);
      }
      rightPinchRef.current = pinching;

      const currentX = rightHand[8].x;
      if (previousRightXRef.current !== null && Math.abs(currentX - previousRightXRef.current) > 0.16) {
        setStatus(currentX > previousRightXRef.current ? 'Swipe right: groove unlocked' : 'Swipe left: groove reset');
      }
      previousRightXRef.current = currentX;
      if (fist && !rightFistRef.current) setStatus('Right fist detected: hold to shape the groove');
      rightFistRef.current = fist;
    }
  }, [masterVolume]);

  useEffect(() => {
    if (!cameraStarted) return undefined;
    const render = () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (canvas && video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 360;
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
        const context = canvas.getContext('2d');
        context.save();
        context.clearRect(0, 0, width, height);
        context.translate(width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, width, height);
        context.restore();
        if (typeof window.drawConnectors === 'function' && typeof window.drawLandmarks === 'function') {
          latestLandmarksRef.current.forEach((landmarks) => {
            const mirroredLandmarks = landmarks.map((landmark) => ({ ...landmark, x: 1 - landmark.x }));
            window.drawConnectors(context, mirroredLandmarks, window.HAND_CONNECTIONS, { color: instrument.color, lineWidth: 6 });
            window.drawLandmarks(context, mirroredLandmarks, { color: '#ffffff', lineWidth: 2, radius: 6 });
          });
        }
      }
      handRenderRef.current = requestAnimationFrame(render);
    };
    handRenderRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(handRenderRef.current);
  }, [cameraStarted, instrument.color]);

  const setupAudio = useCallback(async () => {
    if (navigator.userActivation && !navigator.userActivation.isActive) {
      throw new Error('Click an Air Studio control before starting audio.');
    }
    if (Tone.getContext().state === 'closed') {
      Tone.setContext(new Tone.Context());
    }
    await Tone.start();
    if (toneEngineRef.current) return;
    const rawContext = Tone.getContext().rawContext;
    const master = new Tone.Gain(masterVolume);
    const instrumentGain = new Tone.Gain(instrumentLevel);
    const instrumentEcho = new Tone.FeedbackDelay({ delayTime: 0.24, feedback: 0.34, wet: 0.28 });
    const guitarWah = new Tone.AutoWah({ baseFrequency: 1200, octaves: 4, sensitivity: -24, wet: 0.75 });
    const synthFilter = new Tone.Filter(1800, 'lowpass');
    const analyser = rawContext.createAnalyser();
    const mediaDestination = rawContext.createMediaStreamDestination();
    analyser.fftSize = 1024;
    master.connect(Tone.getDestination());
    instrumentGain.connect(instrumentEcho);
    instrumentEcho.connect(master);
    master.output.connect(analyser);
    master.output.connect(mediaDestination);
    const guitar = new Tone.Sampler({ urls: SAMPLE_URLS.guitar, release: 1.4 }).connect(guitarWah);
    guitarWah.connect(instrumentGain);
    const guitarFallback = new Tone.PluckSynth({ attackNoise: 1, dampening: 4200, resonance: 0.92 }).connect(guitarWah);
    const tabla = new Tone.Sampler({ urls: SAMPLE_URLS.tabla, release: 0.5 }).connect(instrumentGain);
    const tablaFallback = new Tone.MembraneSynth({ pitchDecay: 0.18, octaves: 2, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.35, sustain: 0.01, release: 0.2 } }).connect(instrumentGain);
    const flute = new Tone.Sampler({ urls: SAMPLE_URLS.flute, release: 1.5 }).connect(instrumentGain);
    const fluteFallback = new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.15, decay: 0.2, sustain: 0.8, release: 0.8 } }).connect(instrumentGain);
    const synth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'fatsawtooth', count: 3, spread: 18 }, envelope: { attack: 0.02, decay: 0.25, sustain: 0.65, release: 0.8 } }).connect(synthFilter);
    synthFilter.connect(instrumentGain);
    toneEngineRef.current = { master, instrumentGain, instrumentEcho, guitar, guitarWah, guitarFallback, tabla, tablaFallback, flute, fluteFallback, synth, synthFilter };
    analyserRef.current = analyser;
    mediaDestinationRef.current = mediaDestination;
    setAudioReady(true);
    setSampleStatus('Sound engine ready; loading SoundFont samples...');
    Tone.loaded()
      .then(() => setSampleStatus('Authentic SoundFont sample banks loaded'))
      .catch(() => setSampleStatus('Some samples unavailable; physical-model fallback active'));
  }, [instrumentLevel, masterVolume]);

  useEffect(() => {
    const canvas = waveformRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return undefined;
    const context = canvas.getContext('2d');
    const data = new Uint8Array(analyser.fftSize);
    let previousFrameTime = performance.now();
    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      const now = performance.now();
      const elapsed = Math.min(50, now - previousFrameTime);
      previousFrameTime = now;
      notePulseRef.current = Math.max(0, notePulseRef.current - elapsed / 420);
      analyser.getByteTimeDomainData(data);
      context.clearRect(0, 0, width, height);
      context.lineWidth = 6;
      context.shadowBlur = 20;
      const pulse = notePulseRef.current;
      for (let wave = 0; wave < 2; wave += 1) {
        context.beginPath();
        context.strokeStyle = wave === 0 ? '#fbbf24' : '#fde68a';
        context.shadowColor = context.strokeStyle;
        const flow = (now * 0.18 + wave * 40) % width;
        for (let index = 0; index < data.length; index += 1) {
          const sourceIndex = (index + Math.floor(flow)) % data.length;
          const x = (index / (data.length - 1)) * width;
          const center = height * 0.5;
          const amplitude = (wave === 0 ? height * 0.42 : height * 0.28) * (1 + pulse * 0.9);
          const ripple = Math.sin((index / data.length) * Math.PI * 10 + now * 0.012) * pulse * height * 0.12;
          const y = center + ((data[sourceIndex] - 128) / 128) * amplitude + ripple;
          if (index === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.stroke();
      }
      context.shadowBlur = 12;
      context.fillStyle = '#fff7c2';
      for (let sparkle = 0; sparkle < 7; sparkle += 1) {
        const x = (now * (0.08 + sparkle * 0.012) + sparkle * width / 7) % width;
        const y = height * 0.5 + Math.sin(now * 0.004 + sparkle) * height * 0.22;
        const radius = 1.5 + ((Math.sin(now * 0.01 + sparkle) + 1) * 0.8);
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      }
      waveformAnimationRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(waveformAnimationRef.current);
  }, [cameraStarted, microphoneStarted]);

  const startMicrophone = useCallback(async () => {
    if (microphoneRef.current) return;
    try {
      await setupAudio();
      const microphone = new Tone.UserMedia();
      await microphone.open();
      microphone.connect(toneEngineRef.current.master);
      microphoneRef.current = microphone;
      setMicrophoneStarted(true);
      setCameraError('');
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : 'Microphone access was not available.');
    }
  }, [setupAudio]);

  const stopMicrophone = useCallback(() => {
    microphoneRef.current?.close();
    microphoneRef.current?.dispose();
    microphoneRef.current?.dispose();
    microphoneRef.current = null;
    setMicrophoneStarted(false);
  }, []);

  const toggleMicrophone = useCallback(() => {
    if (microphoneRef.current) stopMicrophone();
    else startMicrophone();
  }, [startMicrophone, stopMicrophone]);

  const previewInstrument = useCallback(async () => {
    try {
      await setupAudio();
      playInstrumentNote();
      setStatus(`${instrument.label} preview played`);
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : 'Instrument preview could not start.');
    }
  }, [instrument.label, playInstrumentNote, setupAudio]);

  const startCamera = useCallback(async () => {
    let stream;
    try {
      setCameraError('');
      await setupAudio();
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('This browser does not support camera access.');
      }
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 30 } },
        audio: false,
      });
      const video = videoRef.current;
      if (!video) throw new Error('Camera preview is not ready. Please retry.');
      video.srcObject = stream;
      await video.play();
      const Hands = await loadHandsConstructor();
      const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`,
      });
      hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.55, minTrackingConfidence: 0.55 });
      hands.onResults(handleResults);
      handsRef.current = hands;
      const runHandFrame = async () => {
        if (video.srcObject && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && !handFrameBusyRef.current) {
          handFrameBusyRef.current = true;
          const timeout = window.setTimeout(() => {
            handFrameBusyRef.current = false;
          }, 250);
          try {
            await hands.send({ image: video });
          } catch (error) {
            setCameraError(error instanceof Error ? error.message : 'Hand tracking paused unexpectedly.');
          } finally {
            window.clearTimeout(timeout);
            handFrameBusyRef.current = false;
          }
        }
        if (video.srcObject) cameraRef.current = requestAnimationFrame(runHandFrame);
      };
      cameraRef.current = requestAnimationFrame(runHandFrame);
      setCameraStarted(true);
      setStatus('Hands ready: right-hand pinch triggers notes');
    } catch (error) {
      stream?.getTracks().forEach((track) => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      setCameraError(error instanceof Error ? error.message : 'Camera access was not available.');
    }
  }, [handleResults, setupAudio]);

  const stopCamera = useCallback(() => {
    if (typeof cameraRef.current === 'number') cancelAnimationFrame(cameraRef.current);
    cameraRef.current = null;
    if (handFrameTimerRef.current) window.clearTimeout(handFrameTimerRef.current);
    handsRef.current?.close();
    handsRef.current = null;
    const stream = videoRef.current?.srcObject;
    if (stream) stream.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraStarted(false);
    setHandCount(0);
    handFrameBusyRef.current = false;
    rightPinchRef.current = false;
    rightFistRef.current = false;
    previousRightXRef.current = null;
    lastExpressionRef.current = null;
    latestLandmarksRef.current = [];
    latestHandednessRef.current = [];
    handSlotsRef.current = { left: null, right: null };
    const canvas = canvasRef.current;
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startRecording = useCallback(() => {
    if (recorderRef.current) return;
    const cameraStream = videoRef.current?.srcObject;
    const audioStream = mediaDestinationRef.current?.stream;
    if (!cameraStream || !audioStream) {
      setStatus('Start the camera before recording');
      return;
    }
    const canvas = canvasRef.current;
    const audioTrack = audioStream.getAudioTracks()[0];
    if (!canvas?.captureStream || !audioTrack || audioTrack.readyState !== 'live' || !audioTrack.enabled) {
      setStatus('Camera and audio are not ready. Start the instrument sound check, then try again.');
      return;
    }
    const canvasStream = canvas.captureStream(30);
    const canvasTrack = canvasStream.getVideoTracks()[0];
    if (!canvasTrack) {
      setStatus('The browser could not capture the Air Studio preview. Try another browser.');
      return;
    }
    const combinedStream = new MediaStream([
      canvasTrack,
      audioTrack.clone(),
    ]);
    const format = RECORDING_FORMATS.find((item) => item.id === recordingFormat) || availableFormats[0];
    const mimeType = format?.mimeTypes.find((type) => MediaRecorder.isTypeSupported(type));
    if (!mimeType) {
      setStatus('This browser cannot encode that format. Choose a supported format.');
      return;
    }
    chunksRef.current = [];
    const bitrates = { standard: 800000, high: 2500000, ultra: 5000000 };
    const recorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond: bitrates[recordingQuality],
      audioBitsPerSecond: recordingQuality === 'standard' ? 64000 : 96000,
    });
    const actualMimeType = recorder.mimeType || mimeType;
    setCameraError('');
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunksRef.current.push(event.data);
    };
    recorder.onerror = () => {
      recorderRef.current = null;
      setIsRecording(false);
      setStatus('Recording stopped because the browser could not encode the stream.');
      setCameraError('Recording could not be created. Try WebM format or lower quality.');
    };
    recorder.onstop = () => {
      recorderStopTimerRef.current = window.setTimeout(() => {
        recorderStopTimerRef.current = null;
        const blob = new Blob(chunksRef.current, { type: actualMimeType });
        recorderRef.current = null;
        setIsRecording(false);
        combinedStream.getTracks().forEach((track) => track.stop());
        if (!blob.size) {
          setStatus('No recording data was produced. Please try recording again.');
          setCameraError('The browser returned an empty recording.');
          return;
        }
        const url = URL.createObjectURL(blob);
        if (recordingUrlRef.current) URL.revokeObjectURL(recordingUrlRef.current);
        recordingUrlRef.current = url;
        setRecordingReview({
          url,
          blob,
          mimeType: actualMimeType,
          format: format.label,
          extension: format.extension,
          duration: 0,
          size: blob.size,
        });
        setStatus('Performance ready. Review it before saving.');
      }, 100);
    };
    try {
      recorder.start(250);
    } catch (error) {
      combinedStream.getTracks().forEach((track) => track.stop());
      setCameraError(error instanceof Error ? `${error.message} Choose WebM format.` : 'This format could not start. Choose WebM format.');
      setStatus('Recording could not start with this format.');
      return;
    }
    recorderRef.current = recorder;
    setIsRecording(true);
    setStatus('Recording your performance...');
  }, [availableFormats, recordingFormat, recordingQuality]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      recorderRef.current = null;
      setIsRecording(false);
      return;
    }
    try {
      recorder.stop();
    } catch (error) {
      recorderRef.current = null;
      setIsRecording(false);
      setCameraError(error instanceof Error ? error.message : 'Recording could not be stopped safely.');
    }
  }, []);

  const saveRecording = () => {
    if (!recordingReview) return;
    const link = document.createElement('a');
    link.href = recordingReview.url;
    link.download = `tunebox-air-studio-${Date.now()}.${recordingReview.extension}`;
    link.click();
    setStatus('Performance saved to your downloads.');
  };

  const closeRecordingReview = () => {
    if (recordingReview?.url) URL.revokeObjectURL(recordingReview.url);
    recordingReview && setRecordingReview(null);
  };



  const selectTrack = (track) => {
    setSelectedTrack(track);
    setPerformanceMode('catalog');
    selectPlayerTrack(track, recommendations);
    onSelectTrack?.(track);
    setCurrentTime(0);
    setStatus(`${track.title} selected. Press play in the player when ready.`);
  };

  useEffect(() => {
    const audio = playerAudioRef.current;
    if (!audio) return undefined;
    const updateTime = () => setCurrentTime(audio.currentTime);
    audio.addEventListener('timeupdate', updateTime);
    return () => audio.removeEventListener('timeupdate', updateTime);
  }, [playerAudioRef]);

  useEffect(() => () => {
    stopCamera();
    microphoneRef.current?.close();
    Object.values(toneEngineRef.current || {}).forEach((node) => {
      if (node && typeof node.dispose === 'function') node.dispose();
    });
    toneEngineRef.current = null;
    if (recordingUrlRef.current) URL.revokeObjectURL(recordingUrlRef.current);
  }, [stopCamera]);

  return (
    <main className="min-h-full overflow-y-auto bg-[#080d16] p-4 text-white md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-emerald-400">
              <Sparkles size={15} /> TuneBox Lab
            </div>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">Air Studio</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-400">Turn your hands into an instrument. Your camera stays in the browser.</p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setGuideOpen((open) => !open)} className="flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-200 transition hover:bg-cyan-300/20"><HelpCircle size={17} /> Guide</button>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className={`h-2 w-2 rounded-full ${cameraStarted ? 'animate-pulse bg-emerald-400' : 'bg-slate-600'}`} />
              {handCount}/2 hands tracked
            </div>
          </div>
        </header>

        {guideOpen && <section className="rounded-3xl border border-cyan-300/20 bg-gradient-to-r from-cyan-300/10 via-slate-900/80 to-emerald-400/10 p-5 shadow-xl shadow-cyan-950/10">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">Air Studio Guide</p><h2 className="mt-1 text-xl font-black">Perform, shape, review, then save</h2></div>
            <button type="button" onClick={() => setGuideOpen(false)} aria-label="Close guide" className="rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white"><X size={18} /></button>
          </div>
          <div className="mt-4 grid gap-3 text-xs leading-relaxed text-slate-300 md:grid-cols-4">
            <p><strong className="text-emerald-300">1. Prepare:</strong> choose an instrument and tune its tone, note length, and level below.</p>
            <p><strong className="text-cyan-300">2. Perform:</strong> left index finger controls tone; left thumb + index pinch mutes. Right thumb + index pinch triggers a note.</p>
            <p><strong className="text-violet-300">3. Gestures:</strong> open hand is ready, fist gives state feedback, and right-hand swipes change groove feedback. Move one hand at a time for clearer tracking.</p>
            <p><strong className="text-amber-300">4. Record:</strong> start camera and microphone, press Record, then review the preview before choosing Save & Download.</p>
          </div>
        </section>}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Live session</p>
                <p className="mt-1 flex items-center gap-2 truncate text-sm font-semibold"><Hand size={16} className="shrink-0 text-emerald-400" /> {status}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold uppercase tracking-wider">
                <div className={`rounded-xl border px-3 py-2 ${handStates.left === 'Fist' ? 'border-emerald-300 bg-emerald-400/20 text-emerald-200' : 'border-white/10 bg-slate-950/70 text-slate-400'}`}>Left · {handStates.left}</div>
                <div className={`rounded-xl border px-3 py-2 ${handStates.right === 'Fist' ? 'border-cyan-300 bg-cyan-400/20 text-cyan-200' : 'border-white/10 bg-slate-950/70 text-slate-400'}`}>Right · {handStates.right}</div>
              </div>
              {isRecording && <span className="flex items-center gap-2 rounded-full bg-rose-500/90 px-3 py-2 text-xs font-bold uppercase tracking-widest"><span className="h-2 w-2 animate-pulse rounded-full bg-white" /> REC</span>}
            </div>
            <div className="relative aspect-video max-h-[52vh] overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl shadow-emerald-950/20">
            <video ref={videoRef} muted playsInline className="absolute h-px w-px opacity-0" aria-hidden="true" />
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-contain" />
            <canvas ref={waveformRef} width="800" height="72" className="absolute bottom-3 left-3 right-3 h-14 w-[calc(100%-1.5rem)]" aria-label="Live frequency waveform" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/30" />
            </div>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <div className="overflow-hidden rounded-2xl border border-cyan-300/20 bg-slate-950/75 p-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-300">Karaoke HUD · {performanceMode === 'own' ? 'Your original performance' : activeTrack?.title || 'No track selected'}</p>
                <div className="min-h-8 space-y-1">
                  {lyrics.slice(Math.max(0, activeLyricIndex - 1), activeLyricIndex + 3).map((line, index) => (
                    <p key={`${line}-${index}`} className={`transition ${index === 1 || (activeLyricIndex === 0 && index === 0) ? 'text-lg font-bold text-cyan-100' : 'text-xs text-slate-500'}`}>{line}</p>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {!cameraStarted ? <button type="button" onClick={startCamera} className="flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950"><Camera size={16} /> Start camera</button> : <button type="button" onClick={stopCamera} className="rounded-full border border-slate-600 bg-slate-900/80 px-4 py-2 text-sm font-bold">Stop camera</button>}
                <button type="button" onClick={isRecording ? stopRecording : startRecording} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black ${isRecording ? 'bg-rose-500' : 'border border-rose-400/70 bg-rose-500/15 text-rose-300'}`}>{isRecording ? <CircleStop size={16} /> : <Radio size={16} />} {isRecording ? 'Stop' : 'Record'}</button>
                {performanceMode === 'own' && <button type="button" onClick={toggleMicrophone} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black ${microphoneStarted ? 'border border-amber-300/60 bg-amber-300/15 text-amber-200' : 'border border-cyan-300/50 bg-cyan-300/10 text-cyan-200'}`}><Mic2 size={16} /> {microphoneStarted ? 'Mic on · Turn off' : 'Turn mic on'}</button>}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="mb-3 flex items-center justify-between"><p className="flex items-center gap-2 font-bold text-slate-200"><Volume2 size={15} /> Recording settings</p><span className="text-xs text-slate-500">{availableFormats.length} format{availableFormats.length === 1 ? '' : 's'} supported</span></div>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-slate-400">Format<select value={recordingFormat} onChange={(event) => setRecordingFormat(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-white">{RECORDING_FORMATS.map((format) => <option key={format.id} value={format.id} disabled={!availableFormats.some((item) => item.id === format.id)}>{format.label}{availableFormats.some((item) => item.id === format.id) ? '' : ' (unavailable)'}</option>)}</select></label>
                <label className="text-xs text-slate-400">Quality<select value={recordingQuality} onChange={(event) => setRecordingQuality(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-white"><option value="standard">Standard (Low)</option><option value="high">High</option><option value="ultra">Ultra</option></select></label>
              </div>
            </div>
          </div>
          <aside className="space-y-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Performance mode</h2><Mic2 size={17} className="text-cyan-300" /></div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => { stopMicrophone(); setPerformanceMode('catalog'); setSelectedTrack(playerTrack); }} className={`rounded-xl border p-3 text-xs font-bold ${performanceMode === 'catalog' ? 'border-emerald-400 bg-emerald-400/10 text-emerald-300' : 'border-slate-700 text-slate-400'}`}>Play a track</button>
                <button type="button" onClick={() => { setPerformanceMode('own'); setSelectedTrack(null); }} className={`rounded-xl border p-3 text-xs font-bold ${performanceMode === 'own' ? 'border-cyan-300 bg-cyan-300/10 text-cyan-200' : 'border-slate-700 text-slate-400'}`}>Create my own</button>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">{instrument.emoji} Instrument tone</h2><span className="text-xs text-emerald-300">{Math.round(instrumentLevel * 100)}% level</span></div>
                <div className="space-y-3 text-xs text-slate-400">
                  <label className="block">Instrument volume · {Math.round(masterVolume * 100)}%<input type="range" min="0.05" max="1" step="0.01" value={masterVolume} onChange={(event) => { const value = Number(event.target.value); setMasterVolume(value); lastVolumeRef.current = value; updateToneParameter(toneEngineRef.current?.master?.gain, value); }} className="mt-1 w-full accent-cyan-400" /></label>
                  <label className="block">Tone / pitch<input type="range" min="0" max="1" step="0.01" value={tone} onChange={(event) => { const value = Number(event.target.value); setTone(value); const engine = toneEngineRef.current; if (engine) { engine.guitarWah.baseFrequency = 250 + value * 3000; updateToneParameter(engine.synthFilter.frequency, 500 + value * 6500); } }} className="mt-1 w-full accent-emerald-400" /></label>
                  <label className="block">Note length · {noteLength.toFixed(2)}s<input type="range" min="0.08" max="3" step="0.01" value={noteLength} onChange={(event) => setNoteLength(Number(event.target.value))} className="mt-1 w-full accent-cyan-400" /></label>
                  <label className="block">Instrument level (above backing track)<input type="range" min="0.8" max="2" step="0.01" value={instrumentLevel} onChange={(event) => { const value = Number(event.target.value); setInstrumentLevel(value); updateToneParameter(toneEngineRef.current?.instrumentGain?.gain, value); }} className="mt-1 w-full accent-violet-400" /></label>
                </div>
              </div>
              {performanceMode === 'own' && <div className="mt-3 space-y-3">
                <textarea value={ownLyrics} onChange={(event) => setOwnLyrics(event.target.value)} rows={3} placeholder="Write your lyrics, one line at a time..." className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white outline-none focus:border-cyan-300" />
                <button type="button" onClick={startMicrophone} disabled={microphoneStarted} className="w-full rounded-xl border border-cyan-300/40 bg-cyan-300/10 px-3 py-2 text-xs font-bold text-cyan-200 disabled:opacity-50">{microphoneStarted ? 'Microphone ready' : 'Enable microphone'}</button>
                <p className="text-xs leading-relaxed text-slate-500">Sing into your microphone while right-hand pinches create notes. Your lyrics appear in the karaoke HUD.</p>
              </div>}
            </div>
            {performanceMode === 'catalog' && <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-400">Select a track below to update the player. It will stay paused until you press play in the bottom player.</div>}
            {performanceMode === 'catalog' && <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Choose your instrument</h2><Mic2 size={17} className="text-emerald-400" /></div>
              <div className="grid grid-cols-2 gap-2">
                {INSTRUMENTS.map((item) => (
                  <button key={item.id} type="button" onClick={() => setInstrumentId(item.id)} className={`rounded-2xl border p-3 text-left transition ${instrumentId === item.id ? 'border-emerald-400 bg-emerald-400/10' : 'border-slate-700 bg-slate-950/50 hover:border-slate-500'}`}>
                    <span className="text-2xl">{item.emoji}</span><span className="mt-1 block text-xs font-semibold">{item.label}</span>
                  </button>
                ))}
              </div></div>}
            <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-emerald-400/10 to-cyan-400/5 p-4">
              <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Instrument sound check</h2><Volume2 size={17} className="text-emerald-300" /></div>
              <p className="mb-3 text-xs leading-relaxed text-slate-400">Use this button once to unlock browser audio. In your own performance, right-hand pinches will play the selected instrument.</p>
              <button type="button" onClick={previewInstrument} className="w-full rounded-xl bg-emerald-400 px-3 py-2 text-sm font-black text-slate-950 transition hover:bg-emerald-300">Play {instrument.label} test note</button>
              <p className="mt-2 text-[11px] text-slate-500">{audioReady ? sampleStatus : 'Tone.js starts after your click to satisfy browser audio permissions.'}</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Recommended tracks</h2><span className="text-xs text-emerald-400">{recommendations.length} matched</span></div>
              <div className="space-y-2">
                {recommendations.slice(0, 4).map((track) => (
                  <button key={track.id} type="button" onClick={() => selectTrack(track)} className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition ${activeTrack?.id === track.id ? 'bg-emerald-400/10 ring-1 ring-emerald-400/40' : 'hover:bg-slate-800'}`}>
                    <img src={track.cover} alt="" className="h-10 w-10 rounded-lg object-cover" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{track.title}</span><span className="block truncate text-xs text-slate-500">{track.artist}</span></span><Play size={14} className="text-emerald-400" />
                  </button>
                ))}
              </div>
            </div>
            {cameraStarted && <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-400"><p className="mb-2 flex items-center gap-2 font-bold text-slate-200"><Volume2 size={15} /> Gesture map</p><p>Left index: tone · left pinch: mute</p><p>Right pinch: trigger note · right fist: state feedback</p><p>Right hand height does not control volume; use Instrument volume below.</p></div>}
          </aside>
        </section>

        {recordingReview && <section className="scroll-mt-6 rounded-3xl border border-emerald-400/25 bg-slate-900/90 p-5 shadow-2xl shadow-emerald-950/20" aria-label="Performance review">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center"><div><p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">Performance review</p><h2 className="mt-1 text-xl font-black">Check your recording before saving</h2></div><button type="button" onClick={closeRecordingReview} className="flex items-center gap-2 self-start rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:border-rose-400 hover:text-rose-300"><X size={15} /> Discard</button></div>
          <video key={recordingReview.url} src={recordingReview.url} controls playsInline muted={false} preload="metadata" className="mt-4 max-h-[28rem] w-full rounded-2xl bg-black" onLoadedMetadata={(event) => { const duration = event.currentTarget.duration; const url = event.currentTarget.currentSrc; setRecordingReview((review) => review && review.url === url ? { ...review, duration: Number.isFinite(duration) ? duration : 0 } : review); }} onError={() => setCameraError(`The ${recordingReview.format} recording could not be decoded by this browser. Download it or choose WebM format.`)} />
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4"><div className="rounded-xl bg-slate-950 p-3"><p className="text-xs text-slate-500">Format</p><p className="font-bold">{recordingReview.format}</p></div><div className="rounded-xl bg-slate-950 p-3"><p className="text-xs text-slate-500">Duration</p><p className="font-bold">{recordingReview.duration > 0 ? `${recordingReview.duration.toFixed(1)} sec` : 'Loading...'}</p></div><div className="rounded-xl bg-slate-950 p-3"><p className="text-xs text-slate-500">Size</p><p className="font-bold">{formatBytes(recordingReview.size)}</p></div><div className="rounded-xl bg-slate-950 p-3"><p className="text-xs text-slate-500">Quality</p><p className="font-bold capitalize">{recordingQuality}</p></div></div>
          <button type="button" onClick={saveRecording} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 font-black text-slate-950 transition hover:bg-emerald-300"><Save size={17} /> Save & Download {recordingReview.format}</button>
        </section>}
        {cameraError && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{cameraError}</p>}
      </div>
    </main>
  );
}
