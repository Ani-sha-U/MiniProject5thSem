import { useEditor } from "../context/EditorContext";

export default function RightPanel() {
  const {
    foreground,
    joints = [],
    currentFrame,
    camera,
    setCamera,
  } = useEditor();

  const updateCamera = (field, value) => {
    setCamera({
      ...camera,
      [field]: value,
    });
  };

  return (
    <div className="w-64 bg-gray-950 border-l border-gray-800 p-4 text-sm flex flex-col gap-6">

      <div>
        <h2 className="text-brandPurple font-semibold mb-2">Debug Info</h2>

        <div className="text-gray-300">
          <div>
            <span className="text-gray-400">Segmentation: </span>
            {foreground ? (
              <span className="text-green-400">Yes</span>
            ) : (
              <span className="text-red-400">No</span>
            )}
          </div>

          <div>
            <span className="text-gray-400">Joints: </span>
            <span className="text-white">{joints.length}</span>
          </div>

          <div>
            <span className="text-gray-400">Current Frame: </span>
            <span className="text-white">{currentFrame}</span>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-brandPurple font-semibold mb-2">Camera</h2>

        <div className="mb-4">
          <label className="text-gray-300 block mb-1">
            Zoom ({camera.zoom.toFixed(2)})
          </label>
          <input
            type="range"
            min="0.2"
            max="3"
            step="0.01"
            value={camera.zoom}
            onChange={(e) => updateCamera("zoom", parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="mb-4">
          <label className="text-gray-300 block mb-1">
            Pan X ({camera.panX.toFixed(0)})
          </label>
          <input
            type="range"
            min="-500"
            max="500"
            step="1"
            value={camera.panX}
            onChange={(e) => updateCamera("panX", parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="mb-4">
          <label className="text-gray-300 block mb-1">
            Pan Y ({camera.panY.toFixed(0)})
          </label>
          <input
            type="range"
            min="-500"
            max="500"
            step="1"
            value={camera.panY}
            onChange={(e) => updateCamera("panY", parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="mb-4">
          <label className="text-gray-300 block mb-1">
            Rotate ({camera.rotate.toFixed(0)}°)
          </label>
          <input
            type="range"
            min="-180"
            max="180"
            step="1"
            value={camera.rotate}
            onChange={(e) => updateCamera("rotate", parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

    </div>
  );
}
