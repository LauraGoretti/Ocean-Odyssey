import React, { useState, useEffect, useRef } from 'react';
import Globe3D from './components/Globe3D';
import TravelHud from './components/TravelHud';
import CurrentDetailsCard from './components/CurrentDetailsCard';
import QuizModal from './components/QuizModal';
import SettingsModal, { GameSettings } from './components/SettingsModal';
import { GamePhase, OceanCurrent, Letter, DestinationResponse, WeatherEffect, QuizQuestion } from './types';
import { OCEAN_CURRENTS } from './data/oceanData';
import { generateDestinationResponse } from './services/geminiService';
import { Send, Map, Volume2, VolumeX, ArrowRight, Home, RefreshCw, Anchor, Settings, Lightbulb } from 'lucide-react';

// --- SUB-COMPONENTS ---

// Reusable component for the Selection Phase UI
const CurrentSelectionOverlay: React.FC<{
  selectedCurrent: OceanCurrent | null;
  onCancel: () => void;
  onLaunch: () => void;
}> = ({ selectedCurrent, onCancel, onLaunch }) => {
  return (
    <div className="flex-1 flex flex-col justify-end pb-4 px-4 pointer-events-none">
       <div className="pointer-events-auto self-center bg-white/95 backdrop-blur-xl rounded-3xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.3)] max-w-lg w-full border-b-[6px] border-blue-500 text-center animate-slide-up transition-all">
          {!selectedCurrent ? (
            <div className="text-center py-2">
              <h3 className="text-xl font-black text-blue-900 mb-1">Choose a Current!</h3>
              <p className="text-sm text-slate-600 font-medium leading-snug">Spin the globe & tap a stream to explore.</p>
              <div className="mt-3 flex justify-center gap-3">
                 <div className="flex items-center gap-1.5 bg-red-50 px-2 py-1 rounded-lg border border-red-100">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-[10px] uppercase font-bold text-red-600 tracking-wide">Warm</span>
                 </div>
                 <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wide">Cold</span>
                 </div>
              </div>
            </div>
          ) : (
            <CurrentDetailsCard 
               current={selectedCurrent}
               onCancel={onCancel}
               onLaunch={onLaunch}
            />
          )}
       </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>('INTRO');
  const [letter, setLetter] = useState<Letter>({ senderName: '', content: '' });
  const [selectedCurrent, setSelectedCurrent] = useState<OceanCurrent | null>(null);
  const [travelProgress, setTravelProgress] = useState(0);
  const [weatherEffect, setWeatherEffect] = useState<WeatherEffect>('NONE');
  const [weatherIntensity, setWeatherIntensity] = useState(0.5); // 0.0 to 1.0
  
  const [destinationData, setDestinationData] = useState<DestinationResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    masterVolume: 0.5,
    bgmVolume: 0.5,     // Background (Deep Ocean)
    streamVolume: 0.4,  // Current Flow
    weatherVolume: 0.6, // Rain/Fog
    animalVolume: 0.7,  // Animal Alerts
    reduceMotion: false,
    weatherEnabled: true
  });

  // --- AUDIO REFS ---
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mainGainRef = useRef<GainNode | null>(null);
  
  // Gain Nodes (Volume Control)
  const ambienceGainRef = useRef<GainNode | null>(null);
  const streamGainRef = useRef<GainNode | null>(null);
  const weatherGainRef = useRef<GainNode | null>(null);
  const animalGainRef = useRef<GainNode | null>(null);

  // Active Source Nodes (To allow stopping/swapping)
  const ambienceSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const streamSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const weatherSourceRef = useRef<AudioBufferSourceNode | null>(null); // Replaces Rain+Fog if custom, or handles Rain
  const fogSourceRef = useRef<AudioBufferSourceNode | null>(null);     // Synthetic Fog (extra layer)
  
  // Custom Audio Buffers (One-shot sounds)
  const animalBufferRef = useRef<AudioBuffer | null>(null);

  // Refs for callbacks to access current settings without stale closures
  const settingsRef = useRef(gameSettings);
  useEffect(() => { settingsRef.current = gameSettings; }, [gameSettings]);

  // Quiz State
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<QuizQuestion | null>(null);
  const [triggeredCheckpoints, setTriggeredCheckpoints] = useState<number[]>([]);
  const [shownQuizIds, setShownQuizIds] = useState<string[]>([]);

  // Handle Resize for Globe
  useEffect(() => {
    const handleResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Use a ref to access the latest handleArrival without re-triggering the effect
  const handleArrivalRef = useRef<() => void>(() => {});

  const handleArrival = async () => {
    if (selectedCurrent && letter.content) {
      setPhase('ARRIVAL'); 
      setIsGenerating(true);
      const response = await generateDestinationResponse(selectedCurrent, letter);
      setDestinationData(response);
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    handleArrivalRef.current = handleArrival;
  }, [selectedCurrent, letter]);

  // --- AUDIO HELPERS ---

  // Helper: Load Audio from URL
  const loadAudioBuffer = async (ctx: AudioContext, url: string): Promise<AudioBuffer | null> => {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      return await ctx.decodeAudioData(arrayBuffer);
    } catch (e) {
      console.error("Failed to load audio:", e);
      return null;
    }
  };

  // Helper: Create Synthetic Brown Noise (Background)
  const createSyntheticAmbience = (ctx: AudioContext): AudioBufferSourceNode => {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + (0.02 * white)) / 1.02;
        data[i] = lastOut * 3.5; 
        data[i] *= 3.5; 
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    return src;
  };

  // Helper: Create Synthetic White Noise (Stream/Rain)
  const createSyntheticNoise = (ctx: AudioContext): AudioBufferSourceNode => {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    return src;
  };

  // --- AUDIO SYSTEM INITIALIZATION ---
  const initAudioSystem = () => {
    if (audioCtxRef.current) return;
    
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    // Master Gain
    const mainGain = ctx.createGain();
    mainGain.gain.value = 0; 
    mainGain.connect(ctx.destination);
    mainGainRef.current = mainGain;

    // Create Channel Gains
    const mkGain = () => {
        const g = ctx.createGain();
        g.gain.value = 0;
        g.connect(mainGain);
        return g;
    };

    ambienceGainRef.current = mkGain();
    streamGainRef.current = mkGain();
    weatherGainRef.current = mkGain();
    animalGainRef.current = mkGain();
    
    // Initial Sources are started by the Effects below
  };

  // --- SOURCE MANAGEMENT EFFECTS ---

  // 1. Manage BACKGROUND Audio (Synthetic vs Custom)
  useEffect(() => {
    if (!audioCtxRef.current || !ambienceGainRef.current) return;
    const ctx = audioCtxRef.current;
    
    const setupBg = async () => {
        // Stop existing
        if (ambienceSourceRef.current) {
            try { ambienceSourceRef.current.stop(); } catch(e){}
            ambienceSourceRef.current.disconnect();
        }

        let src: AudioBufferSourceNode;

        if (gameSettings.customBackgroundAudio) {
            const buffer = await loadAudioBuffer(ctx, gameSettings.customBackgroundAudio);
            if (!buffer) return; // Fail gracefully
            src = ctx.createBufferSource();
            src.buffer = buffer;
        } else {
            // Synthetic Rumble
            src = createSyntheticAmbience(ctx);
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 400;
            src.connect(filter);
            filter.connect(ambienceGainRef.current!);
            src.loop = true;
            src.start();
            ambienceSourceRef.current = src;
            return; // Connected via filter
        }

        src.loop = true;
        src.connect(ambienceGainRef.current!);
        src.start();
        ambienceSourceRef.current = src;
    };

    setupBg();
  }, [gameSettings.customBackgroundAudio, audioCtxRef.current]);

  // 2. Manage STREAM Audio
  useEffect(() => {
    if (!audioCtxRef.current || !streamGainRef.current) return;
    const ctx = audioCtxRef.current;
    
    const setupStream = async () => {
        if (streamSourceRef.current) {
            try { streamSourceRef.current.stop(); } catch(e){}
            streamSourceRef.current.disconnect();
        }

        let src: AudioBufferSourceNode;

        if (gameSettings.customStreamAudio) {
            const buffer = await loadAudioBuffer(ctx, gameSettings.customStreamAudio);
            if (!buffer) return;
            src = ctx.createBufferSource();
            src.buffer = buffer;
        } else {
             // Synthetic Stream
             src = createSyntheticNoise(ctx);
             const filter = ctx.createBiquadFilter();
             filter.type = 'bandpass';
             filter.frequency.value = 500;
             filter.Q.value = 0.5;
             src.connect(filter);
             filter.connect(streamGainRef.current!);
             src.loop = true;
             src.start();
             streamSourceRef.current = src;
             return;
        }

        src.loop = true;
        src.connect(streamGainRef.current!);
        src.start();
        streamSourceRef.current = src;
    };

    setupStream();
  }, [gameSettings.customStreamAudio, audioCtxRef.current]);

  // 3. Manage WEATHER Audio (Replaces Rain/Fog if custom)
  useEffect(() => {
    if (!audioCtxRef.current || !weatherGainRef.current) return;
    const ctx = audioCtxRef.current;
    
    const setupWeather = async () => {
        // Stop existing weather nodes
        if (weatherSourceRef.current) { try { weatherSourceRef.current.stop(); } catch(e){} weatherSourceRef.current.disconnect(); }
        if (fogSourceRef.current) { try { fogSourceRef.current.stop(); } catch(e){} fogSourceRef.current.disconnect(); }

        if (gameSettings.customWeatherAudio) {
            // Custom Track: Replaces entire weather system
            const buffer = await loadAudioBuffer(ctx, gameSettings.customWeatherAudio);
            if (buffer) {
                const src = ctx.createBufferSource();
                src.buffer = buffer;
                src.loop = true;
                src.connect(weatherGainRef.current!);
                src.start();
                weatherSourceRef.current = src;
            }
        } else {
             // Synthetic System: Rain + Fog
             
             // Rain Node
             const rainSrc = createSyntheticNoise(ctx);
             const rainFilter = ctx.createBiquadFilter();
             rainFilter.type = 'highpass';
             rainFilter.frequency.value = 800;
             rainSrc.connect(rainFilter);
             rainFilter.connect(weatherGainRef.current!);
             rainSrc.start();
             weatherSourceRef.current = rainSrc;

             // Fog Node (Extra layer connected to same gain, or we could use separate gain for mixing)
             // For simplicity, we connect Fog to the same weather gain, so volume controls both.
             const fogSrc = createSyntheticNoise(ctx);
             const fogFilter = ctx.createBiquadFilter();
             fogFilter.type = 'bandpass';
             fogFilter.frequency.value = 300; 
             fogFilter.Q.value = 2.5; 
             fogSrc.connect(fogFilter);
             fogFilter.connect(weatherGainRef.current!); // Connects to same gain
             fogSrc.start();
             fogSourceRef.current = fogSrc;
        }
    };

    setupWeather();
  }, [gameSettings.customWeatherAudio, audioCtxRef.current]);

  // 4. Manage ANIMAL Audio (Load buffer only)
  useEffect(() => {
      if (!audioCtxRef.current) return;
      if (gameSettings.customAnimalAudio) {
          loadAudioBuffer(audioCtxRef.current, gameSettings.customAnimalAudio).then(buf => {
              animalBufferRef.current = buf;
          });
      } else {
          animalBufferRef.current = null;
      }
  }, [gameSettings.customAnimalAudio, audioCtxRef.current]);


  // --- PLAYBACK FUNCTIONS ---

  const playAnimalSound = () => {
      const ctx = audioCtxRef.current;
      const gainNode = animalGainRef.current;
      if (!ctx || !gainNode) return;

      if (animalBufferRef.current) {
          // Play Custom
          const src = ctx.createBufferSource();
          src.buffer = animalBufferRef.current;
          src.connect(gainNode);
          src.start();
      } else {
          // Play Synthetic (Chirp)
          const osc = ctx.createOscillator();
          const env = ctx.createGain();
          
          osc.type = 'sine';
          const freq = 400 + Math.random() * 400;
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + 0.1); 

          env.gain.setValueAtTime(0, ctx.currentTime);
          env.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 0.05);
          env.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

          osc.connect(env);
          env.connect(gainNode);

          osc.start();
          osc.stop(ctx.currentTime + 0.6);
      }
  };

  const playCheckPointSound = () => {
      const ctx = audioCtxRef.current;
      const gainNode = mainGainRef.current;
      if (!ctx || !gainNode) return;
      
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.2);
      env.gain.setValueAtTime(0, ctx.currentTime);
      env.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1);
      env.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.connect(env);
      env.connect(gainNode);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
  };

  // Manage Audio Volume based on Game Phase, Weather AND Settings
  useEffect(() => {
    const ctx = audioCtxRef.current;
    const mainGain = mainGainRef.current;
    
    if (ctx && mainGain) {
        const now = ctx.currentTime;
        const isTraveling = phase === 'TRAVEL_SIMULATION';
        
        // 1. MASTER VOLUME
        const targetMaster = isTraveling ? gameSettings.masterVolume : 0;
        mainGain.gain.setTargetAtTime(targetMaster, now, 0.5);

        // 2. BACKGROUND
        if (ambienceGainRef.current) {
          ambienceGainRef.current.gain.setTargetAtTime(gameSettings.bgmVolume, now, 0.5);
        }

        // 3. STREAM
        if (streamGainRef.current) {
           const streamVal = isTraveling ? gameSettings.streamVolume : 0;
           streamGainRef.current.gain.setTargetAtTime(streamVal, now, 0.8);
        }
        
        // 4. WEATHER
        if (weatherGainRef.current) {
            let targetWeather = 0;
            // If custom weather audio is set, it plays whenever weather is active (rain OR fog)
            // If synthetic, it handles mixing implicitly by connecting rain/fog nodes to this gain.
            // We just control the master weather gain here based on intensity.
            
            if (isTraveling && weatherEffect !== 'NONE') {
                targetWeather = Math.max(0, weatherIntensity * gameSettings.weatherVolume);
            }
            weatherGainRef.current.gain.setTargetAtTime(targetWeather, now, 1.5);
        }

        // 5. ANIMALS
        if (animalGainRef.current) {
            animalGainRef.current.gain.value = gameSettings.animalVolume;
        }
        
        if (targetMaster > 0 && ctx.state === 'suspended') {
            ctx.resume();
        }
    }
  }, [phase, weatherEffect, weatherIntensity, gameSettings]);


  // Travel Simulation Loop
  useEffect(() => {
    // Only run loop if we are in travel phase AND quiz is NOT active
    if (phase === 'TRAVEL_SIMULATION' && !isQuizActive) {
      
      const interval = setInterval(() => {
        // Calculate new progress based on previous
        setTravelProgress(prev => {
           const newProgress = prev + 0.08;

           // --- SOUND TRIGGERS FOR ANIMALS ---
           if ((prev < 20 && newProgress >= 20) || 
               (prev < 50 && newProgress >= 50) || 
               (prev < 80 && newProgress >= 80)) {
               playAnimalSound();
           }

           // QUIZ TRIGGER LOGIC
           const checkpoints = [35, 70];
           const hitCheckpoint = checkpoints.find(cp => 
               newProgress >= cp && prev < cp && !triggeredCheckpoints.includes(cp)
           );

           if (hitCheckpoint && selectedCurrent && selectedCurrent.quizzes.length > 0) {
               playCheckPointSound();
               const availableQuizzes = selectedCurrent.quizzes.filter(q => !shownQuizIds.includes(q.id));
               const pool = availableQuizzes.length > 0 ? availableQuizzes : selectedCurrent.quizzes;
               const quizIndex = Math.floor(Math.random() * pool.length);
               const quiz = pool[quizIndex];
               
               setActiveQuiz(quiz);
               setIsQuizActive(true);
               setTriggeredCheckpoints(prevCP => [...prevCP, hitCheckpoint]);
               setShownQuizIds(prevIds => [...prevIds, quiz.id]);
               return newProgress; 
           }

           if (newProgress >= 100) {
             clearInterval(interval);
             setWeatherEffect('NONE');
             handleArrivalRef.current();
             return 100;
           }
           
           return newProgress;
        });

        // Weather Logic
        if (gameSettings.weatherEnabled && Math.random() < 0.005) {
          const rand = Math.random();
          if (rand < 0.6) {
             setWeatherEffect('NONE');
          } else if (rand < 0.8) {
             setWeatherEffect('RAIN');
             setWeatherIntensity(0.5 + Math.random() * 0.5); 
          } else {
             setWeatherEffect('FOG');
             setWeatherIntensity(0.4 + Math.random() * 0.6); 
          }
        } else if (!gameSettings.weatherEnabled && weatherEffect !== 'NONE') {
            setWeatherEffect('NONE');
        }
        
        // Slowly drift intensity
        setWeatherIntensity(prev => {
            const drift = (Math.random() - 0.5) * 0.02;
            return Math.max(0.2, Math.min(1.0, prev + drift));
        });

      }, 20);

      return () => clearInterval(interval);
    }
  }, [phase, isQuizActive, selectedCurrent, triggeredCheckpoints, shownQuizIds, gameSettings.weatherEnabled, weatherEffect, gameSettings.animalVolume]);

  const returnToMap = () => {
    setTravelProgress(0);
    setSelectedCurrent(null);
    setDestinationData(null);
    setTriggeredCheckpoints([]); 
    setIsQuizActive(false);
    setActiveQuiz(null);
    setPhase('SELECT_CURRENT');
    setWeatherEffect('NONE');
  };

  const resetGame = () => {
    setLetter({ senderName: letter.senderName, content: '' }); 
    setSelectedCurrent(null);
    setTravelProgress(0);
    setDestinationData(null);
    setTriggeredCheckpoints([]); 
    setShownQuizIds([]); 
    setPhase('WRITE_LETTER');
    setWeatherEffect('NONE');
  };

  return (
    <div className="w-full h-screen relative bg-slate-950 overflow-hidden font-sans select-none text-slate-800">
      
      {/* --- BACKGROUND GLOBE --- */}
      <div className="absolute inset-0 z-0">
        <Globe3D 
          interactive={phase === 'SELECT_CURRENT'} 
          selectedCurrentId={selectedCurrent?.id}
          onCurrentSelect={(current) => {
             setSelectedCurrent(current);
          }}
          travelProgress={phase === 'TRAVEL_SIMULATION' ? travelProgress : 0}
          width={windowSize.w}
          height={windowSize.h}
          reduceMotion={gameSettings.reduceMotion}
        />
      </div>

      {/* --- UI LAYER --- */}
      <div className="relative z-10 w-full h-full pointer-events-none">
        <div className="w-full h-full flex flex-col">
          
          {/* Top Bar */}
          <div className="p-4 flex justify-between items-start pointer-events-auto">
            <h1 className="text-3xl font-black text-cyan-300 drop-shadow-lg tracking-wider" style={{ WebkitTextStroke: '1px #083344' }}>
              OCEAN ODYSSEY
            </h1>
            <div className="flex gap-2">
               {phase === 'TRAVEL_SIMULATION' && (
                  <button 
                    onClick={returnToMap}
                    className="bg-white/20 hover:bg-white/40 backdrop-blur-md p-3 rounded-full text-white transition flex items-center justify-center hover:scale-110 active:scale-95"
                    title="Return to Map"
                  >
                    <Map size={24} />
                  </button>
               )}

               <button 
                  onClick={() => setShowSettings(true)}
                  className="bg-white/20 hover:bg-white/40 backdrop-blur-md p-3 rounded-full text-white transition flex items-center justify-center hover:rotate-90 duration-500"
                  title="Settings"
                >
                  <Settings />
                </button>
            </div>
          </div>

          {/* --- SCREENS --- */}

          {/* 1. INTRO SCREEN */}
          {phase === 'INTRO' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-black/40 backdrop-blur-sm animate-fade-in pointer-events-auto">
              <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-lg w-full border-4 border-cyan-500">
                <div className="text-6xl mb-4">🌊 🫧 🌍</div>
                <h2 className="text-3xl font-bold text-cyan-700 mb-4">Send a Magic Bubble!</h2>
                <p className="text-lg text-slate-600 mb-6">
                  Join the adventure! Send a secret message through the ocean currents to friends across the world.
                </p>
                <input 
                  type="text" 
                  placeholder="What is your name?" 
                  className="w-full p-4 text-xl border-2 border-cyan-200 rounded-xl mb-4 focus:outline-none focus:border-cyan-500 text-center font-bold text-cyan-800 placeholder-cyan-300"
                  value={letter.senderName}
                  onChange={(e) => setLetter({...letter, senderName: e.target.value})}
                />
                <button 
                  disabled={!letter.senderName}
                  onClick={() => {
                      setPhase('WRITE_LETTER');
                      initAudioSystem();
                  }}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-white text-xl font-bold py-4 rounded-xl shadow-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                >
                  Start Adventure <ArrowRight />
                </button>
              </div>
            </div>
          )}

          {/* 2. WRITE LETTER */}
          {phase === 'WRITE_LETTER' && (
            <div className="flex-1 flex flex-col items-center justify-center p-4 bg-black/40 backdrop-blur-sm pointer-events-auto">
               <div className="bg-amber-50 p-8 rounded-xl shadow-2xl max-w-xl w-full border-4 border-amber-200 relative transform rotate-1">
                 <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-400 w-16 h-4 opacity-50 blur-sm rounded-full"></div>
                 <h3 className="text-2xl font-bold text-amber-800 mb-4">Dear Ocean Friend...</h3>
                 <p className="text-amber-700 mb-2 font-medium">Ask a question about the ocean!</p>
                 <textarea
                   className="w-full h-40 bg-transparent border-b-2 border-amber-200 p-2 text-xl font-handwriting text-slate-700 resize-none focus:outline-none focus:border-amber-400 leading-relaxed"
                   placeholder="e.g. Do sharks sleep? How deep is the water there?"
                   value={letter.content}
                   onChange={(e) => setLetter({...letter, content: e.target.value})}
                   style={{ fontFamily: '"Comic Sans MS", cursive, sans-serif' }}
                 />
                 <div className="flex justify-end mt-4">
                   <button 
                     onClick={() => setPhase('SELECT_CURRENT')}
                     disabled={letter.content.length < 5}
                     className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                   >
                     Pack into Bubble <Send size={18} />
                   </button>
                 </div>
               </div>
            </div>
          )}

          {/* 3. SELECT CURRENT */}
          {phase === 'SELECT_CURRENT' && (
             <CurrentSelectionOverlay 
                selectedCurrent={selectedCurrent}
                onCancel={() => setSelectedCurrent(null)}
                onLaunch={() => setPhase('TRAVEL_SIMULATION')}
             />
          )}

          {/* 4. TRAVEL SIMULATION */}
          {phase === 'TRAVEL_SIMULATION' && selectedCurrent && (
            <TravelHud 
              current={selectedCurrent} 
              progress={travelProgress} 
              weather={weatherEffect}
              intensity={weatherIntensity}
              reduceMotion={gameSettings.reduceMotion}
              weatherEnabled={gameSettings.weatherEnabled}
            />
          )}

          {/* 4b. QUIZ MODAL */}
          {isQuizActive && activeQuiz && (
            <div className="pointer-events-auto">
               <QuizModal 
                 quiz={activeQuiz}
                 onComplete={() => setIsQuizActive(false)}
               />
            </div>
          )}

          {/* 5. ARRIVAL & RESULT */}
          {phase === 'ARRIVAL' && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg pointer-events-auto overflow-hidden">
               {/* Animation Styles */}
               <style>{`
                 @keyframes popIn {
                   0% { transform: scale(0.5); opacity: 0; }
                   70% { transform: scale(1.05); opacity: 1; }
                   100% { transform: scale(1); }
                 }
                 @keyframes gentlePulse {
                   0%, 100% { transform: scale(1); opacity: 0.4; }
                   50% { transform: scale(1.3); opacity: 0.8; }
                 }
                 @keyframes swimInRight {
                   0% { transform: translateX(-100px) rotate(-20deg); opacity: 0; }
                   100% { transform: translateX(0) rotate(0deg); opacity: 1; }
                 }
                 @keyframes swimInLeft {
                   0% { transform: translateX(100px) rotate(20deg); opacity: 0; }
                   100% { transform: translateX(0) rotate(0deg); opacity: 1; }
                 }
                 @keyframes floatY {
                   0%, 100% { transform: translateY(0); }
                   50% { transform: translateY(-10px); }
                 }
               `}</style>
               
               {/* Enhanced Background Celebration */}
               {!gameSettings.reduceMotion && !isGenerating && destinationData && (
                 <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(25)].map((_, i) => {
                      const emojis = ['🎉', '🫧', '✨', '🐚', '🎊'];
                      const emoji = emojis[i % emojis.length];
                      return (
                        <div 
                          key={i} 
                          className="absolute text-3xl select-none" 
                          style={{
                            left: `${Math.random()*100}%`, 
                            top: `${Math.random()*100}%`,
                            animation: `gentlePulse ${2 + Math.random() * 2}s infinite ease-in-out`,
                            animationDelay: `${Math.random() * 2}s`
                          }}
                        >
                          {emoji}
                        </div>
                      );
                    })}
                 </div>
               )}

               {isGenerating ? (
                 <div className="text-white text-center z-10 relative">
                    <div className="text-8xl animate-bounce mb-6">📬</div>
                    <h2 className="text-4xl font-black text-cyan-300 mb-2">Bubble Arrived!</h2>
                    <p className="animate-pulse text-xl text-cyan-100">Knocking on doors in {selectedCurrent?.endLocation}...</p>
                 </div>
               ) : destinationData && (
                 <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.6)] max-w-2xl w-full flex flex-col max-h-[90vh] border-4 border-cyan-300 relative z-10 transform overflow-hidden" style={{ animation: gameSettings.reduceMotion ? 'none' : 'popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                    
                    <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 p-8 text-white text-center relative overflow-hidden shrink-0">
                       
                       {/* Background Pattern */}
                       <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />

                       {/* Marine Life Swim-In Animation */}
                       {!gameSettings.reduceMotion && selectedCurrent?.biodiversity && (
                          <>
                            {selectedCurrent.biodiversity.slice(0, 4).map((animal, idx) => {
                               const isLeft = idx % 2 === 0;
                               return (
                                 <div 
                                    key={`swim-${idx}`}
                                    className="absolute text-5xl filter drop-shadow-lg z-0 opacity-0" 
                                    style={{
                                       top: `${15 + idx * 20}%`,
                                       left: isLeft ? '5%' : 'auto',
                                       right: isLeft ? 'auto' : '5%',
                                       animation: `${isLeft ? 'swimInRight' : 'swimInLeft'} 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, floatY 3s ease-in-out infinite ${0.8 + idx * 0.2}s`,
                                       animationDelay: `${0.2 + idx * 0.15}s` // Staggered entrance
                                    }}
                                    title={animal.name}
                                 >
                                    {animal.emoji}
                                 </div>
                               );
                            })}
                          </>
                       )}

                       <h2 className="text-4xl md:text-5xl font-black relative z-10 drop-shadow-lg mb-2">Message Received!</h2>
                       <div className="inline-block bg-white/20 px-5 py-2 rounded-full backdrop-blur-md border border-white/30 relative z-10">
                         <p className="font-bold flex items-center gap-2">
                            <Map size={18} className="text-yellow-300" /> 
                            <span>{destinationData.location}</span>
                         </p>
                       </div>
                    </div>
                    
                    <div className="p-6 md:p-8 overflow-y-auto bg-slate-50 custom-scrollbar flex-1">
                       <div className="bg-amber-50 border-l-8 border-amber-400 p-5 mb-6 rounded-r-xl shadow-sm">
                          <p className="text-slate-700 italic text-lg">"{letter.content}"</p>
                       </div>
                       <div className="prose prose-lg text-slate-700 mb-8">
                          {destinationData.replyText.split('\n').map((line, i) => (
                             <p key={i} className="mb-3 leading-relaxed">{line}</p>
                          ))}
                       </div>
                       <div className="bg-blue-100 rounded-2xl p-5 mb-8 border border-blue-200 shadow-inner">
                          <h4 className="font-black text-blue-800 text-sm uppercase mb-1 flex items-center gap-2">
                             <Lightbulb size={16} /> Did you know?
                          </h4>
                          <p className="text-blue-900 font-medium">{destinationData.funFact}</p>
                       </div>
                    </div>

                    {/* Fixed Footer for Buttons */}
                    <div className="p-5 bg-slate-50 border-t border-slate-200 shrink-0 flex flex-col md:flex-row gap-3">
                           <button 
                             onClick={returnToMap}
                             className="flex-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-lg py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                           >
                             <Map size={20} /> Map
                           </button>

                           <button 
                             onClick={resetGame}
                             className="flex-[2] bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xl py-3 rounded-xl shadow-lg transition-all hover:shadow-cyan-500/50 flex items-center justify-center gap-3 transform hover:scale-[1.02] active:scale-95"
                           >
                             <RefreshCw size={24} /> New Letter
                           </button>
                    </div>
                 </div>
               )}
            </div>
          )}

          {/* 6. SETTINGS OVERLAY */}
          {showSettings && (
             <SettingsModal 
                settings={gameSettings}
                onUpdate={setGameSettings}
                onClose={() => setShowSettings(false)}
             />
          )}

        </div>
      </div>
    </div>
  );
};

export default App;