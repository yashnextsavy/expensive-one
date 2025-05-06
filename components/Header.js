import { useState, useEffect } from "react";
import { getSyncStatus } from "../lib/firestore";

export default function Header() {
  const [syncStatus, setSyncStatus] = useState({ status: "Offline", pendingCount: 0 });

  useEffect(() => {
    const updateSyncStatus = () => {
      if (typeof getSyncStatus === "function") {
        setSyncStatus(getSyncStatus());
      } else {
        console.error("getSyncStatus is not a function:", getSyncStatus);
      }
    };

    updateSyncStatus();
    const interval = setInterval(updateSyncStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-blue-600 text-white shadow-md p-4 sticky top-0 z-40">
      <div className="max-w-lg mx-auto flex justify-between items-center">
        <div className="text-xl font-bold">Expense Tracker</div>
        <div className="text-sm">
          <span className={`${
            syncStatus.status === "Online" ? "text-green-200" :
            syncStatus.status === "Offline" ? "text-red-200" :
            "text-yellow-200"
          }`}>
            {syncStatus.status}
            {syncStatus.pendingCount > 0 && ` (${syncStatus.pendingCount} pending)`}
          </span>
        </div>
      </div>
    </header>
  );
}