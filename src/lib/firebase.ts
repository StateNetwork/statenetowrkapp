// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  "projectId": "mineservehq",
  "appId": "1:1088040292182:web:15f8e9df2e37b28d2fd0f7",
  "storageBucket": "mineservehq.firebasestorage.app",
  "apiKey": "AIzaSyChnOChZPoW3HjVxo03-DTo3QGb3Wfty_4",
  "authDomain": "mineservehq.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "1088040292182"
};


// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


export { app, db, auth };
