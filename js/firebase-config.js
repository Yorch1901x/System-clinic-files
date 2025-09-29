// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB3FfdE1vRpzAPOt290TbbqylMPEXdMqgw",
  authDomain: "lmdproje.firebaseapp.com",
  projectId: "lmdproje",
  storageBucket: "lmdproje.firebasestorage.app",
  messagingSenderId: "528707486981",
  appId: "1:528707486981:web:75be8725362453f01a236c",
  measurementId: "G-M8MB0L0H7Q"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Instancias de Firebase
const auth = firebase.auth();
const db = firebase.firestore();
