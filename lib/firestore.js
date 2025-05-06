import { db, auth } from "./firebase";
import { collection, addDoc, getDocs, setDoc, doc, getDoc, deleteDoc, query } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { getExpenses, saveExpenses, getBudget, saveBudget, getPendingSync, savePendingSync, clearExpenses as clearLocalExpenses, getBudgetCategories, saveBudgetCategories } from "./localStorage";

export const initializeAuth = async () => {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
      console.log("Signed in anonymously");
    }
    return auth.currentUser;
  } catch (error) {
    console.error("Auth error:", error);
    throw error;
  }
};

export const syncExpenses = async () => {
  if (!navigator.onLine) return;
  const user = auth.currentUser;
  if (!user) {
    console.error("No authenticated user for sync");
    return;
  }

  const pending = getPendingSync();
  for (const action of pending) {
    try {
      if (action.type === "add") {
        await addDoc(collection(db, `users/${user.uid}/expenses`), action.expense);
      } else if (action.type === "delete") {
        await deleteDoc(doc(db, `users/${user.uid}/expenses`, action.id));
      } else if (action.type === "addCategory") {
        await setDoc(doc(db, `users/${user.uid}/budgetCategories`, action.category.id), action.category);
      } else if (action.type === "deleteCategory") {
        await deleteDoc(doc(db, `users/${user.uid}/budgetCategories`, action.id));
        const expensesQuery = query(collection(db, `users/${user.uid}/expenses`));
        const expensesSnapshot = await getDocs(expensesQuery);
        const deletePromises = expensesSnapshot.docs
          .filter(doc => doc.data().budgetCategoryId === action.id)
          .map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
      }
    } catch (error) {
      console.error(`Error syncing ${action.type}:`, error);
    }
  }
  savePendingSync([]);

  try {
    const expensesSnapshot = await getDocs(collection(db, `users/${user.uid}/expenses`));
    const expenses = expensesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    saveExpenses(expenses);

    const categoriesSnapshot = await getDocs(collection(db, `users/${user.uid}/budgetCategories`));
    const categories = categoriesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    saveBudgetCategories(categories.length ? categories : [{ id: "default", name: "Monthly", budget: 1000 }]);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const addExpense = async (expense) => {
  const expenses = getExpenses();
  const newExpense = { 
    ...expense, 
    id: Date.now().toString(), 
    timestamp: new Date().toISOString(),
    category: expense.category || "Other",
    budgetCategoryId: expense.budgetCategoryId || "default"
  };
  expenses.push(newExpense);
  saveExpenses(expenses);

  if (navigator.onLine && auth.currentUser) {
    try {
      await addDoc(collection(db, `users/${auth.currentUser.uid}/expenses`), newExpense);
    } catch (error) {
      console.error("Error adding expense to Firestore:", error);
      const pending = getPendingSync();
      pending.push({ type: "add", expense: newExpense });
      savePendingSync(pending);
    }
  } else {
    const pending = getPendingSync();
    pending.push({ type: "add", expense: newExpense });
    savePendingSync(pending);
  }
};

export const deleteExpense = async (id) => {
  const expenses = getExpenses();
  const updatedExpenses = expenses.filter((exp) => exp.id !== id);
  saveExpenses(updatedExpenses);

  if (navigator.onLine && auth.currentUser) {
    try {
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/expenses`, id));
    } catch (error) {
      console.error("Error deleting expense from Firestore:", error);
      const pending = getPendingSync();
      pending.push({ type: "delete", id });
      savePendingSync(pending);
    }
  } else {
    const pending = getPendingSync();
    pending.push({ type: "delete", id });
    savePendingSync(pending);
  }
};

export const addBudgetCategory = async (category) => {
  const categories = getBudgetCategories();
  const newCategory = { id: Date.now().toString(), ...category };
  categories.push(newCategory);
  saveBudgetCategories(categories);

  if (navigator.onLine && auth.currentUser) {
    try {
      await setDoc(doc(db, `users/${auth.currentUser.uid}/budgetCategories`, newCategory.id), newCategory);
    } catch (error) {
      console.error("Error adding budget category to Firestore:", error);
      const pending = getPendingSync();
      pending.push({ type: "addCategory", category: newCategory });
      savePendingSync(pending);
    }
  } else {
    const pending = getPendingSync();
    pending.push({ type: "addCategory", category: newCategory });
    savePendingSync(pending);
  }
};

export const deleteBudgetCategory = async (id) => {
  const categories = getBudgetCategories();
  const updatedCategories = categories.filter((cat) => cat.id !== id);
  saveBudgetCategories(updatedCategories);

  const expenses = getExpenses();
  const updatedExpenses = expenses.filter((exp) => exp.budgetCategoryId !== id);
  saveExpenses(updatedExpenses);

  if (navigator.onLine && auth.currentUser) {
    try {
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/budgetCategories`, id));
      const expensesQuery = query(collection(db, `users/${auth.currentUser.uid}/expenses`));
      const expensesSnapshot = await getDocs(expensesQuery);
      const deletePromises = expensesSnapshot.docs
        .filter(doc => doc.data().budgetCategoryId === id)
        .map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Error deleting budget category from Firestore:", error);
      const pending = getPendingSync();
      pending.push({ type: "deleteCategory", id });
      savePendingSync(pending);
    }
  } else {
    const pending = getPendingSync();
    pending.push({ type: "deleteCategory", id });
    savePendingSync(pending);
  }
};

export const updateBudget = async (budget) => {
  saveBudget(budget);
  if (navigator.onLine && auth.currentUser) {
    try {
      await setDoc(doc(db, `users/${auth.currentUser.uid}`), { budget }, { merge: true });
    } catch (error) {
      console.error("Error updating budget in Firestore:", error);
    }
  }
};

export const fetchBudget = async () => {
  if (navigator.onLine && auth.currentUser) {
    try {
      const docRef = doc(db, `users/${auth.currentUser.uid}`);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        saveBudget(docSnap.data().budget);
      }
    } catch (error) {
      console.error("Error fetching budget:", error);
    }
  }
  return getBudget();
};

export const getSyncStatus = () => {
  const pending = getPendingSync();
  if (!navigator.onLine) {
    return { status: "Offline", pendingCount: pending.length };
  }
  if (pending.length > 0) {
    return { status: "Pending Sync", pendingCount: pending.length };
  }
  return { status: "Online", pendingCount: 0 };
};

export const clearExpenses = async () => {
  clearLocalExpenses();
  if (navigator.onLine && auth.currentUser) {
    try {
      const querySnapshot = await getDocs(collection(db, `users/${auth.currentUser.uid}/expenses`));
      const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Error clearing expenses in Firestore:", error);
    }
  }
};