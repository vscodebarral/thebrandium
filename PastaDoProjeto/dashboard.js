import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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

// Bloqueio de acesso: se não tiver usuário logado, redireciona para login
onAuthStateChanged(auth, user => {
  if (!user) {
    // Se não está autenticado, redireciona
    window.location.href = "login.html";
  } else {
    // Se está logado, continua com a inicialização do dashboard
    initDashboard();
  }
});

// Função para inicializar o dashboard após autenticação confirmada
function initDashboard() {
  // Destaca o item ativo baseado na URL atual
  const currentPage = window.location.pathname.split('/').pop();

  document.querySelectorAll('.sidebar-menu li a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.parentElement.classList.add('active');
    } else {
      link.parentElement.classList.remove('active');
    }
  });

  // Função para logout
  function logout() {
    signOut(auth)
      .then(() => {
        window.location.href = "login.html";
      })
      .catch((error) => {
        console.error("Erro ao fazer logout:", error);
        alert("Erro ao sair, tente novamente.");
      });
  }

  // Liga o logout ao clique dos botões "Sair"
  document.querySelectorAll('.logout-link, .sidebar-bottom a').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  });

  // Simula salvar dados do cliente
  window.saveData = function (tipo) {
    const inputs = event.target.closest('.card').querySelectorAll('input');
    const valores = Array.from(inputs).map(i => i.value);
    console.log(`[${tipo.toUpperCase()}] Guardado:`, valores);
    // Aqui farás o POST para API com os dados por cliente
  };
}
