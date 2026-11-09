import { useEffect, useState } from 'react';
import BedroomExperience from './experiences/BedroomExperience';
import AquariumExperience from './aquarium/App';
import { aquariumHandTracker } from './aquarium/services/HandTracker';
import './aquarium/index.css';

type Experience = 'bedroom' | 'aquarium';

export default function App() {
  const [activeExperience, setActiveExperience] = useState<Experience>('bedroom');
  const [isTransitionCoverVisible, setIsTransitionCoverVisible] = useState(false);

  const handleEnterAquarium = () => {
    setIsTransitionCoverVisible(true);
    window.setTimeout(() => {
      setActiveExperience('aquarium');
      window.setTimeout(() => setIsTransitionCoverVisible(false), 180);
    }, 520);
  };

  // Establish the Tasks Vision runtime before either scene can initialise
  // its own tracker. Bedroom also awaits this same promise on user activation.
  useEffect(() => {
    void aquariumHandTracker.prepareModel().catch((error) => {
      console.warn('Aquarium hand model pre-initialisation failed:', error);
    });
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0">
        {activeExperience === 'bedroom'
          ? <BedroomExperience onEnterAquarium={handleEnterAquarium} />
          : <AquariumExperience />}
      </div>

      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-[150] bg-black transition-opacity duration-500 ${
          isTransitionCoverVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Temporary scene selector retained for testing and direct scene access. */}
      <nav
        aria-label="Experience selector"
        className="fixed right-3 top-1/2 z-[100] -translate-y-1/2 rounded-xl border border-cyan-300/20 bg-slate-950/85 p-2 text-slate-100 shadow-xl backdrop-blur-md"
      >
        <p className="px-2 pb-2 text-center text-[9px] font-mono tracking-[0.18em] text-cyan-200/60">
          SCENE
        </p>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            aria-pressed={activeExperience === 'bedroom'}
            onClick={() => setActiveExperience('bedroom')}
            className={`rounded-lg px-3 py-2 text-xs transition-colors ${
              activeExperience === 'bedroom'
                ? 'border border-cyan-300/40 bg-cyan-400/20 text-cyan-100'
                : 'border border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-100'
            }`}
          >
            Bedroom
          </button>
          <button
            type="button"
            aria-pressed={activeExperience === 'aquarium'}
            onClick={() => setActiveExperience('aquarium')}
            className={`rounded-lg px-3 py-2 text-xs transition-colors ${
              activeExperience === 'aquarium'
                ? 'border border-cyan-300/40 bg-cyan-400/20 text-cyan-100'
                : 'border border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-100'
            }`}
          >
            Aquarium
          </button>
        </div>
      </nav>
    </div>
  );
}
