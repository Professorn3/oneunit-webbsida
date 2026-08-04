import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCPmASmOQu0LyQDvW4R7ZJH_ehW3LQvTMA",
  authDomain: "oneunit-8e519.firebaseapp.com",
  projectId: "oneunit-8e519",
  storageBucket: "oneunit-8e519.firebasestorage.app",
  messagingSenderId: "228428908190",
  appId: "1:228428908190:web:1b341d8d41d05f9cae9d8f",
  measurementId: "G-J787NT9FWQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
