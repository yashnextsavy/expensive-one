"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateBudget, initializeAuth, clearExpenses } from "@/lib/firestore";
import { getBudget } from "@/lib/localStorage";

export default function Settings() {
  const [budget, setBudget] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        await initializeAuth();
        setBudget(getBudget());
      } catch (err) {
        setError("Failed to initialize settings. Please try again.");
      }
    };
    init();
  }, []);

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!budget) {
      setError("Please enter a budget amount.");
      return;
    }
    try {
      await updateBudget(parseFloat(budget));
      router.push("/");
    } catch (err) {
      setError("Failed to save budget. It will sync when online.");
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear all expense history? This cannot be undone.")) {
      return;
    }
    try {
      await clearExpenses();
      setError("");
      router.push("/");
    } catch (err) {
      setError("Failed to clear history. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-gray-100 p-4 sm:p-6">
      <div className="max-w-lg mx-auto bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Settings</h1>
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
        <form onSubmit={handleSaveBudget} className="space-y-4">
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="Set Budget"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            step="0.01"
          />
          <button
            type="submit"
            className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Budget
          </button>
        </form>
        <button
          onClick={handleClearHistory}
          className="w-full p-3 mt-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Clear History
        </button>
        <button
          onClick={() => router.push("/")}
          className="w-full p-3 mt-4 text-blue-600 hover:text-blue-800 font-medium"
        >
          Back
        </button>
      </div>
    </div>
  );
}