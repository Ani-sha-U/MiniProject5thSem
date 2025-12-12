import { useState, useEffect, useRef } from "react";
import { EditorProvider, useEditor } from "./context/EditorContext";

import CanvasStage from "./components/CanvasStage";
import Timeline from "./components/Timeline";
import TopToolbar from "./components/TopToolbar";
import RightPanel from "./components/RightPanel";
import PlayButton from "./components/PlayButton";
import Toast from "./components/Toast";

import { lerp } from "./utils/tween";
import { initPoseDetector } from "./utils/poseDetector";


// ==============================================
// INTERNAL APP (playback loop lives here)
// ==============================================
function AppInner() {
  const {
    keyframes,
    isPlaying,
    setCurrentFrame,

    setInterpolatedJoints,
    setInterpolatedOffset,
    setInterpolatedCamera,

    setGlobalPoseDetector,
  } = useEditor();

  const [toast, setToast] = useState(null);

  const requestRef = useRef(null);
  const playbackStartRef = useRef(null);


  // ==============================================
  // INITIALIZE MEDIAPIPE POSE (ONCE)
  // ==============================================
  useEffect(() => {
    async function loadPose() {
      const detector = await initPoseDetector();
      setGlobalPoseDetector(detector);
      console.log("%cMediaPipe Pose initialized", "color:#8ff");
    }
    loadPose();
  }, []);


  // ==============================================
  // PLAYBACK LOOP
  // ==============================================
  useEffect(() => {
    if (!isPlaying || keyframes.length < 2) return;

    playbackStartRef.current = performance.now();

    const FRAME_DURATION = 800;
    const TOTAL = keyframes.length;

    const animate = (timestamp) => {
      const elapsed = timestamp - playbackStartRef.current;
      const totalAnimationDuration = FRAME_DURATION * TOTAL;

      let t = (elapsed % totalAnimationDuration) / FRAME_DURATION;
      let frameIndex = Math.floor(t);
      let localT = t - frameIndex;

      const nextIndex = (frameIndex + 1) % TOTAL;

      const A = keyframes[frameIndex];
      const B = keyframes[nextIndex];

      // ---- JOINTS ----
      if (A.joints && B.joints && A.joints.length) {
        setInterpolatedJoints(
          A.joints.map((p, i) => ({
            x: lerp(p.x, B.joints[i].x, localT),
            y: lerp(p.y, B.joints[i].y, localT),
          }))
        );
      }

      // ---- OFFSET ----
      setInterpolatedOffset({
        x: lerp(A.offset.x, B.offset.x, localT),
        y: lerp(A.offset.y, B.offset.y, localT),
      });

      // ---- CAMERA ----
      setInterpolatedCamera({
        zoom: lerp(A.camera.zoom, B.camera.zoom, localT),
        panX: lerp(A.camera.panX, B.camera.panX, localT),
        panY: lerp(A.camera.panY, B.camera.panY, localT),
        rotate: lerp(A.camera.rotate, B.camera.rotate, localT),
      });

      setCurrentFrame(frameIndex);
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);

  }, [isPlaying, keyframes]);


  // ==============================================
  // RENDER
  // ==============================================
  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden bg-black">

      <TopToolbar showToast={setToast} />

      <div className="flex flex-1">
        <div className="flex-1 flex justify-center items-center">
          <CanvasStage showToast={setToast} />
        </div>

        <RightPanel />
      </div>

      <Timeline />
      <PlayButton showToast={setToast} />

      {toast && (
        <Toast message={toast} onClose={() => setToast(null)} />
      )}
    </div>
  );
}


// ==============================================
// MAIN APP WRAPPER
// ==============================================
export default function App() {
  return (
    <EditorProvider>
      <AppInner />
    </EditorProvider>
  );
}
