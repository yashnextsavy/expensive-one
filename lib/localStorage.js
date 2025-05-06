export const getExpenses = () => {
  const expenses = localStorage.getItem("expenses");
  return expenses ? JSON.parse(expenses) : [];
};

export const saveExpenses = (expenses) => {
  localStorage.setItem("expenses", JSON.stringify(expenses));
};

export const getBudget = () => {
  const budget = localStorage.getItem("budget");
  return budget ? parseFloat(budget) : 1000; // Default budget (fallback)
};

export const saveBudget = (budget) => {
  localStorage.setItem("budget", budget);
};

export const getPendingSync = () => {
  const pending = localStorage.getItem("pendingSync");
  return pending ? JSON.parse(pending) : [];
};

export const savePendingSync = (pending) => {
  localStorage.setItem("pendingSync", JSON.stringify(pending));
};

export const clearExpenses = () => {
  localStorage.setItem("expenses", JSON.stringify([]));
  localStorage.setItem("pendingSync", JSON.stringify([]));
};

export const getBudgetCategories = () => {
  const categories = localStorage.getItem("budgetCategories");
  return categories ? JSON.parse(categories) : [{ id: "default", name: "Monthly", budget: 1000 }];
};

export const saveBudgetCategories = (categories) => {
  localStorage.setItem("budgetCategories", JSON.stringify(categories));
};

export const getExpenseFilter = () => {
  const filter = localStorage.getItem("expenseFilter");
  return filter || "All";
};

export const saveExpenseFilter = (filter) => {
  localStorage.setItem("expenseFilter", filter);
};