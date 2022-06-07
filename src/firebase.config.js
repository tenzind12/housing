// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
// TODO: Add SDKs for Firebase products that you want to use
import { getFirestore } from 'firebase/firestore';
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyB4mTlrpwodpg-Jg570jKLhOMjuhm37IYM',
  authDomain: 'house-marketplace-1f84c.firebaseapp.com',
  projectId: 'house-marketplace-1f84c',
  storageBucket: 'house-marketplace-1f84c.appspot.com',
  messagingSenderId: '940810920527',
  appId: '1:940810920527:web:e85fd72462d5cc4494403a',
};

// Initialize Firebase
initializeApp(firebaseConfig);
export const db = getFirestore();
