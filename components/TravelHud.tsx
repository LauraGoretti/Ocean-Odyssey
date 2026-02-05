import React, { useEffect, useState, useRef } from 'react';
import { OceanCurrent, MarineLife, WeatherEffect } from '../types';
import { Thermometer, Timer, Waves, Lightbulb, CloudRain, CloudFog, Zap } from 'lucide-react';
import BubblesOverlay from './BubblesOverlay';

interface TravelHudProps {
  current: OceanCurrent;
  progress: number; // 0 to 100
  weather?: WeatherEffect;
  intensity?: number; // 0.0 to 1.0, controls strength of effect
  reduceMotion?: boolean;
  weatherEnabled?: boolean;
}

const TravelHud: React.FC<TravelHudProps> = ({ 
    current, 
    progress, 
    weather = 'NONE', 
    intensity = 0.5,
    reduceMotion = false,
    weatherEnabled = true 
}) => {
  const [activeAnimal, setActiveAnimal] = useState<MarineLife | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lightningFlash, setLightningFlash] = useState(0); 
  
  const intensityRef = useRef(intensity);
  useEffect(() => { intensityRef.current = intensity; }, [intensity]);

  // Dynamic stats
  const depth = Math.max(0, Math.sin(progress * Math.PI) * 2000 + 50); 
  const temperature = parseFloat(current.avgTemp) - (depth / 500); 
  const brightness = Math.max(0, 100 - (depth / 10)); 

  useEffect(() => {
    if (progress > 20 && progress < 30) setActiveAnimal(current.biodiversity[0]);
    else if (progress > 50 && progress < 60) setActiveAnimal(current.biodiversity[1]);
    else if (progress > 80 && progress < 90) setActiveAnimal(current.biodiversity[2]);
    else setActiveAnimal(null);
  }, [progress, current]);

  // --- WEATHER EFFECTS SYSTEM (CANVAS) ---
  useEffect(() => {
    if (!canvasRef.current || !weatherEnabled) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let w = canvas.width;
    let h = canvas.height;

    type ParticleType = 'RAIN' | 'LENS_DROP' | 'SNOW';
    interface Particle {
      x: number;
      y: number;
      z: number; 
      size: number;
      speed: number;
      opacity: number;
      type: ParticleType;
      driftOffset?: number;
    }

    const particles: Particle[] = [];
    
    const spawnParticle = (randomY = false) => {
      const currentIntensity = intensityRef.current;
      const type: ParticleType = weather === 'RAIN' 
        ? (Math.random() > 0.97 ? 'LENS_DROP' : 'RAIN') 
        : 'SNOW';

      const z = Math.random(); 
      let p: Particle = {
        x: Math.random() * w,
        y: randomY ? Math.random() * h : -100,
        z,
        type,
        size: 0,
        speed: 0,
        opacity: 0,
        driftOffset: 0
      };

      if (type === 'RAIN') {
        const speedVar = 0.8 + Math.random() * 0.4; 
        p.speed = (20 + z * 15) * speedVar * (0.8 + currentIntensity * 0.4); 
        const sizeVar = 0.8 + Math.random() * 0.5;
        p.size = (25 + z * 35) * sizeVar; 
        p.opacity = (0.3 + z * 0.5) * Math.min(1, currentIntensity + 0.2);
        p.driftOffset = (Math.random() - 0.5) * 2; 
      } else if (type === 'LENS_DROP') {
        p.y = randomY ? Math.random() * h : Math.random() * h * 0.5;
        p.speed = 0.5 + Math.random(); 
        p.size = 2 + Math.random() * 4; 
        p.opacity = (0.6 + Math.random() * 0.4) * currentIntensity;
      } else if (type === 'SNOW') {
        p.speed = 0.2 + z * 0.8;
        p.size = 1 + z * 3;
        p.opacity = (0.2 + z * 0.5) * currentIntensity;
        p.driftOffset = Math.random() * Math.PI * 2;
      }
      
      if (!randomY) particles.push(p);
      else particles[particles.length] = p; 
    };

    const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        w = canvas.width;
        h = canvas.height;
        particles.length = 0; // Clear on resize
        if (weather !== 'NONE') {
             for(let i=0; i<50; i++) spawnParticle(true);
        }
    };

    window.addEventListener('resize', resize);
    resize();

    const render = () => {
        if (!weatherEnabled) {
            ctx.clearRect(0,0,w,h);
            return;
        }

        const currentIntensity = intensityRef.current;
        ctx.clearRect(0, 0, w, h);
        
        let targetParticles = 0;
        if (weather === 'RAIN') targetParticles = Math.floor(50 + currentIntensity * 350);
        else if (weather === 'FOG') targetParticles = Math.floor(50 + currentIntensity * 200);

        if (particles.length < targetParticles) {
            const spawnRate = Math.ceil((targetParticles - particles.length) / 10);
            for(let i=0; i<spawnRate; i++) spawnParticle(false);
        } else if (particles.length > targetParticles) {
            particles.splice(0, particles.length - targetParticles);
        }

        if (weather === 'RAIN' && Math.random() > (0.998 - (currentIntensity * 0.005))) {
           const flashIntensity = 0.3 + Math.random() * 0.7 * currentIntensity;
           setLightningFlash(flashIntensity);
        }

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            if (p.type === 'RAIN') {
                const windX = (-3 * p.z) + (p.driftOffset || 0);
                const grad = ctx.createLinearGradient(p.x, p.y, p.x + windX, p.y + p.size);
                grad.addColorStop(0, `rgba(200, 240, 255, 0)`);
                grad.addColorStop(1, `rgba(220, 245, 255, ${p.opacity})`);
                ctx.strokeStyle = grad;
                ctx.lineWidth = 1 + p.z * 1.5;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x + windX, p.y + p.size);
                ctx.stroke();

                p.y += p.speed;
                p.x += windX;
            } else if (p.type === 'LENS_DROP') {
                ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                p.y += p.speed;
                p.opacity -= 0.005;
            } else if (p.type === 'SNOW') {
                const drift = Math.sin((Date.now() * 0.001) + (p.driftOffset || 0)) * 0.5;
                ctx.fillStyle = `rgba(220, 255, 255, ${p.opacity})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                p.y += p.speed;
                p.x += drift;
            }

            if (p.y > h + 50 || p.x < -50 || p.opacity <= 0) {
               const z = Math.random();
               if (p.type === 'RAIN') {
                  p.x = Math.random() * (w + 100);
                  p.y = -100 - Math.random() * 50;
                  p.z = z;
                  p.speed = (20 + z * 15) * (0.8 + Math.random() * 0.4) * (0.8 + currentIntensity * 0.4);
                  p.size = (25 + z * 35) * (0.8 + Math.random() * 0.5);
                  p.opacity = (0.3 + z * 0.5) * Math.min(1, currentIntensity + 0.2);
               } else if (p.type === 'LENS_DROP') {
                   p.type = 'RAIN'; 
                   p.y = -50;
               } else if (p.type === 'SNOW') {
                   p.y = -10;
                   p.x = Math.random() * w;
                   p.opacity = (0.2 + z * 0.5) * currentIntensity;
               }
            }
        }
        animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationFrameId);
    };
  }, [weather, weatherEnabled]); // Depend on enabled state

  // Lightning Decay
  useEffect(() => {
    if (lightningFlash > 0) {
        const timer = setTimeout(() => setLightningFlash(0), 120);
        return () => clearTimeout(timer);
    }
  }, [lightningFlash]);

  // Determine sway animation string
  const swayAnimation = (!reduceMotion && weather !== 'NONE') 
    ? `uiSway ${5 - intensity * 2}s infinite ease-in-out` 
    : 'none';
  
  const reverseSwayAnimation = (!reduceMotion && weather !== 'NONE')
    ? `uiSway ${6 - intensity * 2}s infinite ease-in-out reverse`
    : 'none';

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10 overflow-hidden">
      
      {/* Lightning Overlay */}
      {weatherEnabled && (
          <div 
            className="absolute inset-0 bg-white pointer-events-none z-20 transition-opacity duration-150 mix-blend-overlay"
            style={{ opacity: lightningFlash }}
          />
      )}

      {/* --- STYLES --- */}
      <style>{`
        @keyframes drift {
           0% { transform: translateX(-10vw) translateY(0) rotate(0deg); opacity: 0; }
           100% { transform: translateX(110vw) translateY(0) rotate(180deg); opacity: 0; }
        }
        @keyframes swimIn {
          0% { transform: translateX(120%) rotate(15deg) scale(0.6); opacity: 0; }
          100% { transform: translateX(0) rotate(0) scale(1); }
        }
        @keyframes playfulWiggle {
          0%, 100% { transform: rotate(-8deg) translateY(0px) scale(1); }
          50% { transform: rotate(8deg) translateY(-8px) scale(1.05); }
        }
        @keyframes fogFlow1 {
          0% { transform: translateX(-15%) translateY(-5%); }
          100% { transform: translateX(15%) translateY(5%); }
        }
        @keyframes fogPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
        @keyframes uiSway {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(2px, 1px) rotate(0.2deg); }
          50% { transform: translate(-1px, 2px) rotate(-0.2deg); }
          75% { transform: translate(-2px, -1px) rotate(0.1deg); }
        }
      `}</style>
      
      {/* WEATHER: FOG */}
      {weatherEnabled && (
        <div 
            className={`absolute inset-0 transition-all duration-1000`}
            style={{ 
                opacity: weather === 'FOG' ? Math.max(0.2, intensity) : 0,
                backdropFilter: `blur(${weather === 'FOG' ? intensity * 3 : 0}px)`
            }}
        >
            <div className="absolute inset-0 bg-teal-900/40 mix-blend-multiply"></div>
            {/* Reduced complexity fog for performance if needed, keeping simple layers */}
            <div className="absolute inset-[-50%] opacity-40 mix-blend-screen" 
                style={{ 
                    backgroundImage: `radial-gradient(circle at 20% 50%, rgba(56, 189, 248, 0.15) 0%, transparent 50%)`,
                    backgroundSize: '80% 80%',
                    animation: !reduceMotion ? 'fogFlow1 60s infinite alternate ease-in-out' : 'none'
                }}></div>
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-teal-100/60 font-bold text-5xl flex flex-col items-center gap-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]" style={{ animation: !reduceMotion ? 'fogPulse 4s infinite ease-in-out' : 'none' }}>
                    <CloudFog size={80} strokeWidth={1.5} />
                    <span className="tracking-widest font-mono text-2xl">TURBULENCE</span>
                </div>
            </div>
        </div>
      )}

      {/* WEATHER: PARTICLES CANVAS */}
      <canvas 
        ref={canvasRef}
        className={`absolute inset-0 z-0 transition-opacity duration-500`}
        style={{ opacity: weatherEnabled ? 1 : 0 }}
      />
      
      {weatherEnabled && weather === 'RAIN' && (
         <div className="absolute top-1/4 left-0 right-0 flex justify-center pointer-events-none">
            <div className={`bg-slate-900/60 backdrop-blur px-6 py-2 rounded-full text-cyan-50/90 font-bold text-xl flex items-center gap-3 border border-cyan-500/30 ${!reduceMotion && 'animate-bounce'}`}>
                <CloudRain size={24} />
                <span>SURFACE STORM DETECTED</span>
                {lightningFlash > 0 && <Zap size={24} className="text-yellow-300" />}
            </div>
         </div>
      )}

      {/* Vignette */}
      <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,20,40,0.7)] z-0 pointer-events-none"></div>

      {/* Bubbles */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <BubblesOverlay />
      </div>

      {/* Header Info */}
      <div 
        className="bg-black/50 backdrop-blur-md p-4 rounded-xl text-white border border-cyan-400/30 max-w-md z-10 relative transition-transform duration-1000"
        style={{ animation: swayAnimation }}
      >
        <h2 className="text-2xl font-bold text-cyan-300 flex items-center gap-2">
          <Waves className={!reduceMotion ? "animate-pulse" : ""} /> {current.name}
        </h2>
        <p className="text-sm opacity-80 mt-1">Traveling to {current.endLocation}...</p>
      </div>

      {/* Active Animal Popup */}
      {activeAnimal && (
        <div 
          key={activeAnimal.name} 
          className="absolute top-1/2 right-4 md:right-10 -translate-y-1/2 z-20"
          style={{ animation: !reduceMotion ? 'swimIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none' }}
        >
          <div className="bg-white/95 p-6 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] text-center border-4 border-cyan-300 transform transition-all relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-cyan-50 to-transparent opacity-50 z-0"></div>
            
            <div className="relative z-10">
                <div 
                  className="text-8xl mb-2 filter drop-shadow-md cursor-pointer" 
                  style={{ animation: !reduceMotion ? 'playfulWiggle 3s ease-in-out infinite' : 'none' }}
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
          </div>
        </div>
      )}

      {/* Bottom Dashboard */}
      <div 
        className="grid grid-cols-4 gap-4 bg-black/60 backdrop-blur-lg p-4 rounded-2xl border border-white/10 text-white z-10 relative transition-transform duration-1000"
        style={{ animation: reverseSwayAnimation }}
      >
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
                {/* Shine effect */}
                {!reduceMotion && <div className="absolute top-0 right-0 bottom-0 w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />}
             </div>
           </div>
        </div>

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