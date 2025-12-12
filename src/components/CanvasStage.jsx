// ============================================
// CanvasStage.jsx — FINAL WARP-ENABLED VERSION
// ============================================

import {
  Stage,
  Layer,
  Rect,
  Image as KonvaImage,
  Circle,
  Line,
  Group,
} from "react-konva";

import { useEditor } from "../context/EditorContext";
import { useEffect, useRef, useState } from "react";
import { computeLimbWarp } from "../utils/warpEngine";


// MediaPipe pose connections
const POSE_CONNECTIONS = [
  [11, 13], [13, 15],   // Left arm
  [12, 14], [14, 16],   // Right arm
  [11, 12],             // Shoulders
  [11, 23], [12, 24],   // Torso side
  [23, 24],             // Hips
  [23, 25], [25, 27],   // Left leg
  [27, 29], [29, 31],   // Left foot
  [24, 26], [26, 28],   // Right leg
  [28, 30], [30, 32],   // Right foot
];

const JOINT_RADIUS = 6;
const HIT_RADIUS = 16;


export default function CanvasStage({ showToast }) {
  const {
    foreground,
    joints,
    interpolatedJoints,
    imageOffset,
    interpolatedOffset,
    camera,
    interpolatedCamera,
    isPlaying,
    basePose,
    setJoints,
    setImageOffset,
  } = useEditor();

  // Active values (interpolated or live)
  const activeJoints = isPlaying ? interpolatedJoints : joints;
  const activeOffset = isPlaying ? interpolatedOffset : imageOffset;
  const activeCamera = isPlaying ? interpolatedCamera : camera;

  const stageRef = useRef(null);
  const [scale, setScale] = useState(1);

  // Warp cache (to avoid recomputing limbs every re-render)
  const warpCacheRef = useRef({ torso: null, limbs: [] });


  // ============================================
  // Auto-scale canvas down only
  // ============================================
  useEffect(() => {
    function updateScale() {
      const w = window.innerWidth - 260;   // right panel
      const h = window.innerHeight - 180;  // toolbar + timeline

      const scaleX = w / 1920;
      const scaleY = h / 1080;
      const newScale = Math.min(scaleX, scaleY, 1);

      setScale(newScale);
    }

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);


  // ============================================
  // Auto-center person after segmentation or first pose
  // ============================================
  useEffect(() => {
    if (!foreground) return;
    setImageOffset({
      x: 1920 / 2 - 200,
      y: 1080 / 2 - 400,
    });
  }, [foreground]);


  // ============================================
  // DRAGGING LOGIC
  // ============================================
  const [dragIndex, setDragIndex] = useState(null);

  function getPointer() {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const p = stage.getPointerPosition();
    if (!p) return { x: 0, y: 0 };
    return { x: p.x / scale, y: p.y / scale };
  }

  function onMouseDown() {
    if (isPlaying || !activeJoints.length) return;

    const pos = getPointer();
    for (let i = 0; i < activeJoints.length; i++) {
      const j = activeJoints[i];
      const dx = pos.x - j.x;
      const dy = pos.y - j.y;
      if (Math.sqrt(dx * dx + dy * dy) <= HIT_RADIUS) {
        setDragIndex(i);
        return;
      }
    }
  }

  function onMouseMove() {
    if (dragIndex === null || isPlaying) return;

    const pos = getPointer();
    const updated = [...activeJoints];

    const rootL = 23;
    const rootR = 24;

    // Dragging hips → move everything including offset
    if (dragIndex === rootL || dragIndex === rootR) {
      const dx = pos.x - updated[dragIndex].x;
      const dy = pos.y - updated[dragIndex].y;

      for (let i = 0; i < updated.length; i++) {
        updated[i] = { x: updated[i].x + dx, y: updated[i].y + dy };
      }

      setImageOffset({
        x: imageOffset.x + dx,
        y: imageOffset.y + dy,
      });

      setJoints(updated);
      return;
    }

    // Single joint drag
    updated[dragIndex] = { x: pos.x, y: pos.y };
    setJoints(updated);
  }

  function onMouseUp() {
    setDragIndex(null);
  }


  // ============================================
  // CAMERA GROUP TRANSFORM
  // ============================================
  const cameraGroupProps = {
    scaleX: activeCamera.zoom,
    scaleY: activeCamera.zoom,
    offsetX: 960,
    offsetY: 540,
    x: 960 + activeCamera.panX,
    y: 540 + activeCamera.panY,
    rotation: activeCamera.rotate,
  };


  // ============================================
  // WARP COMPUTATION (only in edit mode)
  // ============================================
  let torsoImage = foreground;
  let limbImages = [];

  if (!isPlaying && foreground && activeJoints.length && basePose.length) {
    const warp = computeLimbWarp(foreground, activeJoints, basePose);
    torsoImage = warp.torso;
    limbImages = warp.limbs;
  } else if (isPlaying) {
    // Playback → no warp, only interpolate static foreground
    torsoImage = foreground;
    limbImages = [];
  }


  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="relative w-full h-full flex justify-center items-center">
      <Stage
        ref={stageRef}
        width={1920 * scale}
        height={1080 * scale}
        scaleX={scale}
        scaleY={scale}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
      >
        <Layer>
          <Group {...cameraGroupProps}>
            <Rect x={0} y={0} width={1920} height={1080} fill="black" />

            {/* Torso */}
            {torsoImage && (
              <KonvaImage
                image={torsoImage}
                x={activeOffset.x}
                y={activeOffset.y}
              />
            )}

            {/* Warped limbs */}
            {limbImages.map((limb, i) => (
              <KonvaImage
                key={i}
                image={limb.image}
                x={limb.x + activeOffset.x}
                y={limb.y + activeOffset.y}
                offsetX={limb.pivotX}
                offsetY={limb.pivotY}
                rotation={limb.rotation}
              />
            ))}

            {/* Bones */}
            {activeJoints.length > 0 &&
              POSE_CONNECTIONS.map(([a, b], idx) =>
                activeJoints[a] && activeJoints[b] ? (
                  <Line
                    key={idx}
                    points={[
                      activeJoints[a].x,
                      activeJoints[a].y,
                      activeJoints[b].x,
                      activeJoints[b].y,
                    ]}
                    stroke="#00FFFF"
                    strokeWidth={3}
                  />
                ) : null
              )}

            {/* Joints */}
            {activeJoints.length > 0 &&
              activeJoints.map((j, i) => (
                <Circle
                  key={i}
                  x={j.x}
                  y={j.y}
                  radius={JOINT_RADIUS}
                  fill="#FF0000"
                />
              ))}
          </Group>
        </Layer>
      </Stage>
    </div>
  );
}
