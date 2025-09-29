// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBcFP2nE3cfJzExirjH7TBDFMH7b2nD-io",
  authDomain: "lmdproject-72efd.firebaseapp.com",
  projectId: "lmdproject-72efd",
  storageBucket: "lmdproject-72efd.firebasestorage.app",
  messagingSenderId: "221725186303",
  appId: "1:221725186303:web:93918eb6918f69664f94ca",
  measurementId: "G-3DHDWPKK9B"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Instancias de Firebase
const auth = firebase.auth();
const db = firebase.firestore();
