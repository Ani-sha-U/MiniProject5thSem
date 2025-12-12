// ==============================================
// warpEngine.js — FINAL W3-A LIMB WARP ENGINE
// ==============================================
//
// Computes rigid rectangular limb cutouts and rotates
// them relative to the basePose.
//
// Output:
//   {
//     torso: HTMLImageElement,
//     limbs: [
//       {
//         image: HTMLImageElement,
//         x, y,            // world position of limb rect
//         rotation,        // degrees
//         pivotX, pivotY   // pivot in local rect coordinates
//       }
//     ]
//   }
//
// Notes:
//
// 1. Torso is NOT warped in W3-A — only limbs.
// 2. Warp uses ORIGINAL basePose angles as the anchor.
// 3. The foreground image is assumed to be pre-segmented.
// 4. Coordinates are always in 1920×1080 world space.
//
// ==============================================


export function computeLimbWarp(foreground, joints, basePose) {
  if (!foreground || !joints || !basePose) {
    return { torso: foreground, limbs: [] };
  }

  if (!joints.length || !basePose.length) {
    return { torso: foreground, limbs: [] };
  }

  const limbs = [];

  // ------------------------------------------
  // Internal helper to create rect cutout
  // ------------------------------------------
  function createLimb(aIndex, bIndex) {
    const A = joints[aIndex];
    const B = joints[bIndex];
    const baseA = basePose[aIndex];
    const baseB = basePose[bIndex];

    if (!A || !B || !baseA || !baseB) return null;

    // Current vector
    const dx = B.x - A.x;
    const dy = B.y - A.y;
    const len = Math.sqrt(dx * dx + dy * dy);

    // Base vector
    const bdx = baseB.x - baseA.x;
    const bdy = baseB.y - baseA.y;
    const baseLen = Math.sqrt(bdx * bdx + bdy * bdy);

    if (len < 2 || baseLen < 2) return null;

    // Angle differences
    const angleNow = Math.atan2(dy, dx);
    const angleBase = Math.atan2(bdy, bdx);
    let angleDelta = (angleNow - angleBase) * (180 / Math.PI);

    if (isNaN(angleDelta)) angleDelta = 0;

    // Limb rectangle
    const thickness = 35;                  // constant-width limb
    const minX = A.x - thickness;          // left padding
    const minY = A.y - thickness;          // top padding
    const width = len + thickness * 2;
    const height = thickness * 2;

    // Offscreen canvas
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, width);
    canvas.height = Math.max(1, height);

    const ctx = canvas.getContext("2d");

    ctx.drawImage(
      foreground,
      minX,
      minY,
      width,
      height,
      0,
      0,
      width,
      height
    );

    // Convert buffer → image
    const img = new Image();
    img.src = canvas.toDataURL("image/png");

    return {
      image: img,
      x: minX,
      y: minY,
      rotation: angleDelta,
      pivotX: A.x - minX,
      pivotY: A.y - minY,
    };
  }

  // ------------------------------------------
  // Limb joint pairs (W3-A stable set)
  // ------------------------------------------
  const LIMB_PAIRS = [
    [11, 13], [13, 15], // Left arm
    [12, 14], [14, 16], // Right arm
    [23, 25], [25, 27], // Left leg
    [24, 26], [26, 28], // Right leg
  ];

  for (const [a, b] of LIMB_PAIRS) {
    const limb = createLimb(a, b);
    if (limb) limbs.push(limb);
  }

  return {
    torso: foreground, // no warp for torso
    limbs,
  };
}


// ----------------------------------------------------
// The fallback function used by CanvasStage during playback
// ----------------------------------------------------
export function warpImage(foreground, joints) {
  // In W3-A playback mode → return full image untouched
  return foreground;
}
