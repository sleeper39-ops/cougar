// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD1SGjQXgfQykrV-psyDDwWbuqfTlE7Zhk",
  authDomain: "cougar2-database.firebaseapp.com",
  databaseURL: "https://cougar2-database-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "cougar2-database",
  storageBucket: "cougar2-database.firebasestorage.app",
  messagingSenderId: "429808185249",
  appId: "1:429808185249:web:4afa08e0a7a973b00d25e0",
  measurementId: "G-VKV5N9GBFX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
