import React, { useMemo } from 'react';

const BubblesOverlay: React.FC = () => {
  // Generate static bubble configuration
  const bubbles = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100, // Random horizontal position
      size: Math.random() * 20 + 5, // Size between 5px and 25px
      riseDuration: Math.random() * 15 + 10, // Rise time between 10s and 25s
      riseDelay: Math.random() * -25, // Start at different times in the cycle
      wobbleDuration: Math.random() * 2 + 2, // Wobble speed 2-4s
      wobbleDelay: Math.random() * 2,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <style>{`
        @keyframes bubble-rise {
            0% { transform: translateY(110vh); opacity: 0; }
            10% { opacity: 0.4; }
            50% { opacity: 0.6; }
            90% { opacity: 0.4; }
            100% { transform: translateY(-10vh); opacity: 0; }
        }
        @keyframes bubble-wobble {
            0%, 100% { transform: translateX(-8px); }
            50% { transform: translateX(8px); }
        }
      `}</style>
      
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="absolute bottom-0 will-change-transform"
          style={{
            left: `${bubble.left}%`,
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            animation: `bubble-rise ${bubble.riseDuration}s linear infinite`,
            animationDelay: `${bubble.riseDelay}s`,
          }}
        >
             {/* Inner container handles the side-to-side wobble independently of the vertical rise */}
             <div 
                className="w-full h-full rounded-full border border-cyan-100/40 bg-cyan-50/10 shadow-[inset_0_0_6px_rgba(255,255,255,0.4)] backdrop-blur-[1px]" 
                style={{
                    animation: `bubble-wobble ${bubble.wobbleDuration}s ease-in-out infinite`,
                    animationDelay: `${bubble.wobbleDelay}s`
                }}
             />
             
             {/* Highlight on bubble */}
             <div 
                className="absolute top-[20%] right-[20%] w-[25%] h-[25%] bg-white/60 rounded-full blur-[1px]"
                style={{
                    animation: `bubble-wobble ${bubble.wobbleDuration}s ease-in-out infinite`,
                    animationDelay: `${bubble.wobbleDelay}s`
                }}
             />
        </div>
      ))}
    </div>
  );
};

export default BubblesOverlay;