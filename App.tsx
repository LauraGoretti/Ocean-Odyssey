import React, { useState, useEffect, useRef } from 'react';
import Globe3D from './components/Globe3D';
import TravelHud from './components/TravelHud';
import CurrentDetailsCard from './components/CurrentDetailsCard';
import QuizModal from './components/QuizModal';
import SettingsModal, { GameSettings } from './components/SettingsModal';
import { GamePhase, OceanCurrent, Letter, DestinationResponse, WeatherEffect, QuizQuestion } from './types';
import { OCEAN_CURRENTS } from './data/oceanData';
import { generateDestinationResponse } from './services/geminiService';
import { Send, Map, Volume2, VolumeX, ArrowRight, Home, RefreshCw, Anchor, Settings } from 'lucide-react';

// --- SUB-COMPONENTS ---

// Reusable component for the Selection Phase UI
const CurrentSelectionOverlay: React.FC<{
  selectedCurrent: OceanCurrent | null;
  onCancel: () => void;
  onLaunch: () => void;
}> = ({ selectedCurrent, onCancel, onLaunch }) => {
  return (
    <div className="flex-1 flex flex-col justify-end pb-12 px-4 pointer-events-none">
       <div className="pointer-events-auto self-center bg-white/90 backdrop-blur rounded-2xl p-6 shadow-2xl max-w-2xl w-full border-b-8 border-blue-500 text-center animate-slide-up">
          {!selectedCurrent ? (
            <div className="text-center">
              <h3 className="text-2xl font-bold text-blue-900 mb-2">Choose a Current!</h3>
              <p className="text-slate-600">Spin the globe and click on a colorful stream to choose your path.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                 <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">Warm Currents</span>
                 <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-bold">Cold Currents</span>
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
    ambienceVolume: 0.5,
    sfxVolume: 0.6,
    reduceMotion: false,
    weatherEnabled: true
  });

  // Audio Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mainGainRef = useRef<GainNode | null>(null);
  const ambienceGainRef = useRef<GainNode | null>(null);
  const rainGainRef = useRef<GainNode | null>(null);
  const fogGainRef = useRef<GainNode | null>(null);

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
      // Transition immediately to show loading screen
      setPhase('ARRIVAL'); 
      setIsGenerating(true);
      
      // Perform AI generation
      const response = await generateDestinationResponse(selectedCurrent, letter);
      
      setDestinationData(response);
      setIsGenerating(false);
    }
  };

  // Keep ref updated
  useEffect(() => {
    handleArrivalRef.current = handleArrival;
  }, [selectedCurrent, letter]);

  // --- AUDIO SYSTEM ---
  const initAudioSystem = () => {
    if (audioCtxRef.current) return;
    
    // Cross-browser support
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    // Master Gain (controls overall volume)
    const mainGain = ctx.createGain();
    mainGain.gain.value = 0; // Start silent, will be ramped up by useEffect
    mainGain.connect(ctx.destination);
    mainGainRef.current = mainGain;

    // Ambience Gain (Dedicated channel for rumble)
    const ambienceGain = ctx.createGain();
    ambienceGain.gain.value = gameSettings.ambienceVolume;
    ambienceGain.connect(mainGain);
    ambienceGainRef.current = ambienceGain;

    // --- SHARED NOISE BUFFERS ---
    const bufferSize = 2 * ctx.sampleRate;
    
    // 1. Brown Noise Buffer (Rumble)
    const brownBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const brownData = brownBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + (0.02 * white)) / 1.02;
        brownData[i] = lastOut * 3.5; 
        brownData[i] *= 3.5; 
    }

    // 2. White Noise Buffer (Rain/Fog base)
    const whiteBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const whiteData = whiteBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        whiteData[i] = Math.random() * 2 - 1;
    }
    
    // --- SOUND SOURCE 1: AMBIENT RUMBLE ---
    const rumbleSrc = ctx.createBufferSource();
    rumbleSrc.buffer = brownBuffer;
    rumbleSrc.loop = true;
    const rumbleFilter = ctx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.value = 400; // Deep rumble
    rumbleSrc.connect(rumbleFilter);
    rumbleFilter.connect(ambienceGain); // Connect to ambience gain, not main directly
    rumbleSrc.start();

    // --- SOUND SOURCE 2: RAIN (High frequency splashing) ---
    const rainSrc = ctx.createBufferSource();
    rainSrc.buffer = whiteBuffer;
    rainSrc.loop = true;
    
    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = 'highpass';
    rainFilter.frequency.value = 800; 
    
    const rainSmooth = ctx.createBiquadFilter();
    rainSmooth.type = 'lowpass';
    rainSmooth.frequency.value = 8000;

    const rainGain = ctx.createGain();
    rainGain.gain.value = 0; 

    rainSrc.connect(rainFilter);
    rainFilter.connect(rainSmooth);
    rainSmooth.connect(rainGain);
    rainGain.connect(mainGain); // Rain/Fog go to Main, but controlled by own gain
    rainSrc.start();
    rainGainRef.current = rainGain;

    // --- SOUND SOURCE 3: FOG (Eerie Wind/Drone) ---
    const fogSrc = ctx.createBufferSource();
    fogSrc.buffer = whiteBuffer;
    fogSrc.loop = true;

    const fogFilter = ctx.createBiquadFilter();
    fogFilter.type = 'bandpass';
    fogFilter.frequency.value = 300; 
    fogFilter.Q.value = 1.5;

    const fogGain = ctx.createGain();
    fogGain.gain.value = 0; 

    fogSrc.connect(fogFilter);
    fogFilter.connect(fogGain);
    fogGain.connect(mainGain);
    fogSrc.start();
    fogGainRef.current = fogGain;
  };

  // Manage Audio Volume based on Game Phase, Weather AND Settings
  useEffect(() => {
    const ctx = audioCtxRef.current;
    const mainGain = mainGainRef.current;
    const ambienceGain = ambienceGainRef.current;
    const rainGain = rainGainRef.current;
    const fogGain = fogGainRef.current;
    
    if (ctx && mainGain) {
        const now = ctx.currentTime;
        const isTraveling = phase === 'TRAVEL_SIMULATION';
        
        // 1. MASTER VOLUME
        // If traveling, use setting value. If not traveling, silence.
        // NOTE: We might want background sound in menu later, but for now stick to travel loop.
        const targetMaster = isTraveling ? gameSettings.masterVolume : 0;
        mainGain.gain.setTargetAtTime(targetMaster, now, 0.5);

        // 2. AMBIENCE (Rumble) - Always active if master is up
        if (ambienceGain) {
          ambienceGain.gain.setTargetAtTime(gameSettings.ambienceVolume, now, 0.5);
        }
        
        // 3. SFX (Rain/Fog)
        if (rainGain && fogGain) {
            // Rain Volume Logic
            const targetRain = (isTraveling && weatherEffect === 'RAIN') 
                ? Math.max(0, weatherIntensity * gameSettings.sfxVolume) 
                : 0;
            rainGain.gain.setTargetAtTime(targetRain, now, 1.0); 

            // Fog Volume Logic
            const targetFog = (isTraveling && weatherEffect === 'FOG') 
                ? Math.max(0, weatherIntensity * gameSettings.sfxVolume * 1.5) // Fog needs boost
                : 0;
            fogGain.gain.setTargetAtTime(targetFog, now, 2.5); 
        }
        
        // Resume context if needed
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

           // QUIZ TRIGGER LOGIC
           const checkpoints = [35, 70];
           
           const hitCheckpoint = checkpoints.find(cp => 
               newProgress >= cp && prev < cp && !triggeredCheckpoints.includes(cp)
           );

           if (hitCheckpoint && selectedCurrent && selectedCurrent.quizzes.length > 0) {
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

        // Weather Logic - Only if enabled in settings
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
  }, [phase, isQuizActive, selectedCurrent, triggeredCheckpoints, shownQuizIds, gameSettings.weatherEnabled, weatherEffect]);

  const returnToMap = () => {
    // Reset simulation state but keep letter
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
               {/* Back to Map Button - Visible during Travel */}
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
               {/* ... (Animation styles kept same) ... */}
               <style>{`
                 @keyframes swimAcross {
                   0% { transform: translateX(-20vw) translateY(0) rotate(5deg); opacity: 0; }
                   10% { opacity: 0.2; }
                   90% { opacity: 0.2; }
                   100% { transform: translateX(120vw) translateY(20px) rotate(-5deg); opacity: 0; }
                 }
                 @keyframes popIn {
                   0% { transform: scale(0.5); opacity: 0; }
                   70% { transform: scale(1.05); opacity: 1; }
                   100% { transform: scale(1); }
                 }
               `}</style>
               
               {/* Only show background effects if not reduced motion */}
               {!gameSettings.reduceMotion && !isGenerating && destinationData && (
                 <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {/* Simplified confetti loop */}
                    {[...Array(20)].map((_, i) => (
                      <div key={i} className="absolute text-3xl animate-pulse" style={{left: `${Math.random()*100}%`, top: `${Math.random()*100}%`}}>🎉</div>
                    ))}
                 </div>
               )}

               {isGenerating ? (
                 <div className="text-white text-center z-10 relative">
                    <div className="text-8xl animate-bounce mb-6">📬</div>
                    <h2 className="text-4xl font-black text-cyan-300 mb-2">Bubble Arrived!</h2>
                    <p className="animate-pulse text-xl text-cyan-100">Knocking on doors in {selectedCurrent?.endLocation}...</p>
                 </div>
               ) : destinationData && (
                 <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.6)] max-w-2xl w-full flex flex-col max-h-[90vh] border-4 border-cyan-300 relative z-10 transform" style={{ animation: gameSettings.reduceMotion ? 'none' : 'popIn 0.6s' }}>
                    
                    <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 p-8 text-white text-center relative overflow-hidden shrink-0">
                       <h2 className="text-4xl md:text-5xl font-black relative z-10 drop-shadow-lg mb-2">Message Received!</h2>
                       <div className="inline-block bg-white/20 px-5 py-2 rounded-full backdrop-blur-md border border-white/30">
                         <p className="font-bold relative z-10 flex items-center gap-2">
                            <Map size={18} className="text-yellow-300" /> 
                            <span>{destinationData.location}</span>
                         </p>
                       </div>
                    </div>
                    
                    <div className="p-6 md:p-8 overflow-y-auto bg-slate-50">
                       <div className="bg-amber-50 border-l-8 border-amber-400 p-5 mb-6 rounded-r-xl">
                          <p className="text-slate-700 italic text-lg">"{letter.content}"</p>
                       </div>
                       <div className="prose prose-lg text-slate-700 mb-8">
                          {destinationData.replyText.split('\n').map((line, i) => (
                             <p key={i} className="mb-3">{line}</p>
                          ))}
                       </div>
                       <div className="bg-blue-100 rounded-2xl p-5 mb-8 border border-blue-200">
                          <h4 className="font-black text-blue-800 text-sm uppercase mb-1">Did you know?</h4>
                          <p className="text-blue-900">{destinationData.funFact}</p>
                       </div>
                       
                       <div className="flex flex-col md:flex-row gap-3">
                           <button 
                             onClick={returnToMap}
                             className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-lg py-4 rounded-xl shadow transition-all flex items-center justify-center gap-2"
                           >
                             <Map size={20} /> Map
                           </button>

                           <button 
                             onClick={resetGame}
                             className="flex-[2] bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xl py-4 rounded-xl shadow-lg transition-all hover:shadow-cyan-500/50 flex items-center justify-center gap-3"
                           >
                             <RefreshCw size={24} /> New Letter
                           </button>
                       </div>
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