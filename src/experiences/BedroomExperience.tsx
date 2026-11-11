/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { ExperienceScene } from '../scene/ExperienceScene';
import { handTracker } from '../tracking/handTracker';
import { getSharedCameraStream } from '../shared/sharedCamera';
import { soundscape } from '../audio/soundscape';
import { InstructionDock } from '../components/InstructionDock';
import { TopBar } from '../components/TopBar';
import { NarrationOverlay } from '../components/NarrationOverlay';
import { ExperienceStage, HandGestureState } from '../types';
import { AppLanguage, translate } from '../i18n';

interface BedroomExperienceProps {
  onEnterAquarium: () => void;
  language: AppLanguage;
}

export default function App({ onEnterAquarium, language }: BedroomExperienceProps) {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ExperienceScene | null>(null);
  const languageRef = useRef(language);
  languageRef.current = language;

  const [currentStage, setCurrentStage] = useState<ExperienceStage>('stage1_acknowledgement');
  const [currentSubstate, setCurrentSubstate] = useState<string>('idle_waiting_wave');
  const [instructionText, setInstructionText] = useState<string>('Action: Wave hand or click "Wave to Begin"');
  const [subtitle, setSubtitle] = useState<string | null>(null);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [handState, setHandState] = useState<HandGestureState | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Initialize Three.js WebGL Experience Scene
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const scene = new ExperienceScene(canvasMountRef.current, {
      onStageChange: (stage, substate) => {
        setCurrentStage(stage);
        setCurrentSubstate(substate);
      },
      onInstructionChange: (text) => {
        setInstructionText(translate(text, languageRef.current));
      },
      onNarrationSubtitle: (text) => {
        setSubtitle(text ? translate(text, languageRef.current) : null);
      },
      onEnterAquarium,
    });

    sceneRef.current = scene;

    // Connect hand tracking callback to 3D scene
    handTracker.setCallback((state) => {
      setHandState(state);
      scene.handleHandGesture(state);
    });

    // If the user already enabled the webcam in the other experience,
    // resume gesture tracking automatically without another permission click.
    if (getSharedCameraStream()) {
      handTracker.start().then((started) => setIsCameraActive(started));
    }

    return () => {
      scene.dispose();
      sceneRef.current = null;
      handTracker.stop();
    };
  }, [language]);

  useEffect(() => {
    soundscape.setLanguage(language);
    if (sceneRef.current) sceneRef.current.setLanguage(language);
    setInstructionText((current) => translate(current, language));
    setSubtitle((current) => current ? translate(current, language) : null);
  }, [language]);

  // Toggle Webcam Hand Tracking
  const handleToggleCamera = useCallback(async () => {
    if (isCameraActive) {
      handTracker.stop(true);
      setIsCameraActive(false);
      setHandState(null);
    } else {
      const granted = await handTracker.start();
      if (granted) {
        setIsCameraActive(true);
      } else {
        alert('Webcam access was not granted or is unavailable on this device. You can use mouse gestures anytime!');
      }
    }
  }, [isCameraActive]);

  // Toggle Audio Mute
  const handleToggleMute = useCallback(() => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    soundscape.setMuted(nextMute);
  }, [isMuted]);

  // Reset Experience
  const handleReset = useCallback(() => {
    if (sceneRef.current) {
      sceneRef.current.resetExperience();
    }
  }, []);

  // Wave Hand action trigger (Stage 1)
  const handleTriggerWave = useCallback(() => {
    handTracker.triggerManualWave();
    if (sceneRef.current) {
      sceneRef.current.triggerStartWave();
    }
  }, []);

  // Return Orb to dock trigger (Stage 3)
  const handleDockOrb = useCallback(() => {
    if (sceneRef.current) {
      sceneRef.current.dockTheOrb();
    }
  }, []);

  // Eat Film ritual (Stage 3)
  const handleEatFilm = useCallback(() => {
    if (sceneRef.current) {
      sceneRef.current.triggerEatRitual();
    }
  }, []);

  // Dissolve Film in water glass ritual (Stage 3)
  const handleDissolveFilm = useCallback(() => {
    if (sceneRef.current) {
      sceneRef.current.triggerDissolveRitual();
    }
  }, []);

  // Jump to specific stage for previewing / reviewing
  const handleSelectStage = useCallback((stage: ExperienceStage) => {
    if (!sceneRef.current) return;
    if (stage === 'stage1_acknowledgement') {
      sceneRef.current.resetExperience();
    } else if (stage === 'stage2_encouragement') {
      if (!sceneRef.current.dockAndOrb.isMaterialized) {
        sceneRef.current.dockAndOrb.materialize();
      }
      sceneRef.current.transitionToStage2();
    } else if (stage === 'stage3_closure') {
      if (!sceneRef.current.dockAndOrb.isMaterialized) {
        sceneRef.current.dockAndOrb.materialize();
      }
      sceneRef.current.transitionToStage3();
    }
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-stone-950 select-none">
      {/* 3D WebGL Canvas Container: Dedicated isolated ref container as required by Three.js skill */}
      <div 
        ref={canvasMountRef} 
        className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing w-full h-full"
      />

      {/* Top Header / Spec & Navigation */}
      <TopBar 
        language={language}
        currentStage={currentStage} 
        onSelectStage={handleSelectStage} 
      />

      {/* Synchronized Voice & Poetic Subtitle Overlay */}
      <NarrationOverlay subtitle={subtitle} />

      {/* Ergonomic Collapsible Bottom Control Dock */}
      <InstructionDock
        language={language}
        currentStage={currentStage}
        currentSubstate={currentSubstate}
        instructionText={instructionText}
        handState={handState}
        isCameraActive={isCameraActive}
        isMuted={isMuted}
        onToggleCamera={handleToggleCamera}
        onToggleMute={handleToggleMute}
        onReset={handleReset}
        onTriggerWave={handleTriggerWave}
        onDockOrb={handleDockOrb}
        onEatFilm={handleEatFilm}
        onDissolveFilm={handleDissolveFilm}
      />
    </div>
  );
}
