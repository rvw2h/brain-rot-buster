import React from "react";

const FlameParticles = ({ count = 6 }: { count?: number }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {Array.from({ length: count }).map((_, i) => {
        const left = `${15 + Math.random() * 70}%`;
        const top = `${40 + Math.random() * 40}%`;
        const delay = `${Math.random() * 3}s`;
        const size = `${16 + Math.random() * 8}px`;
        const duration = `${3 + Math.random() * 2}s`;
        
        return (
          <div
            key={i}
            className="absolute animate-aura-particle opacity-0"
            style={{
              left,
              top,
              fontSize: size,
              animationDelay: delay,
              animationDuration: duration,
            }}
          >
            🔥
          </div>
        );
      })}
    </div>
  );
};

export default FlameParticles;
