import { useEffect } from "react";

export default function Modal({ isOpen, onClose, onConfirm, title, message }) {
    // Close modal on Escape key
    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backdropFilter: "blur(5px)", backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full mx-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
                <div className="text-gray-600 mb-6">{message}</div>
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}