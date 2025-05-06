import { db, auth } from "./firebase";
import { collection, addDoc, getDocs, setDoc, doc, getDoc, deleteDoc, query } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { getExpenses, saveExpenses, getBudget, saveBudget, getPendingSync, savePendingSync, clearExpenses as clearLocalExpenses } from "./localStorage";

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
  for (const expense of pending) {
    try {
      await addDoc(collection(db, `users/${user.uid}/expenses`), expense);
    } catch (error) {
      console.error("Error syncing expense:", error);
    }
  }
  savePendingSync([]);

  try {
    const querySnapshot = await getDocs(collection(db, `users/${user.uid}/expenses`));
    const expenses = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    saveExpenses(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
  }
};

export const addExpense = async (expense) => {
  const expenses = getExpenses();
  const newExpense = { 
    ...expense, 
    id: Date.now().toString(), 
    timestamp: new Date().toISOString(),
    category: expense.category || "Other" // Default category
  };
  expenses.push(newExpense);
  saveExpenses(expenses);

  if (navigator.onLine && auth.currentUser) {
    try {
      await addDoc(collection(db, `users/${auth.currentUser.uid}/expenses`), newExpense);
    } catch (error) {
      console.error("Error adding expense to Firestore:", error);
      const pending = getPendingSync();
      pending.push(newExpense);
      savePendingSync(pending);
    }
  } else {
    const pending = getPendingSync();
    pending.push(newExpense);
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
  clearLocalExpenses(); // Clear localStorage
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