import React, { useCallback, useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  velocity: {
    x: number;
    y: number;
  };
  type: 'confetti' | 'firework';
}

interface ConfettiProps {
  active?: boolean;
  count?: number;
}

const colors = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'];

export function Confetti({ active = false, count = 100 }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  const generateConfetti = useCallback(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      velocity: {
        x: (Math.random() - 0.5) * 10,
        y: Math.random() * -15,
      },
      type: 'confetti' as const,
    }));
  }, [count]);

  const generateFireworks = useCallback(() => {
    const fireworks: Particle[] = [];
    //const fireworkCount = 30; // 烟花爆炸点数量
     

    return fireworks;
  }, [count]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    setParticles([...generateConfetti(), ...generateFireworks()]);
    
    const interval = setInterval(() => {
      setParticles((currentParticles) =>
        currentParticles
          .map((particle) => ({
            ...particle,
            x: particle.x + particle.velocity.x,
            y: particle.y + particle.velocity.y + (particle.type === 'confetti' ? 0.5 : 0.2),
            rotation: particle.rotation + 2,
            velocity: {
              x: particle.velocity.x * 0.99,
              y: particle.velocity.y + (particle.type === 'confetti' ? 0.1 : 0.15),
            },
          }))
          .filter(
            (particle) =>
              particle.y < window.innerHeight + 100 &&  // 使用 && 而不是 &
              particle.x < window.innerWidth + 100
          ),
      );
    }, 16);

    return () => clearInterval(interval);
  }, [active, generateConfetti, generateFireworks]);

  return (
    <div className="fixed inset-0 pointer-events-none">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-3 h-3"
          style={{
            left: particle.x,
            top: particle.y,
            backgroundColor: particle.color,
            transform: `rotate(${particle.rotation}deg)`,
            clipPath: particle.type === 'confetti' 
              ? 'polygon(50% 0%, 100% 100%, 0% 100%)'
              : 'circle(50% at 50% 50%)',
            opacity: particle.type === 'firework' ? 0.8 : 1,
          }}
        />
      ))}
    </div>
  );
}