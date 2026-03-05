import { Composition, Folder } from "remotion";
import { FPS, WIDTH, HEIGHT, SCENE_DURATIONS } from "./constants";
import { Trailer } from "./Trailer";
import { S01_Concept } from "./scenes/S01_Concept";
import { S02_AppIntro } from "./scenes/S02_AppIntro";
import { S03_Brilliance } from "./scenes/S03_Brilliance";
import { S04_Analysis } from "./scenes/S04_Analysis";
import { S05_Brand } from "./scenes/S05_Brand";

// Total trailer duration:
// Sum of all scene durations minus transition overlaps
// Transitions: fade(15) + wipe(20) + fade(15) + fade(15) = 65
const TOTAL_SCENE_FRAMES = Object.values(SCENE_DURATIONS).reduce(
  (a, b) => a + b,
  0
);
const TOTAL_TRANSITION_OVERLAP = 15 + 20 + 15 + 15;
const TRAILER_DURATION = TOTAL_SCENE_FRAMES - TOTAL_TRANSITION_OVERLAP;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Full trailer */}
      <Composition
        id="ReplayChessTrailer"
        component={Trailer}
        durationInFrames={TRAILER_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />

      {/* Individual scenes for testing */}
      <Folder name="Scenes">
        <Composition
          id="S01-Concept"
          component={S01_Concept}
          durationInFrames={SCENE_DURATIONS.S01_Concept}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="S02-AppIntro"
          component={S02_AppIntro}
          durationInFrames={SCENE_DURATIONS.S02_AppIntro}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="S03-Brilliance"
          component={S03_Brilliance}
          durationInFrames={SCENE_DURATIONS.S03_Brilliance}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="S04-Analysis"
          component={S04_Analysis}
          durationInFrames={SCENE_DURATIONS.S04_Analysis}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="S05-Brand"
          component={S05_Brand}
          durationInFrames={SCENE_DURATIONS.S05_Brand}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
      </Folder>
    </>
  );
};
