import type React from "react";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { SCENE_DURATIONS, TRANSITION_DURATIONS } from "./constants";
import { S01_Concept } from "./scenes/S01_Concept";
import { S02_AppIntro } from "./scenes/S02_AppIntro";
import { S03_Brilliance } from "./scenes/S03_Brilliance";
import { S04_Analysis } from "./scenes/S04_Analysis";
import { S05_Brand } from "./scenes/S05_Brand";

export const Trailer: React.FC = () => {
  return (
    <TransitionSeries>
      {/* ───── SLIDE 1: THE CONCEPT ───── */}
      <TransitionSeries.Sequence
        durationInFrames={SCENE_DURATIONS.S01_Concept}
      >
        <S01_Concept />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATIONS.fade })}
      />

      {/* ───── SLIDE 2: THE APP (Grand Intro) ───── */}
      <TransitionSeries.Sequence
        durationInFrames={SCENE_DURATIONS.S02_AppIntro}
      >
        <S02_AppIntro />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATIONS.fade })}
      />

      {/* ───── SLIDE 3: THE BRILLIANCE ───── */}
      <TransitionSeries.Sequence
        durationInFrames={SCENE_DURATIONS.S03_Brilliance}
      >
        <S03_Brilliance />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATIONS.fade })}
      />

      {/* ───── SLIDE 4: THE ANALYSIS ───── */}
      <TransitionSeries.Sequence
        durationInFrames={SCENE_DURATIONS.S04_Analysis}
      >
        <S04_Analysis />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATIONS.fade })}
      />

      {/* ───── SLIDE 5: THE BRAND ───── */}
      <TransitionSeries.Sequence
        durationInFrames={SCENE_DURATIONS.S05_Brand}
      >
        <S05_Brand />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
