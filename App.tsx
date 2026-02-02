import React, { useState, useEffect, useRef } from 'react';
import Globe3D from './components/Globe3D';
import TravelHud from './components/TravelHud';
import CurrentDetailsCard from './components/CurrentDetailsCard';
import { GamePhase, OceanCurrent, Letter, DestinationResponse, WeatherEffect } from './types';
import { OCEAN_CURRENTS } from './data/oceanData';
import { generateDestinationResponse } from './services/geminiService';
import { Send, Map, Volume2, ArrowRight, Home, RefreshCw, Anchor } from 'lucide-react';

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>('INTRO');
  const [letter, setLetter] = useState<Letter>({ senderName: '', content: '' });
  const [selectedCurrent, setSelectedCurrent] = useState<OceanCurrent | null>(null);
  const [travelProgress, setTravelProgress] = useState(0);
  const [weatherEffect, setWeatherEffect] = useState<WeatherEffect>('NONE');
  const [destinationData, setDestinationData] = useState<DestinationResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight });

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

  // Travel Simulation Loop
  useEffect(() => {
    if (phase === 'TRAVEL_SIMULATION') {
      let progress = 0;
      setWeatherEffect('NONE'); // Reset weather at start

      const interval = setInterval(() => {
        progress += 0.2; // Slower for better visual
        setTravelProgress(progress);
        
        // Random weather logic
        if (Math.random() < 0.005) {
          const rand = Math.random();
          if (rand < 0.6) setWeatherEffect('NONE');
          else if (rand < 0.8) setWeatherEffect('RAIN');
          else setWeatherEffect('FOG');
        }

        if (progress >= 100) {
          clearInterval(interval);
          setWeatherEffect('NONE'); // Clear weather on arrival
          // Call the function via ref to ensure we use the latest version/closure context
          handleArrivalRef.current();
        }
      }, 50); // Update every 50ms

      return () => clearInterval(interval);
    }
  }, [phase]);

  const resetGame = () => {
    setLetter({ senderName: letter.senderName, content: '' }); // Keep name
    setSelectedCurrent(null);
    setTravelProgress(0);
    setDestinationData(null);
    setPhase('SELECT_CURRENT'); // Go straight to map after first play? Or write? Let's go to write.
    setPhase('WRITE_LETTER');
  };

  return (
    <div className="w-full h-screen relative bg-slate-950 overflow-hidden font-sans select-none text-slate-800">
      
      {/* --- BACKGROUND GLOBE (Always rendered for smoothness) --- */}
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
        />
      </div>

      {/* --- UI LAYER --- */}
      <div className="relative z-10 w-full h-full pointer-events-none">
        {/* Removed pointer-events-auto from here to allow clicks to pass through to globe in empty areas */}
        <div className="w-full h-full flex flex-col">
          
          {/* Top Bar - Needs pointer events */}
          <div className="p-4 flex justify-between items-start pointer-events-auto">
            <h1 className="text-3xl font-black text-cyan-300 drop-shadow-lg tracking-wider" style={{ WebkitTextStroke: '1px #083344' }}>
              OCEAN ODYSSEY
            </h1>
            <button 
              onClick={() => alert("Sound settings would appear here!")}
              className="bg-white/20 hover:bg-white/40 backdrop-blur-md p-3 rounded-full text-white transition"
            >
              <Volume2 />
            </button>
          </div>

          {/* --- SCREENS --- */}

          {/* 1. INTRO SCREEN - Full overlay needs pointer events */}
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
                  onClick={() => setPhase('WRITE_LETTER')}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-white text-xl font-bold py-4 rounded-xl shadow-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                >
                  Start Adventure <ArrowRight />
                </button>
              </div>
            </div>
          )}

          {/* 2. WRITE LETTER - Full overlay needs pointer events */}
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

          {/* 3. SELECT CURRENT - Container is transparent/none, allowing clicks to globe. Inner Card is auto. */}
          {phase === 'SELECT_CURRENT' && (
             <div className="flex-1 flex flex-col justify-end pb-12 px-4 pointer-events-none">
                <div className="pointer-events-auto self-center bg-white/90 backdrop-blur rounded-2xl p-6 shadow-2xl max-w-2xl w-full border-b-8 border-blue-500 text-center animate-slide-up">
                   {!selectedCurrent ? (
                     <div>
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
                        onCancel={() => setSelectedCurrent(null)}
                        onLaunch={() => setPhase('TRAVEL_SIMULATION')}
                     />
                   )}
                </div>
             </div>
          )}

          {/* 4. TRAVEL SIMULATION */}
          {phase === 'TRAVEL_SIMULATION' && selectedCurrent && (
            <TravelHud 
              current={selectedCurrent} 
              progress={travelProgress} 
              weather={weatherEffect}
            />
          )}

          {/* 5. ARRIVAL & RESULT - Enhanced Celebration Screen */}
          {phase === 'ARRIVAL' && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg pointer-events-auto overflow-hidden">
               
               {/* --- ANIMATIONS STYLE --- */}
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
                 @keyframes float-particle {
                   0%, 100% { transform: translateY(0) rotate(0); }
                   50% { transform: translateY(-20px) rotate(10deg); }
                 }
               `}</style>

               {/* --- CELEBRATION BACKGROUND EFFECTS --- */}
               {!isGenerating && destinationData && (
                 <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {/* Confetti / Bubbles */}
                    {[...Array(30)].map((_, i) => (
                      <div 
                        key={`confetti-${i}`}
                        className="absolute text-2xl md:text-4xl animate-pulse"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                          animation: `float-particle ${Math.random() * 3 + 2}s ease-in-out infinite`,
                          animationDelay: `${Math.random() * 2}s`,
                          opacity: Math.random() * 0.3 + 0.1
                        }}
                      >
                        {['🎉', '✨', '🫧', '🌟', '🎈'][Math.floor(Math.random() * 5)]}
                      </div>
                    ))}
                    
                    {/* Giant Swimming Animals from the selected current */}
                    {selectedCurrent?.biodiversity.map((animal, i) => (
                       <div 
                         key={`swim-${i}`}
                         className="absolute text-8xl md:text-9xl pointer-events-none whitespace-nowrap blur-[1px]"
                         style={{
                           top: `${15 + i * 25}%`,
                           left: '-20%',
                           animation: `swimAcross ${20 + i * 5}s linear infinite`,
                           animationDelay: `0s`,
                           opacity: 0.15
                         }}
                       >
                          {animal.emoji}
                       </div>
                    ))}
                 </div>
               )}

               {isGenerating ? (
                 <div className="text-white text-center z-10 relative">
                    <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full -z-10 animate-pulse"></div>
                    <div className="text-8xl animate-bounce mb-6 filter drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">📬</div>
                    <h2 className="text-4xl font-black text-cyan-300 mb-2 drop-shadow-md">Bubble Arrived!</h2>
                    <p className="animate-pulse text-xl text-cyan-100 font-medium">Knocking on doors in {selectedCurrent?.endLocation}...</p>
                 </div>
               ) : destinationData && (
                 <div 
                   className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.6)] max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] border-4 border-cyan-300 relative z-10 transform"
                   style={{ animation: 'popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}
                 >
                    {/* Decorative Ribbon */}
                    <div className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 rotate-45 bg-yellow-400 text-yellow-900 font-bold py-1 px-12 shadow-lg z-20 border border-yellow-200">
                       SUCCESS!
                    </div>

                    {/* Header with Location Image/Gradient */}
                    <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 p-8 text-white text-center relative overflow-hidden shrink-0">
                       <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/fish-net.png')]"></div>
                       {/* Floating icons in header */}
                       <div className="absolute top-4 left-6 text-4xl opacity-60 animate-bounce">✨</div>
                       <div className="absolute bottom-4 right-6 text-4xl opacity-60 animate-pulse delay-75">🫧</div>
                       
                       <h2 className="text-4xl md:text-5xl font-black relative z-10 drop-shadow-lg mb-2 tracking-tight">Message Received!</h2>
                       <div className="inline-block bg-white/20 px-5 py-2 rounded-full backdrop-blur-md border border-white/30 shadow-inner">
                         <p className="font-bold relative z-10 flex items-center gap-2 text-shadow-sm">
                            <Map size={18} className="text-yellow-300" /> 
                            <span className="text-cyan-50">Location:</span> 
                            <span className="text-white text-lg">{destinationData.location}</span>
                         </p>
                       </div>
                    </div>
                    
                    <div className="p-6 md:p-8 overflow-y-auto bg-gradient-to-b from-white to-slate-50">
                       {/* Question Recap */}
                       <div className="bg-amber-50 border-l-8 border-amber-400 p-5 mb-6 rounded-r-xl shadow-sm relative">
                          <span className="absolute -top-3 -left-2 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded">YOUR LETTER</span>
                          <p className="text-slate-700 italic text-lg leading-relaxed pt-1">"{letter.content}"</p>
                       </div>

                       {/* Reply Body */}
                       <div className="prose prose-lg text-slate-700 mb-8 leading-relaxed">
                          {destinationData.replyText.split('\n').map((line, i) => (
                             <p key={i} className="mb-3 first:font-medium first:text-xl first:text-cyan-800">{line}</p>
                          ))}
                       </div>

                       {/* Fun Fact Card */}
                       <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-5 flex items-start gap-4 mb-8 border border-indigo-100 shadow-[inset_0_2px_4px_rgba(255,255,255,1)] transform transition hover:scale-[1.01]">
                          <div className="bg-white p-3 rounded-full text-3xl shadow-sm border border-indigo-100 shrink-0">💡</div>
                          <div>
                             <h4 className="font-black text-indigo-800 text-sm uppercase tracking-wide mb-1">Did you know?</h4>
                             <p className="text-indigo-900 text-base font-medium">{destinationData.funFact}</p>
                          </div>
                       </div>

                       <button 
                         onClick={resetGame}
                         className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xl py-4 rounded-xl shadow-lg transition-all hover:shadow-cyan-500/50 hover:-translate-y-1 flex items-center justify-center gap-3 active:scale-95 group"
                       >
                         <RefreshCw size={24} className="group-hover:rotate-180 transition-transform duration-500" /> 
                         Send Another Bubble
                       </button>
                    </div>
                 </div>
               )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default App;