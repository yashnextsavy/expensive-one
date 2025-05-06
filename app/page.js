"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addExpense, syncExpenses, initializeAuth, getSyncStatus } from "../lib/firestore";
import { getExpenses, getBudget } from "../lib/localStorage";

export default function Home() {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Food");
  const [expenses, setExpenses] = useState([]);
  const [budget, setBudget] = useState(1000);
  const [error, setError] = useState("");
  const [syncStatus, setSyncStatus] = useState({ status: "Offline", pendingCount: 0 });
  const router = useRouter();

  const categories = ["Food", "Travel", "Utilities", "Other"];

  useEffect(() => {
    const init = async () => {
      try {
        await initializeAuth();
        setExpenses(getExpenses());
        setBudget(getBudget());
        await syncExpenses();
        if (typeof getSyncStatus === "function") {
          setSyncStatus(getSyncStatus());
        } else {
          console.error("getSyncStatus is not a function:", getSyncStatus);
          setError("Sync status unavailable. Please refresh the page.");
        }
      } catch (err) {
        setError("Failed to initialize app. Please try again.");
      }
    };
    init();

    // Update sync status periodically
    const interval = setInterval(() => {
      if (typeof getSyncStatus === "function") {
        setSyncStatus(getSyncStatus());
      } else {
        console.error("getSyncStatus is not a function in interval:", getSyncStatus);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!amount || !description) {
      setError("Please enter both amount and description.");
      return;
    }
    try {
      await addExpense({ amount: parseFloat(amount), description, category });
      setExpenses(getExpenses());
      setAmount("");
      setDescription("");
      setCategory("Food");
      setError("");
      if (typeof getSyncStatus === "function") {
        setSyncStatus(getSyncStatus());
      }
    } catch (err) {
      setError("Failed to add expense. It will sync when online.");
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-gray-100 p-4 sm:p-6">
      <div className="max-w-lg mx-auto bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Expense Tracker</h1>
          <button
            onClick={() => router.push("/settings")}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Settings
          </button>
        </div>
        <div className="mb-6 text-sm text-gray-600">
          <p className="font-semibold">
            Sync Status: 
            <span className={`ml-2 ${
              syncStatus.status === "Online" ? "text-green-600" :
              syncStatus.status === "Offline" ? "text-red-600" :
              "text-yellow-600"
            }`}>
              {syncStatus.status}
              {syncStatus.pendingCount > 0 && ` (${syncStatus.pendingCount} pending)`}
            </span>
          </p>
          <p className="mt-2">Budget: ${budget.toFixed(2)}</p>
          <p>Total Expenses: ${totalExpenses.toFixed(2)}</p>
          <p className={budget - totalExpenses < 0 ? "text-red-600" : "text-green-600"}>
            Remaining: ${(budget - totalExpenses).toFixed(2)}
          </p>
        </div>
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
        <form onSubmit={handleAddExpense} className="mb-6 space-y-4">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            step="0.01"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button
            type="submit"
            className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Expense
          </button>
        </form>
        <ul className="space-y-2">
          {expenses.map((exp) => (
            <li key={exp.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-medium">{exp.description}</p>
                <p className="text-sm text-gray-500">{exp.category} • {new Date(exp.timestamp).toLocaleDateString()}</p>
              </div>
              <p className="text-gray-800">${exp.amount.toFixed(2)}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}