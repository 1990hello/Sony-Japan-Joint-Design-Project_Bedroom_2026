/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HandGestureState } from '../services/HandTracker';

interface HandIndicatorProps {
  gestureState: HandGestureState | null;
  isOverOrb: boolean;
  twoHandsDwellProgress?: number;
  isTwoHandsDetected?: boolean;
  secondHandLandmarks?: { x: number; y: number; z: number }[];
}

export const HandIndicator: React.FC<HandIndicatorProps> = ({
  gestureState,
  twoHandsDwellProgress = 0,
  isTwoHandsDetected = false,
  secondHandLandmarks,
}) => {
  if (!gestureState || !gestureState.isHandDetected) {
    return null;
  }

  const { x, y, isPinching } = gestureState;

  const showReturnProgress = isTwoHandsDetected && twoHandsDwellProgress > 0.01 && !!secondHandLandmarks?.[0] && !!gestureState.allLandmarks?.[0];
  const firstWrist = gestureState.allLandmarks?.[0];
  const firstPalmBase = gestureState.allLandmarks?.[9];
  const secondWrist = secondHandLandmarks?.[0];
  const secondPalmBase = secondHandLandmarks?.[9];
  const firstPalm = firstWrist && firstPalmBase
    ? { x: (firstWrist.x + firstPalmBase.x) / 2, y: (firstWrist.y + firstPalmBase.y) / 2 }
    : null;
  const secondPalm = secondWrist && secondPalmBase
    ? { x: (secondWrist.x + secondPalmBase.x) / 2, y: (secondWrist.y + secondPalmBase.y) / 2 }
    : null;
  const midpoint = firstPalm && secondPalm
    ? { x: (firstPalm.x + secondPalm.x) / 2, y: (firstPalm.y + secondPalm.y) / 2 }
    : { x: 0.5, y: 0.5 };
  const remaining = Math.max(0, 1 - twoHandsDwellProgress);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{
          left: `${(x * 100).toFixed(2)}%`,
          top: `${(y * 100).toFixed(2)}%`,
        }}
      >
        {/* Match Bedroom cursor: fixed amber ring, white centre, dark outline.
            Pinching scales the cursor slightly without moving its palm anchor. */}
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-950 bg-amber-300/20 transition-transform duration-100"
          style={{
            boxShadow: '0 0 0 1px rgba(255, 200, 87, 0.98), 0 0 12px rgba(255, 200, 87, 0.78), 0 0 24px rgba(255, 200, 87, 0.35)',
            transform: isPinching ? 'scale(0.88)' : 'scale(1)',
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full bg-white border border-slate-950"
            style={{ boxShadow: '0 0 6px rgba(255,255,255,0.95)' }}
          />
        </div>


      </div>

      {showReturnProgress && (
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
          style={{ left: `${(midpoint.x * 100).toFixed(2)}%`, top: `${(midpoint.y * 100).toFixed(2)}%` }}
        >
          <div
            className="relative flex h-14 w-14 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(rgba(253,224,71,0.98) ${twoHandsDwellProgress * 360}deg, rgba(251,191,36,0.18) 0deg)`,
              filter: 'drop-shadow(0 0 10px rgba(251,191,36,0.4))',
            }}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-950 bg-slate-950/95 text-[11px] font-mono-display text-amber-100">
              {(remaining).toFixed(1)}s
            </div>
          </div>
          <span className="whitespace-nowrap rounded-full border border-amber-300/50 bg-slate-950/90 px-2.5 py-1 text-[9px] font-mono-display tracking-wider text-amber-100 shadow-lg">
            KEEP HOLDING · RETURN TO ORB
          </span>
        </div>
      )}
    </div>
  );
};
