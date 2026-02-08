import { useEffect, useState } from 'react';

interface XPConfettiProps {
  trigger: boolean;
  amount: number;
}

const XPConfetti = ({ trigger, amount }: XPConfettiProps) => {
  const [show, setShow] = useState(false);
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    rotation: number;
    rotationSpeed: number;
  }>>([]);

  useEffect(() => {
    if (trigger) {
      setShow(true);
      
      // Create particles from center of screen
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const newParticles = [];
      // VERDE pentru XP, PORTOCALIU pentru recompensă
      const colors = ['#22C55E', '#4ADE80', '#FBBF24', '#F59E0B', '#3B82F6', '#2563EB'];
      
      for (let i = 0; i < 30; i++) {
        const angle = (Math.PI * 2 * i) / 30 + (Math.random() - 0.5) * 0.5;
        const speed = 3 + Math.random() * 4;
        newParticles.push({
          id: i,
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 6 + Math.random() * 8,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10,
        });
      }
      
      setParticles(newParticles);
      
      // Animate particles
      const startTime = Date.now();
      const duration = 2000;
      
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        
        setParticles((prev) =>
          prev.map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.3, // gravity
            vx: p.vx * 0.98, // friction
            rotation: p.rotation + p.rotationSpeed,
          }))
        );
        
        if (progress >= 1) {
          clearInterval(interval);
          setParticles([]);
          setShow(false);
        }
      }, 16);
      
      return () => clearInterval(interval);
    }
  }, [trigger]);

  if (!show || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            borderRadius: '50%',
            transform: `rotate(${particle.rotation}deg)`,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}, 0 0 ${particle.size * 4}px ${particle.color}`,
            opacity: 1 - (Date.now() % 2000) / 2000,
          }}
        />
      ))}
      
      {/* XP Text particles */}
      {particles.slice(0, 5).map((particle, idx) => (
        <div
          key={`text-${particle.id}`}
          className="absolute text-2xl font-bold"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            color: particle.color,
            transform: `translate(-50%, -50%) scale(${1 - (Date.now() % 2000) / 2000})`,
            opacity: 1 - (Date.now() % 2000) / 2000,
            textShadow: `0 0 10px ${particle.color}`,
          }}
        >
          +{Math.floor(amount / 5)}
        </div>
      ))}
    </div>
  );
};

export default XPConfetti;

