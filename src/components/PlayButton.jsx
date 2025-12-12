import { useEditor } from "../context/EditorContext";

export default function PlayButton({ showToast }) {
  const { isPlaying, setIsPlaying, keyframes } = useEditor();

  function handleTogglePlay() {
    if (keyframes.length < 2) {
      showToast("Add at least 2 frames to play animation");
      return;
    }
    setIsPlaying(!isPlaying);
  }

  return (
    <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2 z-50">
      <button
        onClick={handleTogglePlay}
        className={`
          w-16 h-16 rounded-full flex items-center justify-center 
          text-white text-3xl font-bold shadow-lg transition 
          ${
            isPlaying
              ? "bg-red-600 hover:bg-red-700"
              : "bg-purple-600 hover:bg-purple-700"
          }
        `}
      >
        {isPlaying ? "⏸" : "▶"}
      </button>
    </div>
  );
}
