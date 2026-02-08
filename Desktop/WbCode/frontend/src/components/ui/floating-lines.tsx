import React, { useEffect, useRef } from 'react';

interface FloatingLinesProps {
  linesGradient?: string[];
  animationSpeed?: number;
  interactive?: boolean;
  bendRadius?: number;
  bendStrength?: number;
  mouseDamping?: number;
  parallax?: boolean;
  parallaxStrength?: number;
}

export const FloatingLines: React.FC<FloatingLinesProps> = ({
  linesGradient = ["#39bd14", "#2F4BC0", "#47f55b"],
  animationSpeed = 1,
  interactive = true,
  bendRadius = 5,
  bendStrength = -0.5,
  mouseDamping = 0.05,
  parallax = true,
  parallaxStrength = 0.2
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const mousePosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    linesGradient.forEach((color, index) => {
      gradient.addColorStop(index / (linesGradient.length - 1), color);
    });

    // Lines configuration
    const numLines = 20;
    const lines: Array<{
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      vx: number;
      vy: number;
    }> = [];

    for (let i = 0; i < numLines; i++) {
      lines.push({
        x1: Math.random() * canvas.width,
        y1: Math.random() * canvas.height,
        x2: Math.random() * canvas.width,
        y2: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5 * animationSpeed,
        vy: (Math.random() - 0.5) * 0.5 * animationSpeed
      });
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      mousePosRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    if (interactive) {
      container.addEventListener('mousemove', handleMouseMove);
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;

      lines.forEach((line) => {
        // Update position
        line.x1 += line.vx;
        line.y1 += line.vy;
        line.x2 += line.vx * 0.8;
        line.y2 += line.vy * 0.8;

        // Bounce off edges
        if (line.x1 < 0 || line.x1 > canvas.width) line.vx *= -1;
        if (line.y1 < 0 || line.y1 > canvas.height) line.vy *= -1;
        if (line.x2 < 0 || line.x2 > canvas.width) line.vx *= -1;
        if (line.y2 < 0 || line.y2 > canvas.height) line.vy *= -1;

        // Mouse interaction
        if (interactive) {
          const dx1 = mousePosRef.current.x - line.x1;
          const dy1 = mousePosRef.current.y - line.y1;
          const dx2 = mousePosRef.current.x - line.x2;
          const dy2 = mousePosRef.current.y - line.y2;
          const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
          const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

          if (dist1 < 100) {
            line.vx += (dx1 / dist1) * mouseDamping;
            line.vy += (dy1 / dist1) * mouseDamping;
          }
          if (dist2 < 100) {
            line.vx += (dx2 / dist2) * mouseDamping;
            line.vy += (dy2 / dist2) * mouseDamping;
          }
        }

        // Draw line with bend
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        
        const midX = (line.x1 + line.x2) / 2;
        const midY = (line.y1 + line.y2) / 2;
        const controlX = midX + (Math.random() - 0.5) * bendRadius * bendStrength;
        const controlY = midY + (Math.random() - 0.5) * bendRadius * bendStrength;
        
        ctx.quadraticCurveTo(controlX, controlY, line.x2, line.y2);
        ctx.stroke();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (interactive && container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [linesGradient, animationSpeed, interactive, bendRadius, bendStrength, mouseDamping, parallax, parallaxStrength]);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
