import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyANTMnvPYOxO_pk3xlxcgJ-wjqv0BmmSh0",
    authDomain: "expense-tracker-5b348.firebaseapp.com",
    projectId: "expense-tracker-5b348",
    storageBucket: "expense-tracker-5b348.firebasestorage.app",
    messagingSenderId: "325586369988",
    appId: "1:325586369988:web:e687fddf6a148ce2493891",
    measurementId: "G-XSQP8ZZT5D"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };