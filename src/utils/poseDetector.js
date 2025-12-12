/**
 * Classic MediaPipe Pose loader + wrapper.
 * Works reliably with ImageBitmap input.
 */

let detectorInstance = null;

// Load script once
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.body.appendChild(s);
  });
}

// =============================================
// INITIALIZE POSE (NO CALLBACK ATTACHED YET)
// =============================================
export async function initPoseDetector() {
  await loadScript(
    "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675471629/pose.js"
  );
  await loadScript(
    "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"
  );
  await loadScript(
    "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"
  );

  const Pose = window.Pose;
  if (!Pose) {
    console.error("❌ MediaPipe Pose failed to load");
    return null;
  }

  detectorInstance = new Pose({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675471629/${file}`,
  });

  detectorInstance.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  detectorInstance._callback = null;

  detectorInstance.setCallback = function (fn) {
    this._callback = fn;
    this.onResults(fn);
  };

  return detectorInstance;
}

// =============================================
// DETECT POSE
// =============================================
export async function detectPose(bitmap) {
  if (!detectorInstance) {
    console.error("❌ Pose detector not initialized");
    return;
  }
  if (!bitmap) {
    console.error("❌ No ImageBitmap provided");
    return;
  }

  try {
    await detectorInstance.send({ image: bitmap });
  } catch (err) {
    console.error("❌ Pose detection failure:", err);
  }
}
