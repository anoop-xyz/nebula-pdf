import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyAjynu6ZFq6pQfwx1vaiacFm_P0h-wCuNc",
    authDomain: "nebula-pdf.firebaseapp.com",
    projectId: "nebula-pdf",
    storageBucket: "nebula-pdf.firebasestorage.app",
    messagingSenderId: "470745495878",
    appId: "1:470745495878:web:ca6f3be90f68476e580d47",
    measurementId: "G-X1WYEBY6HY"
};

// Initialize Firebase (Singleton pattern)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Analytics runs only on client side
if (typeof window !== "undefined") {
    isSupported().then((supported) => {
        if (supported) {
            getAnalytics(app);
        }
    });
}

export { app, auth, db, storage };
