import { useEditor } from "../context/EditorContext";

export default function Timeline() {
  const {
    keyframes,
    currentFrame,
    setCurrentFrame,
    isPlaying,
    setIsPlaying,
    joints,
    setJoints,
    setImageOffset,
    setCamera,
  } = useEditor();

  function handleSelectFrame(index) {
    if (isPlaying) setIsPlaying(false);

    const frame = keyframes[index];
    if (!frame) return;

    setCurrentFrame(index);
    setJoints(JSON.parse(JSON.stringify(frame.joints)));
    setImageOffset({ ...frame.offset });
    setCamera({ ...frame.camera });
  }

  return (
    <div className="w-full h-24 bg-neutral-900 border-t border-neutral-800 flex items-center overflow-x-auto px-4 gap-3">

      {keyframes.length === 0 && (
        <div className="text-neutral-500 text-sm pl-2">
          No frames yet — click “Add Frame”
        </div>
      )}

      {keyframes.map((frame, index) => {
        const selected = index === currentFrame;

        return (
          <div
            key={index}
            onClick={() => handleSelectFrame(index)}
            className={`w-16 h-10 flex-shrink-0 rounded cursor-pointer border 
              ${
                selected
                  ? "bg-purple-600 border-purple-400"
                  : "bg-neutral-800 border-neutral-700 hover:bg-neutral-700"
              }
            `}
          />
        );
      })}
    </div>
  );
}
