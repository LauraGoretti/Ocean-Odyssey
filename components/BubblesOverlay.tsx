import React, { useMemo, useState } from 'react';

interface BubbleConfig {
  id: number;
  left: number;
  size: number;
  riseDuration: number;
  riseDelay: number;
  wobbleDuration: number;
  wobbleAmp: number;
  wobbleDelay: number;
  opacity: number;
}

const Bubble: React.FC<{ config: BubbleConfig }> = ({ config }) => {
  const [isPopped, setIsPopped] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    // Prevent click from propagating if we had globe interaction logic, 
    // though here the container is pointer-events-none so it doesn't matter much.
    // The bubble itself is pointer-events-auto.
    e.stopPropagation(); 
    
    setIsPopped(true);
    // Reset the pop effect after animation
    setTimeout(() => setIsPopped(false), 500);
  };

  return (
    <div
      className="absolute bottom-0 will-change-transform pointer-events-auto cursor-pointer"
      style={{
        left: `${config.left}%`,
        width: `${config.size}px`,
        height: `${config.size}px`,
        // @ts-ignore
        '--bubble-opacity': config.opacity,
        animation: `bubble-rise ${config.riseDuration}s linear infinite`,
        animationDelay: `${config.riseDelay}s`,
      } as React.CSSProperties}
      onClick={handleClick}
    >
      {/* Wobble Layer - Separated to avoid transform conflicts with scale */}
      <div 
        className="w-full h-full"
        style={{
          // @ts-ignore
          '--wobble-amp': config.wobbleAmp,
          animation: `bubble-wobble ${config.wobbleDuration}s ease-in-out infinite`,
          animationDelay: `${config.wobbleDelay}s`
        } as React.CSSProperties}
      >
        {/* Visual & Interaction Layer */}
        <div 
          className={`w-full h-full rounded-full border transition-all duration-300 ease-out
            bg-cyan-50/10 backdrop-blur-[1px]
            ${isPopped 
               ? 'border-white bg-white/40 shadow-[0_0_30px_rgba(255,255,255,0.9)] scale-150 opacity-0' 
               : 'border-cyan-100/40 hover:border-cyan-200 hover:bg-cyan-50/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.8)] hover:scale-110'
            }
          `}
        >
          {/* Highlight */}
          <div className="absolute top-[20%] right-[20%] w-[25%] h-[25%] bg-white/60 rounded-full blur-[1px]" />
        </div>
      </div>
    </div>
  );
};

const BubblesOverlay: React.FC = () => {
  // Generate bubble configuration with more variance
  const bubbles = useMemo<BubbleConfig[]>(() => {
    return Array.from({ length: 50 }).map((_, i) => {
      // Physics-inspired: Larger bubbles rise faster
      const size = 6 + Math.random() * 24; // 6px to 30px
      const baseSpeed = 15; 
      const speedVariation = Math.random() * 5;
      // Inverse relationship: Larger size -> Lower duration (Faster)
      const riseDuration = (baseSpeed - (size / 5)) + speedVariation; 

      return {
        id: i,
        // Wider spread but still avoiding extreme edges
        left: 5 + Math.random() * 90, 
        size,
        riseDuration, // Calculated based on size
        riseDelay: Math.random() * -30, // Start at different times
        wobbleDuration: 2.5 + Math.random() * 3, // 2.5s to 5.5s
        wobbleAmp: 10 + Math.random() * 25, // Varying drift width (10px to 35px)
        wobbleDelay: Math.random() * 5,
        opacity: 0.2 + Math.random() * 0.5, // Random opacity
      };
    });
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <style>{`
        @keyframes bubble-rise {
            0% { transform: translateY(110vh) scale(0.8); opacity: 0; }
            10% { opacity: var(--bubble-opacity); }
            80% { opacity: var(--bubble-opacity); }
            100% { transform: translateY(-10vh) scale(1.2); opacity: 0; }
        }
        @keyframes bubble-wobble {
            0%, 100% { transform: translateX(calc(var(--wobble-amp) * -0.5px)) rotate(-5deg); }
            50% { transform: translateX(calc(var(--wobble-amp) * 0.5px)) rotate(5deg); }
        }
      `}</style>
      
      {bubbles.map((bubble) => (
        <Bubble key={bubble.id} config={bubble} />
      ))}
    </div>
  );
};

export default BubblesOverlay;