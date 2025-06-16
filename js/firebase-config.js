// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDXDeef9tFCDkMiQVen0QoNZtv4-GM14-A",
    authDomain: "kavinkumar-portfolio.firebaseapp.com",
    projectId: "kavinkumar-portfolio",
    storageBucket: "kavinkumar-portfolio.firebasestorage.app",
    messagingSenderId: "1038319988817",
    appId: "1:1038319988817:web:46a548b9fd59abd301c870",
    measurementId: "G-RRCDJSZ480"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage }; 