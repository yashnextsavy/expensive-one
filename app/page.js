"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addExpense, syncExpenses, initializeAuth, deleteExpense } from "@/lib/firestore";
import { getExpenses, getBudgetCategories, getExpenseFilter, saveExpenseFilter } from "@/lib/localStorage";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiTrash2 } from "react-icons/fi";
import Modal from "@/components/Modal";
import Header from "@/components/Header";

export default function Home() {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Food");
  const [expenses, setExpenses] = useState([]);
  const [budgetCategories, setBudgetCategories] = useState([]);
  const [selectedBudgetCategory, setSelectedBudgetCategory] = useState("default");
  const [filterCategory, setFilterCategory] = useState("All");
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const categories = ["Food", "Travel", "Utilities", "Other"];

  useEffect(() => {
    const init = async () => {
      try {
        await initializeAuth();
        setExpenses(getExpenses());
        setBudgetCategories(getBudgetCategories());
        setFilterCategory(getExpenseFilter());
        await syncExpenses();
      } catch (err) {
        setError("Failed to initialize app. Please try again.");
      }
    };
    init();
  }, []);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!amount || !description) {
      setError("Please enter both amount and description.");
      toast.error("Please enter both amount and description.");
      return;
    }
    try {
      await addExpense({ 
        amount: parseFloat(amount), 
        description, 
        category, 
        budgetCategoryId: selectedBudgetCategory 
      });
      setExpenses(getExpenses());
      setAmount("");
      setDescription("");
      setCategory("Food");
      setError("");
      toast.success("Expense added successfully!");
    } catch (err) {
      setError("Failed to add expense. It will sync when online.");
      toast.error("Failed to add expense. It will sync when online.");
    }
  };

  const handleDeleteExpense = (id) => {
    setExpenseIdToDelete(id);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteExpense(expenseIdToDelete);
      setExpenses(getExpenses());
      toast.success("Expense deleted successfully!");
    } catch (err) {
      setError("Failed to delete expense. It will sync when online.");
      toast.error("Failed to delete expense. It will sync when online.");
    }
    setIsModalOpen(false);
    setExpenseIdToDelete(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setExpenseIdToDelete(null);
  };

  const handleFilterChange = (e) => {
    const newFilter = e.target.value;
    setFilterCategory(newFilter);
    saveExpenseFilter(newFilter);
  };

  const filteredExpenses = expenses
    .filter(exp => exp.budgetCategoryId === selectedBudgetCategory)
    .filter(exp => filterCategory === "All" || exp.category === filterCategory);
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const selectedCategory = budgetCategories.find(cat => cat.id === selectedBudgetCategory) || { budget: 1000 };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-gray-100">
      <Header />
      <div className="p-4 sm:p-6 pt-20 sm:pt-20">
        <div className="max-w-lg mx-auto bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Expenses</h1>
            <button
              onClick={() => router.push("/settings")}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Settings
            </button>
          </div>
          <div className="mb-6">
            <select
              value={selectedBudgetCategory}
              onChange={(e) => setSelectedBudgetCategory(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4"
            >
              {budgetCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <select
              value={filterCategory}
              onChange={handleFilterChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4"
            >
              <option value="All">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <div className="text-sm text-gray-600">
              <p className="mt-2">Budget: ${selectedCategory.budget.toFixed(2)}</p>
              <p>Total Expenses (Filtered): ${totalExpenses.toFixed(2)}</p>
              <p className={selectedCategory.budget - totalExpenses < 0 ? "text-red-600" : "text-green-600"}>
                Remaining: ${(selectedCategory.budget - totalExpenses).toFixed(2)}
              </p>
            </div>
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
            {filteredExpenses.map((exp) => (
              <li key={exp.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-medium">{exp.description}</p>
                  <p className="text-sm text-gray-500">{exp.category} • {new Date(exp.timestamp).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <p className="text-gray-800">${exp.amount.toFixed(2)}</p>
                  <button
                    onClick={() => handleDeleteExpense(exp.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          onConfirm={confirmDelete}
          title="Confirm Deletion"
          message="Are you sure you want to delete this expense? This action cannot be undone."
        />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </div>
  );
}