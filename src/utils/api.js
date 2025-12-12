export async function segmentImage(file) {
  const formData = new FormData();
  formData.append("file", file);

  let res;
  try {
    res = await fetch("http://127.0.0.1:8000/segment", {
      method: "POST",
      body: formData,
    });
  } catch (err) {
    throw new Error("BACKEND_OFFLINE");
  }

  if (!res.ok) throw new Error("Segmentation failed");

  const json = await res.json();
  if (json.error) throw new Error(json.error);

  return json;
}
