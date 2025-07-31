import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-storage.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";

/* Configuração Firebase */
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
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

/* Elementos do formulário */
const userIdEl = document.getElementById("userId");
const tituloEl = document.getElementById("titulo");
const descricaoEl = document.getElementById("descricao");
const arquivosEl = document.getElementById("imagens");
const submitBtn = document.getElementById("submit-btn");
const statusEl = document.getElementById("status");
const logoutBtn = document.getElementById("logout-btn");

/* Elementos do preview */
const previewMedia = document.getElementById("preview-media");
const previewTitle = document.getElementById("preview-title");
const previewDesc = document.getElementById("preview-desc");

/* Função para efeito fade-out e fade-in */
function fadeOutIn(element, updateFn) {
  element.classList.add("fade-out");
  setTimeout(() => {
    updateFn();
    element.classList.remove("fade-out");
    element.classList.add("fade-in");
    setTimeout(() => {
      element.classList.remove("fade-in");
    }, 400);
  }, 300);
}

/* Atualiza título no preview em tempo real */
tituloEl.addEventListener("input", () => {
  previewTitle.textContent = tituloEl.value.trim() || "Título do post...";
});

/* Atualiza descrição no preview em tempo real */
descricaoEl.addEventListener("input", () => {
  previewDesc.textContent = descricaoEl.value.trim() || "Aqui vai aparecer a legenda do post...";
});

/* Atualiza preview mostrando TODOS os arquivos selecionados */
arquivosEl.addEventListener("change", () => {
  const files = arquivosEl.files;
  if (!files || files.length === 0) {
    fadeOutIn(previewMedia, () => {
      previewMedia.innerHTML = `<div class="insta-placeholder"></div>`;
    });
    return;
  }

  fadeOutIn(previewMedia, () => {
    previewMedia.innerHTML = ""; // limpa preview

    for (const file of files) {
      const url = URL.createObjectURL(file);
      let mediaElem;

      if (file.type.startsWith("video")) {
        mediaElem = document.createElement("video");
        mediaElem.src = url;
        mediaElem.controls = true;
      } else if (file.type.startsWith("image")) {
        mediaElem = document.createElement("img");
        mediaElem.src = url;
        mediaElem.alt = "Imagem preview";
      } else {
        continue; // ignora outros tipos
      }

      mediaElem.style.width = "100%";
      mediaElem.style.height = "140px";
      mediaElem.style.objectFit = "cover";
      mediaElem.style.borderRadius = "8px";
      mediaElem.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
      mediaElem.style.background = "#000";

      previewMedia.appendChild(mediaElem);
    }
  });
});

/* Upload dos arquivos para Firebase Storage e retorna URLs */
async function uploadArquivos(files, userId) {
  const urls = [];
  for (const file of files) {
    const path = `trabalhos/${userId}/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    urls.push(downloadURL);
  }
  return urls;
}

/* Envio do post */
submitBtn.addEventListener("click", async () => {
  const userId = userIdEl.value.trim();
  const titulo = tituloEl.value.trim();
  const descricao = descricaoEl.value.trim();
  const files = arquivosEl.files;

  if (!userId || !titulo || !descricao) {
    alert("⚠️ Preencha todos os campos!");
    return;
  }

  submitBtn.disabled = true;
  statusEl.textContent = "⏳ Enviando post para aprovação...";

  try {
    let arquivosUrls = [];
    if (files.length > 0) {
      arquivosUrls = await uploadArquivos(files, userId);
    }

    await addDoc(collection(db, "trabalhos"), {
      userId,
      titulo,
      descricao,
      status: "pendente",
      data: Date.now(),
      arquivos: arquivosUrls,
    });

    statusEl.textContent = "✅ Post enviado para aprovação!";
    submitBtn.disabled = false;

    /* Resetar formulário e preview */
    userIdEl.value = "";
    tituloEl.value = "";
    descricaoEl.value = "";
    arquivosEl.value = "";

    previewTitle.textContent = "Título do post...";
    previewDesc.textContent = "Aqui vai aparecer a legenda do post...";
    fadeOutIn(previewMedia, () => {
      previewMedia.innerHTML = `<div class="insta-placeholder"></div>`;
    });

  } catch (error) {
    console.error(error);
    statusEl.textContent = "❌ Erro ao enviar!";
    submitBtn.disabled = false;
  }
});

/* Logout */
logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "login.html";
  } catch (error) {
    alert("Erro ao sair: " + error.message);
  }
});
