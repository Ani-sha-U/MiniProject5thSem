export function base64ToImage(b64) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = "data:image/png;base64," + b64;
  });
}
