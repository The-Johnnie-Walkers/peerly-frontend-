import React, { useEffect, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Container, ISourceOptions } from '@tsparticles/engine';

interface GoalParticlesProps {
  active: boolean;
}

const GoalParticles: React.FC<GoalParticlesProps> = ({ active }) => {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = async (container?: Container): Promise<void> => {
    // console.log(container);
  };

  const options: ISourceOptions = {
    fpsLimit: 60,
    interactivity: {
      events: {
        onclick: { enable: false },
        onhover: { enable: false },
        resize: { enable: true },
      },
    },
    particles: {
      color: {
        value: ["#FFD700", "#FF4500", "#FFFFFF", "#00BFFF"],
      },
      move: {
        direction: "top",
        enable: true,
        outModes: {
          default: "destroy",
        },
        random: true,
        speed: { min: 3, max: 7 },
        straight: false,
      },
      number: {
        density: {
          enable: true,
        },
        value: 80,
      },
      opacity: {
        value: { min: 0.3, max: 0.8 },
        animation: {
          enable: true,
          speed: 1,
          startValue: "random",
        }
      },
      shape: {
        type: "circle",
      },
      size: {
        value: { min: 1, max: 4 },
      },
      life: {
        duration: {
          sync: false,
          value: 2,
        },
        count: 1,
      }
    },
    detectRetina: true,
    fullScreen: {
      enable: false,
      zIndex: 10,
    }
  };

  if (!init || !active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <Particles
        id="tsparticles-goal"
        particlesLoaded={particlesLoaded}
        options={options}
        className="w-full h-full"
      />
    </div>
  );
};

export default GoalParticles;
