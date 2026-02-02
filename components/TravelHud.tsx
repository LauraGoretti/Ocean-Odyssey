import React, { useEffect, useState, useRef } from 'react';
import { OceanCurrent, MarineLife, WeatherEffect } from '../types';
import { Thermometer, Timer, Waves, Lightbulb, CloudRain, CloudFog } from 'lucide-react';
import BubblesOverlay from './BubblesOverlay';

interface TravelHudProps {
  current: OceanCurrent;
  progress: number; // 0 to 100
  weather?: WeatherEffect;
}

const TravelHud: React.FC<TravelHudProps> = ({ current, progress, weather = 'NONE' }) => {
  const [activeAnimal, setActiveAnimal] = useState<MarineLife | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Dynamic stats simulation
  const depth = Math.max(0, Math.sin(progress * Math.PI) * 2000 + 50); // Simulates going deep and coming back up
  const temperature = parseFloat(current.avgTemp) - (depth / 500); // Colder as it gets deeper
  const brightness = Math.max(0, 100 - (depth / 10)); // Darker as it gets deeper

  // Show animals at specific progress points
  useEffect(() => {
    if (progress > 20 && progress < 30) setActiveAnimal(current.biodiversity[0]);
    else if (progress > 50 && progress < 60) setActiveAnimal(current.biodiversity[1]);
    else if (progress > 80 && progress < 90) setActiveAnimal(current.biodiversity[2]);
    else setActiveAnimal(null);
  }, [progress, current]);

  // --- WEATHER EFFECTS SYSTEM (CANVAS & CSS) ---
  useEffect(() => {
    // We only use Canvas for Rain currently. Fog is handled via CSS but we clear canvas if not raining.
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let w = canvas.width;
    let h = canvas.height;

    // Particle Arrays
    const rainParticles: {x: number, y: number, z: number, len: number}[] = [];
    const splashes: {x: number, y: number, age: number, maxAge: number}[] = [];

    const initRain = () => {
        const count = 500; // Dense rain
        rainParticles.length = 0;
        for (let i = 0; i < count; i++) {
            rainParticles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                z: Math.random() * 2 + 0.5, // Depth: 0.5 (far) to 2.5 (close)
                len: Math.random() * 20 + 10
            });
        }
    };

    const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        w = canvas.width;
        h = canvas.height;
        if (weather === 'RAIN') initRain();
    };

    window.addEventListener('resize', resize);
    resize();

    // Trigger init if weather changes to rain
    if (weather === 'RAIN') initRain();
    else rainParticles.length = 0; // Clear if not raining

    const render = () => {
        ctx.clearRect(0, 0, w, h);
        
        if (weather === 'RAIN') {
            // Rain Physics & Draw
            ctx.lineCap = 'round';

            // Draw drops
            rainParticles.forEach(p => {
                const speed = p.z * 12; // Closer drops fall faster
                const opacity = (p.z - 0.5) / 2.5; // Closer drops are clearer
                const thickness = p.z * 0.8; 
                
                ctx.strokeStyle = `rgba(200, 230, 255, ${opacity * 0.6})`;
                ctx.lineWidth = thickness;
                
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                // Slant for wind effect (closer drops slant more visually)
                const windOffset = speed * -0.3;
                ctx.lineTo(p.x + windOffset, p.y + p.len * p.z); 
                ctx.stroke();

                // Update Position
                p.y += speed;
                p.x += windOffset;

                // Reset
                if (p.y > h) {
                    // Spawn Splash? (Only for closer/heavier drops)
                    if (p.z > 1.5 && Math.random() > 0.7) {
                        splashes.push({
                            x: p.x,
                            y: h,
                            age: 0,
                            maxAge: 10 + Math.random() * 10
                        });
                    }

                    p.y = -p.len * p.z;
                    p.x = Math.random() * (w + 200); // Spawn wider to cover wind slant
                }
            });

            // Draw Splashes
            for (let i = splashes.length - 1; i >= 0; i--) {
                const s = splashes[i];
                s.age++;
                if (s.age > s.maxAge) {
                    splashes.splice(i, 1);
                    continue;
                }

                const progress = s.age / s.maxAge;
                const radius = progress * 15;
                const alpha = 1 - progress;

                ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.lineWidth = 1;
                
                ctx.beginPath();
                // Ellipse ripple
                ctx.ellipse(s.x, s.y, radius, radius * 0.3, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        
        animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationFrameId);
    };
  }, [weather]);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10 overflow-hidden">
      
      {/* --- ANIMATIONS & STYLES --- */}
      <style>{`
        @keyframes drift {
           0% { transform: translateX(-10vw) translateY(0) rotate(0deg); opacity: 0; }
           30% { transform: translateX(30vw) translateY(20px) rotate(60deg); opacity: 0.5; }
           60% { transform: translateX(70vw) translateY(-20px) rotate(120deg); opacity: 0.5; }
           100% { transform: translateX(110vw) translateY(0) rotate(180deg); opacity: 0; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 2px rgba(100, 255, 255, 0.3); background-color: rgba(100, 255, 255, 0.4); }
          50% { box-shadow: 0 0 8px rgba(100, 255, 255, 0.8); background-color: rgba(150, 255, 255, 0.9); }
        }
        @keyframes swimIn {
          0% { transform: translateX(200px) rotate(10deg) scale(0.5); opacity: 0; }
          60% { transform: translateX(-20px) rotate(-5deg) scale(1.1); opacity: 1; }
          80% { transform: translateX(10px) rotate(2deg) scale(0.95); }
          100% { transform: translateX(0) rotate(0) scale(1); }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        @keyframes fogFlow1 {
          0% { transform: translateX(-25%); }
          100% { transform: translateX(25%); }
        }
        @keyframes fogFlow2 {
          0% { transform: translateX(25%); }
          100% { transform: translateX(-25%); }
        }
      `}</style>
      
      {/* --- WEATHER EFFECTS --- */}
      
      {/* FOG: Multi-layer Volumetric CSS */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${weather === 'FOG' ? 'opacity-100' : 'opacity-0'}`}>
         {/* Background Blur for Depth of Field Loss */}
         <div className="absolute inset-0 backdrop-blur-[3px] transition-all duration-1000"></div>
         
         {/* Base Dim Layer */}
         <div className="absolute inset-0 bg-slate-500/20 mix-blend-multiply"></div>
         
         {/* Fog Layer 1: Slow rolling thick clouds */}
         <div className="absolute inset-[-50%] opacity-60 mix-blend-screen" 
              style={{ 
                  background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 60%)',
                  backgroundSize: '50% 50%',
                  animation: 'fogFlow1 60s infinite alternate linear'
              }}></div>
         
         {/* Fog Layer 2: Faster mist */}
         <div className="absolute inset-[-50%] opacity-40 mix-blend-overlay" 
              style={{ 
                  background: 'repeating-radial-gradient(circle at 50% 50%, rgba(200,220,230,0.5), transparent 20%)',
                  backgroundSize: '30% 30%',
                  animation: 'fogFlow2 45s infinite alternate ease-in-out'
              }}></div>

         {/* Fog Layer 3: Noise Texture for gritty detail (Simulated via small repeating gradient) */}
         <div className="absolute inset-0 opacity-20"
              style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.5\'/%3E%3C/svg%3E")',
              }}>
         </div>

         {/* Fog UI Indicator */}
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-slate-100/80 font-bold text-5xl flex flex-col items-center gap-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] animate-pulse">
                <CloudFog size={80} strokeWidth={1.5} />
                <span className="tracking-widest font-mono text-2xl">VISIBILITY LOW</span>
            </div>
        </div>
      </div>

      {/* RAIN: Canvas Particle System */}
      <canvas 
        ref={canvasRef}
        className={`absolute inset-0 z-0 transition-opacity duration-500 ${weather === 'RAIN' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />
      {weather === 'RAIN' && (
         <div className="absolute top-1/4 left-0 right-0 flex justify-center pointer-events-none">
            <div className="bg-slate-900/40 backdrop-blur px-6 py-2 rounded-full text-cyan-50/90 font-bold text-xl flex items-center gap-3 border border-cyan-500/30 animate-bounce">
                <CloudRain size={24} />
                <span>HEAVY RAIN DETECTED</span>
            </div>
         </div>
      )}

      {/* Decorative Overlay: Vignette for Underwater Feel */}
      <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,30,60,0.6)] z-0 pointer-events-none"></div>

      {/* --- DYNAMIC PARTICLES (Bubbles & Plankton) --- */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        
        {/* Rising Bubbles Component */}
        <BubblesOverlay />

        {/* Drifting Plankton (Bioluminescent) */}
        {[...Array(40)].map((_, i) => (
           <div 
             key={`plankton-${i}`}
             className="absolute rounded-full"
             style={{
               left: `${Math.random() * 100}%`,
               top: `${Math.random() * 100}%`,
               width: `${Math.random() * 4 + 2}px`,
               height: `${Math.random() * 4 + 2}px`,
               animation: `drift ${Math.random() * 20 + 15}s linear infinite, pulseGlow ${Math.random() * 2 + 1}s ease-in-out infinite`,
               animationDelay: `-${Math.random() * 25}s`,
               opacity: Math.random() * 0.5 + 0.2
             }}
           ></div>
        ))}
      </div>

      {/* Header Info */}
      <div className="bg-black/50 backdrop-blur-md p-4 rounded-xl text-white border border-cyan-400/30 max-w-md z-10 relative">
        <h2 className="text-2xl font-bold text-cyan-300 flex items-center gap-2">
          <Waves className="animate-pulse" /> {current.name}
        </h2>
        <p className="text-sm opacity-80 mt-1">Traveling to {current.endLocation}...</p>
      </div>

      {/* Active Animal Popup */}
      {activeAnimal && (
        <div 
          key={activeAnimal.name} 
          className="absolute top-1/2 right-4 md:right-10 -translate-y-1/2 z-20"
          style={{ animation: 'swimIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
        >
          <div className="bg-white/95 p-6 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] text-center border-4 border-cyan-300 transform transition-all relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-cyan-50 to-transparent opacity-50 z-0"></div>
            
            <div className="relative z-10">
                <div 
                  className="text-8xl mb-2 filter drop-shadow-md" 
                  style={{ animation: 'wiggle 3s ease-in-out infinite' }}
                >
                  {activeAnimal.emoji}
                </div>
                <div className="font-black text-3xl text-blue-900 tracking-wide mb-1 drop-shadow-sm">
                  {activeAnimal.name}
                </div>
                <div className="inline-block bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold uppercase shadow-inner border border-blue-200">
                  Depth: {activeAnimal.depth}
                </div>
            </div>
            
            {/* Sparkles/Bubbles decorative */}
            <div className="absolute top-2 right-4 text-xl animate-pulse">✨</div>
            <div className="absolute bottom-4 left-4 text-xl animate-bounce delay-100">🫧</div>
          </div>
        </div>
      )}

      {/* Bottom Dashboard */}
      <div className="grid grid-cols-4 gap-4 bg-black/60 backdrop-blur-lg p-4 rounded-2xl border border-white/10 text-white z-10 relative">
        
        {/* Progress Bar */}
        <div className="col-span-4 mb-2">
           <div className="flex justify-between text-xs mb-1 uppercase tracking-wider font-semibold text-cyan-300">
             <span>Start</span>
             <span>Travel Distance</span>
             <span>Arrival</span>
           </div>
           <div className="h-4 bg-gray-700 rounded-full overflow-hidden border border-gray-600 shadow-inner">
             <div 
               className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 transition-all duration-300 ease-linear relative"
               style={{ width: `${progress}%` }}
             >
                {/* Shine effect on bar */}
                <div className="absolute top-0 right-0 bottom-0 w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
             </div>
           </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col items-center p-2 bg-white/5 rounded-lg border border-white/5">
           <Timer className="text-yellow-400 mb-1" size={20} />
           <span className="text-[10px] text-gray-400 uppercase tracking-widest">Speed</span>
           <span className="font-bold text-lg md:text-xl">{current.avgSpeed}</span>
        </div>

        <div className="flex flex-col items-center p-2 bg-white/5 rounded-lg border border-white/5">
           <Thermometer className="text-red-400 mb-1" size={20} />
           <span className="text-[10px] text-gray-400 uppercase tracking-widest">Temp</span>
           <span className="font-bold text-lg md:text-xl">{temperature.toFixed(1)}°C</span>
        </div>

        <div className="flex flex-col items-center p-2 bg-white/5 rounded-lg border border-white/5">
           <Waves className="text-blue-400 mb-1" size={20} />
           <span className="text-[10px] text-gray-400 uppercase tracking-widest">Depth</span>
           <span className="font-bold text-lg md:text-xl">{depth.toFixed(0)}m</span>
        </div>

        <div className="flex flex-col items-center p-2 bg-white/5 rounded-lg border border-white/5">
           <Lightbulb className={brightness < 30 ? "text-gray-500" : "text-yellow-200 mb-1"} size={20} />
           <span className="text-[10px] text-gray-400 uppercase tracking-widest">Light</span>
           <span className="font-bold text-lg md:text-xl">{brightness.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
};

export default TravelHud;