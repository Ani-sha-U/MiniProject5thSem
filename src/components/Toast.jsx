import { useEffect } from "react";

export default function Toast({ message, onClose }) {

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className="
        fixed top-6 left-1/2 transform -translate-x-1/2
        bg-gray-900 text-white px-4 py-2 rounded-md shadow-lg
        border border-purple-500
        z-50 text-sm
      "
    >
      {message}
    </div>
  );
}
