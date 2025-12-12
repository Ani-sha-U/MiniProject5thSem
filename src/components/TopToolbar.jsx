import { useState } from "react";
import { useEditor } from "../context/EditorContext";
import { initPoseDetector, detectPose } from "../utils/poseDetector";

export default function TopToolbar({ showToast }) {
  const {
    setImage,
    setImageBitmap,
    setForeground,
    setMask,
    setJoints,
    setBasePose,
    setImageOffset,
    globalPoseDetector,
    setGlobalPoseDetector,
    camera,
    imageOffset,
    addKeyframe,
    joints,
  } = useEditor();

  const [loadingSegment, setLoadingSegment] = useState(false);
  const [loadingPose, setLoadingPose] = useState(false);

  // ============================================================
  // 1) LOAD IMAGE → <img> and ImageBitmap
  // ============================================================
  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const bitmap = await createImageBitmap(file);

      const img = new Image();
      img.src = URL.createObjectURL(file);

      img.onload = () => {
        setImage(img);
        setImageBitmap(bitmap);
        showToast("Image loaded");
      };
    } catch (err) {
      console.error(err);
      showToast("Failed to load image");
    }
  }

  // ============================================================
  // 2) SEGMENTATION (FastAPI SAM2 or MP)
  // ============================================================
  async function handleSegment() {
    if (!imageBitmap) return showToast("Upload an image first");

    setLoadingSegment(true);

    try {
      const blob = await (await fetch(image.src)).blob();
      const formData = new FormData();
      formData.append("file", blob, "frame.png");

      const res = await fetch("http://127.0.0.1:8000/segment", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      const fg = new Image();
      fg.src = "data:image/png;base64," + data.foreground;

      fg.onload = () => {
        setForeground(fg);
        setMask(data.mask);
        showToast("Segmentation complete");

        // Auto-center
        setImageOffset({
          x: 1920 / 2 - 200,
          y: 1080 / 2 - 400,
        });
      };
    } catch (err) {
      console.error(err);
      showToast("Segmentation failed");
    }

    setLoadingSegment(false);
  }

  // ============================================================
  // 3) DETECT POSE (Classic MediaPipe)
  // ============================================================
  async function handleDetectPose() {
    if (!imageBitmap) return showToast("Upload image first");

    setLoadingPose(true);

    try {
      let detector = globalPoseDetector;

      // Initialize if needed
      if (!detector) {
        detector = await initPoseDetector();
        setGlobalPoseDetector(detector);
      }

      // Attach callback (register fresh handler)
      detector.setCallback((results) => {
        if (!results.poseLandmarks) {
          showToast("Pose not detected");
          setLoadingPose(false);
          return;
        }

        // Convert normalized → 1920×1080
        const pts = results.poseLandmarks.map((kp) => ({
          x: kp.x * 1920,
          y: kp.y * 1080,
        }));

        setJoints(pts);
        setBasePose(JSON.parse(JSON.stringify(pts)));

        // Auto-center person
        setImageOffset({
          x: 1920 / 2 - 200,
          y: 1080 / 2 - 400,
        });

        showToast("Pose detected!");
        setLoadingPose(false);
      });

      // Run detection on ImageBitmap
      await detectPose(imageBitmap);

    } catch (err) {
      console.error("POSE ERROR:", err);
      showToast("Pose detection failed");
      setLoadingPose(false);
    }
  }

  // ============================================================
  // 4) ADD KEYFRAME
  // ============================================================
  function handleAddFrame() {
    if (!joints || joints.length === 0)
      return showToast("Detect pose first");

    addKeyframe({
      joints: JSON.parse(JSON.stringify(joints)),
      offset: { ...imageOffset },
      camera: { ...camera },
    });

    showToast("Frame added");
  }

  // ============================================================
  // UI
  // ============================================================
  return (
    <div className="w-full bg-neutral-900 p-3 border-b border-neutral-800 flex items-center gap-4">

      {/* LOAD IMAGE */}
      <label className="px-4 py-2 bg-purple-600 rounded cursor-pointer hover:bg-purple-700">
        Load Image
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </label>

      {/* SEGMENT PERSON */}
      <button
        onClick={handleSegment}
        disabled={loadingSegment}
        className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700"
      >
        {loadingSegment ? "Segmenting..." : "Segment Person"}
      </button>

      {/* DETECT POSE */}
      <button
        onClick={handleDetectPose}
        disabled={loadingPose}
        className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700"
      >
        {loadingPose ? "Detecting Pose…" : "Detect Pose"}
      </button>

      {/* ADD FRAME */}
      <button
        onClick={handleAddFrame}
        className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700"
      >
        Add Frame
      </button>

    </div>
  );
}
