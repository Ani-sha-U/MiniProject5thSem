import { createContext, useContext, useState } from "react";

const EditorContext = createContext(null);

export function EditorProvider({ children }) {

  // Image + segmentation
  const [image, setImage] = useState(null);
  const [imageBitmap, setImageBitmap] = useState(null);
  const [foreground, setForeground] = useState(null);
  const [mask, setMask] = useState(null);

  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });

  // Pose
  const [joints, setJoints] = useState([]);
  const [basePose, setBasePose] = useState([]);

  // Playback interpolation values
  const [interpolatedJoints, setInterpolatedJoints] = useState([]);
  const [interpolatedOffset, setInterpolatedOffset] = useState({ x: 0, y: 0 });
  const [interpolatedCamera, setInterpolatedCamera] = useState({
    zoom: 1,
    panX: 0,
    panY: 0,
    rotate: 0,
  });

  // Camera
  const [camera, setCamera] = useState({
    zoom: 1,
    panX: 0,
    panY: 0,
    rotate: 0,
  });

  // Keyframes
  const [keyframes, setKeyframes] = useState([]);
  const [currentFrame, setCurrentFrame] = useState(0);

  function addKeyframe(frame) {
    setKeyframes((prev) => [...prev, frame]);
  }

  // Playback
  const [isPlaying, setIsPlaying] = useState(false);

  // MediaPipe Pose detector (classic)
  const [globalPoseDetector, setGlobalPoseDetector] = useState(null);


  const value = {
    image,
    setImage,
    imageBitmap,
    setImageBitmap,

    foreground,
    setForeground,
    mask,
    setMask,

    imageOffset,
    setImageOffset,

    joints,
    setJoints,
    basePose,
    setBasePose,

    interpolatedJoints,
    setInterpolatedJoints,
    interpolatedOffset,
    setInterpolatedOffset,
    interpolatedCamera,
    setInterpolatedCamera,

    camera,
    setCamera,

    keyframes,
    setKeyframes,
    addKeyframe,
    currentFrame,
    setCurrentFrame,

    isPlaying,
    setIsPlaying,

    globalPoseDetector,
    setGlobalPoseDetector,
  };

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  return useContext(EditorContext);
}
