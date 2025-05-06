"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateBudget, initializeAuth, clearExpenses, addBudgetCategory, deleteBudgetCategory } from "@/lib/firestore";
import { getBudget, getBudgetCategories } from "@/lib/localStorage";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Modal from "@/components/Modal";
import { FiTrash2 } from "react-icons/fi";
import Header from "@/components/Header";

export default function Settings() {
  const [budget, setBudget] = useState("");
  const [error, setError] = useState("");
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isDeleteCategoryModalOpen, setIsDeleteCategoryModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryBudget, setCategoryBudget] = useState("");
  const [budgetCategories, setBudgetCategories] = useState([]);
  const [categoryIdToDelete, setCategoryIdToDelete] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        await initializeAuth();
        setBudget(getBudget());
        setBudgetCategories(getBudgetCategories());
      } catch (err) {
        setError("Failed to initialize settings. Please try again.");
        toast.error("Failed to initialize settings.");
      }
    };
    init();
  }, []);

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!budget) {
      setError("Please enter a budget amount.");
      toast.error("Please enter a budget amount.");
      return;
    }
    try {
      await updateBudget(parseFloat(budget));
      router.push("/");
      toast.success("Budget saved successfully!");
    } catch (err) {
      setError("Failed to save budget. It will sync when online.");
      toast.error("Failed to save budget. It will sync when online.");
    }
  };

  const handleClearHistory = () => {
    setIsClearModalOpen(true);
  };

  const confirmClearHistory = async () => {
    try {
      await clearExpenses();
      setError("");
      router.push("/");
      toast.success("Expense history cleared successfully!");
    } catch (err) {
      setError("Failed to clear history. Please try again.");
      toast.error("Failed to clear history. Please try again.");
    }
    setIsClearModalOpen(false);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!categoryName || !categoryBudget) {
      setError("Please enter a category name and budget.");
      toast.error("Please enter a category name and budget.");
      return;
    }
    try {
      await addBudgetCategory({ name: categoryName, budget: parseFloat(categoryBudget) });
      setBudgetCategories(getBudgetCategories());
      setCategoryName("");
      setCategoryBudget("");
      setIsAddCategoryModalOpen(false);
      toast.success("Budget category added successfully!");
    } catch (err) {
      setError("Failed to add category. It will sync when online.");
      toast.error("Failed to add category. It will sync when online.");
    }
  };

  const handleDeleteCategory = (id) => {
    setCategoryIdToDelete(id);
    setIsDeleteCategoryModalOpen(true);
  };

  const confirmDeleteCategory = async () => {
    try {
      await deleteBudgetCategory(categoryIdToDelete);
      setBudgetCategories(getBudgetCategories());
      toast.success("Budget category deleted successfully!");
    } catch (err) {
      setError("Failed to delete category. It will sync when online.");
      toast.error("Failed to delete category. It will sync when online.");
    }
    setIsDeleteCategoryModalOpen(false);
    setCategoryIdToDelete(null);
  };

  const closeModal = () => {
    setIsClearModalOpen(false);
    setIsAddCategoryModalOpen(false);
    setIsDeleteCategoryModalOpen(false);
    setCategoryIdToDelete(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-gray-100">
      <Header />
      <div className="p-4 sm:p-6 pt-20 sm:pt-20">
        <div className="max-w-lg mx-auto bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Settings</h1>
          {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
          <form onSubmit={handleSaveBudget} className="space-y-4">
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Set Default Budget"
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
          <div className="mt-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Budget Categories</h2>
            <button
              onClick={() => setIsAddCategoryModalOpen(true)}
              className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mb-4"
            >
              Add Budget Category
            </button>
            <ul className="space-y-2">
              {budgetCategories.map((cat) => (
                <li key={cat.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium">{cat.name}</p>
                    <p className="text-sm text-gray-500">Budget: ${cat.budget.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="text-red-600 hover:text-red-800"
                    disabled={cat.id === "default"}
                  >
                    <FiTrash2 size={18} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
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
        <Modal
          isOpen={isClearModalOpen}
          onClose={closeModal}
          onConfirm={confirmClearHistory}
          title="Confirm Clear History"
          message="Are you sure you want to clear all expense history? This action cannot be undone."
        />
        <Modal
          isOpen={isAddCategoryModalOpen}
          onClose={closeModal}
          onConfirm={handleAddCategory}
          title="Add Budget Category"
          message={
            <form onSubmit={handleAddCategory} className="space-y-4">
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Category Name (e.g., Trip)"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <input
                type="number"
                value={categoryBudget}
                onChange={(e) => setCategoryBudget(e.target.value)}
                placeholder="Budget Amount"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                step="0.01"
              />
              <button
                type="submit"
                className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Add Category
              </button>
            </form>
          }
        />
        <Modal
          isOpen={isDeleteCategoryModalOpen}
          onClose={closeModal}
          onConfirm={confirmDeleteCategory}
          title="Confirm Delete Category"
          message="Are you sure you want to delete this budget category and all its expenses? This action cannot be undone."
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