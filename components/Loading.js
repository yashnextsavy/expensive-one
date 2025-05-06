export default function Loading() {
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backdropFilter: "blur(4px)", backgroundColor: "rgba(0, 0, 0, 0.6)" }}>
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-l-4 border-r-4 border-l-orange-400 border-x-orange-400 border-t-transparent border-b-transparent"></div>
        </div>
    );
}