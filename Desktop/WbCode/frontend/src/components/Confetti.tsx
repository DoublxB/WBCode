import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
}

interface ConfettiProps {
  count?: number;
  duration?: number;
  colors?: string[];
}

const Confetti = ({ 
  count = 50, 
  duration = 3000,
  // ALBASTRU (bază), VERDE (XP), PORTOCALIU (recompensă)
  colors = ['#3B82F6', '#2563EB', '#22C55E', '#4ADE80', '#F59E0B', '#FBBF24']
}: ConfettiProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles: Particle[] = [];
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 2 + Math.random() * 4;
      newParticles.push({
        id: i,
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 6,
        life: 1,
      });
    }

    setParticles(newParticles);

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      setParticles((prev) =>
        prev.map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.2, // gravity
          vx: p.vx * 0.98, // friction
          life: 1 - progress,
        }))
      );

      if (progress >= 1) {
        clearInterval(interval);
        setParticles([]);
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [count, duration, colors]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            opacity: particle.life,
            transform: `rotate(${particle.life * 360}deg)`,
            boxShadow: `0 0 ${particle.size}px ${particle.color}`,
            transition: 'opacity 0.1s',
          }}
        />
      ))}
    </div>
  );
};

export default Confetti;

