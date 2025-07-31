import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA-Em5uc8-h5P5YaJSzD9Ay1tgZkgOksGg",
  authDomain: "website-task-masters.firebaseapp.com",
  projectId: "website-task-masters",
  storageBucket: "website-task-masters.firebasestorage.app",
  messagingSenderId: "610510302558",
  appId: "1:610510302558:web:9bdef4b19679f85601b3cf",
  measurementId: "G-YBNTNNLLGX"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Login com verificação do role
const loginForm = document.getElementById("login-form");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (!user.emailVerified) {
      alert("⚠ Sua conta ainda não foi verificada.\nVerifique seu e-mail antes de fazer login.");
      return;
    }

    // Pega o documento do usuário na coleção 'users' com UID do usuário
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      alert("❌ Usuário não cadastrado no sistema. Contate o administrador.");
      return;
    }

    const userData = userDocSnap.data();

    if (userData.role === "admin") {
      window.location.href = "admin.html";
    } else if (userData.role === "cliente") {
      window.location.href = "dashboard.html";
    } else {
      alert("❌ Role do usuário inválido.");
    }

  } catch (error) {
    console.error("❌ Erro ao logar:", error.message);
    alert(`❌ Erro ao logar: ${error.message}`);
  }
});
