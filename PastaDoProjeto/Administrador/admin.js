// admin.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  updateDoc,
  getDocs,
  getDoc,
  addDoc,
  deleteDoc,
  doc,
  where,
  query,
  orderBy,
  setDoc,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

// Firebase config
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
const storage = getStorage(app);

const contentArea = document.getElementById("content-area");
const menuButtons = document.querySelectorAll(".menu-btn");
const logoutBtn = document.getElementById("logout-btn");

let currentSection = "clients";

function setActiveButton(section) {
  menuButtons.forEach((btn) => {
    if (btn.dataset.section === section) {
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
    } else {
      btn.classList.remove("active");
      btn.setAttribute("aria-selected", "false");
    }
  });
}

function showLoading() {
  contentArea.innerHTML = `<p>Carregando...</p>`;
}

// --- Modal de confirmação ---

function createConfirmModal() {
  if (document.getElementById("confirm-modal")) return;

  const modalHTML = `
    <div id="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title" style="display:none; position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);justify-content:center;align-items:center;z-index:9999;">
      <div class="modal-content" style="background:#fff;padding:20px 25px;border-radius:8px;width:320px;max-width:90%;box-shadow:0 4px 12px rgba(0,0,0,0.15);text-align:center;">
        <h3 id="confirm-modal-title" style="margin-top:0;margin-bottom:15px;font-size:1.2rem;">Confirmação de exclusão</h3>
        <p>Para apagar, escreva a palavra <strong>confirmar</strong> abaixo:</p>
        <input type="text" id="confirm-input" aria-describedby="confirm-modal-title" placeholder="Escreva confirmar" style="width:100%;padding:8px 10px;font-size:1rem;margin-bottom:15px;border:1.5px solid #ccc;border-radius:4px;box-sizing:border-box;transition:border-color 0.3s ease;" />
        <div class="btn-group" style="display:flex;justify-content:space-between;">
          <button type="button" class="cancel-btn" style="flex:1;padding:8px 0;margin:0 5px;border:none;border-radius:4px;font-weight:600;cursor:pointer;background:#6c757d;color:#fff;user-select:none;">Cancelar</button>
          <button type="button" class="confirm-btn" disabled style="flex:1;padding:8px 0;margin:0 5px;border:none;border-radius:4px;font-weight:600;cursor:not-allowed;background:#f5a6a3;color:#fff;user-select:none;">Confirmar</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);

  const modal = document.getElementById("confirm-modal");
  const input = modal.querySelector("#confirm-input");
  const cancelBtn = modal.querySelector(".cancel-btn");
  const confirmBtn = modal.querySelector(".confirm-btn");

  input.addEventListener("input", () => {
    if (input.value.trim().toLowerCase() === "confirmar") {
      confirmBtn.disabled = false;
      confirmBtn.style.cursor = "pointer";
      confirmBtn.style.backgroundColor = "#d9534f";
    } else {
      confirmBtn.disabled = true;
      confirmBtn.style.cursor = "not-allowed";
      confirmBtn.style.backgroundColor = "#f5a6a3";
    }
  });

  cancelBtn.addEventListener("click", () => {
    modal.style.display = "none";
    input.value = "";
    confirmBtn.disabled = true;
    confirmBtn.style.cursor = "not-allowed";
    confirmBtn.style.backgroundColor = "#f5a6a3";
  });

  return {
    modal,
    waitForConfirm: () => new Promise((resolve) => {
      confirmBtn.onclick = () => {
        modal.style.display = "none";
        input.value = "";
        confirmBtn.disabled = true;
        confirmBtn.style.cursor = "not-allowed";
        confirmBtn.style.backgroundColor = "#f5a6a3";
        resolve(true);
      };
      cancelBtn.onclick = () => {
        modal.style.display = "none";
        input.value = "";
        confirmBtn.disabled = true;
        confirmBtn.style.cursor = "not-allowed";
        confirmBtn.style.backgroundColor = "#f5a6a3";
        resolve(false);
      };
    }),
    show: () => {
      modal.style.display = "flex";
      input.focus();
    }
  };
}

const { modal: confirmModal, waitForConfirm, show } = createConfirmModal();

async function renderClientsSection() {
  showLoading();

contentArea.innerHTML = `
  <div style="max-width: 1200px; margin: 30px 10px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <h2 style="font-weight: 700; font-size: 1.6rem; margin-bottom: 20px; color: #163640;">
      Gestão de Clientes
    </h2>
    <div style="display: flex; gap: 30px; align-items: flex-start;">
      <!-- Formulário -->
      <div id="left-container" style="
        flex: 0 0 50%;
        background: #ffffff;
        padding: 25px;
        border: 2px solid #163640;
        border-radius: 10px;
        min-height: 250px;
        box-shadow: 0 3px 8px rgba(22, 54, 64, 0.15);
        display: flex;
        flex-direction: column;
        justify-content: center;
      ">
        <form id="client-form" aria-label="Formulário para adicionar novo cliente" style="display: flex; flex-wrap: wrap; gap: 15px;">
          <label for="client-name" style="flex: 1 1 45%; font-weight: 600; color: #163640;">Nome do Cliente</label>
          <input type="text" id="client-name" required style="flex: 1 1 45%; padding: 10px; border: 1.5px solid #163640; border-radius: 6px;" />

          <label for="client-email" style="flex: 1 1 45%; font-weight: 600; color: #163640;">Email do Cliente</label>
          <input type="email" id="client-email" required style="flex: 1 1 45%; padding: 10px; border: 1.5px solid #163640; border-radius: 6px;" />

          <label for="client-password" style="flex: 1 1 45%; font-weight: 600; color: #163640;">Password</label>
          <input type="password" id="client-password" required style="flex: 1 1 45%; padding: 10px; border: 1.5px solid #163640; border-radius: 6px;" />

          <label for="client-role" style="flex: 1 1 45%; font-weight: 600; color: #163640;">Cargo</label>
          <input type="text" id="client-role" required style="flex: 1 1 45%; padding: 10px; border: 1.5px solid #163640; border-radius: 6px;" />

          <label for="client-logo" style="flex: 1 1 100%; font-weight: 600; color: #163640;">Logo (PNG)</label>
          <input type="file" id="client-logo" accept="image/png" required style="flex: 1 1 100%;" />

          <button type="submit" class="submit-btn" disabled style="
            margin-top: 15px;
            padding: 12px 0;
            flex: 1 1 100%;
            font-size: 1.1rem;
            font-weight: 700;
            color: white;
            background-color: #ff6a00;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: background-color 0.3s ease;
          ">
            Adicionar Cliente
          </button>
        </form>
      </div>

      <!-- Lista de clientes -->
      <div id="right-container" style="
        flex: 0 0 50%;
        background: #ffffff;
        padding: 25px;
        border: 2px solid #163640;
        border-radius: 10px;
        min-height: 250px;
        box-shadow: 0 3px 8px rgba(22, 54, 64, 0.15);
        overflow-y: auto;
      ">
        <h3 style="margin-top: 0; font-weight: 700; font-size: 1.3rem; color: #163640; border-bottom: 2px solid #ff6a00; padding-bottom: 8px;">
          Clientes Existentes
        </h3>
        <ul id="clients-list-ul" aria-live="polite" aria-atomic="true" style="list-style: none; padding-left: 0; margin-top: 15px;">
          <li>Carregando clientes...</li>
        </ul>
      </div>
    </div>
  </div>
`;

  const clientForm = document.getElementById("client-form");
  const nameInput = document.getElementById("client-name");
  const emailInput = document.getElementById("client-email");
  const passwordInput = document.getElementById("client-password");
  const roleInput = document.getElementById("client-role");
  const logoInput = document.getElementById("client-logo");
  const submitBtn = clientForm.querySelector("button[type='submit']");
  const clientsListUl = document.getElementById("clients-list-ul");

  function toggleSubmitBtn() {
    submitBtn.disabled = !(
      nameInput.value.trim() &&
      emailInput.value.trim() &&
      passwordInput.value.trim() &&
      roleInput.value.trim() &&
      logoInput.files.length > 0
    );
  }

  [nameInput, emailInput, passwordInput, roleInput, logoInput].forEach((input) =>
    input.addEventListener("input", toggleSubmitBtn)
  );

async function loadClients() {
  clientsListUl.innerHTML = "<li>Carregando clientes...</li>";
  try {
    const q = query(collection(db, "clients"), orderBy("name"));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      clientsListUl.innerHTML = "<li style='color: #555;'>Nenhum cliente cadastrado.</li>";
      return;
    }
    clientsListUl.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const client = docSnap.data();
      const li = document.createElement("li");
      li.style.marginBottom = "16px";
      li.style.padding = "15px";
      li.style.border = "1.5px solid #163640"; // azul escuro
      li.style.borderRadius = "8px";
      li.style.backgroundColor = "#f9f9f9";
      li.style.boxShadow = "0 2px 6px rgba(22,54,64,0.1)";
      li.style.display = "flex";
      li.style.justifyContent = "space-between";
      li.style.alignItems = "center";

      // Cria o container para logo + texto
const infoDiv = document.createElement("div");
infoDiv.style.display = "flex";
infoDiv.style.alignItems = "center";
infoDiv.style.flex = "1";

// Imagem do logo antes do texto
if (client.logoUrl) {
  const logoImg = document.createElement("img");
  logoImg.src = client.logoUrl;
  logoImg.alt = `Logo do cliente ${client.name}`;
  logoImg.style.height = "45px";
  logoImg.style.width = "45px";
  logoImg.style.borderRadius = "50%";
  logoImg.style.objectFit = "cover";
  logoImg.style.marginRight = "15px"; // espaço entre logo e texto
  infoDiv.appendChild(logoImg);
}

// Cria o texto dentro de um div separado
const textDiv = document.createElement("div");
textDiv.innerHTML = `
  <strong style="color:#163640; font-size: 1rem;">${client.name}</strong><br>
  <span style="color:#555;">Email:</span> <a href="mailto:${client.email}" style="color:#ff6a00; text-decoration:none;">${client.email}</a><br>
  <span style="color:#555;">Cargo:</span> ${client.role}<br>
  <span style="color:#555;">UID:</span> ${client.uid}
`;
infoDiv.appendChild(textDiv);

li.appendChild(infoDiv);


      // Botão apagar
      const delBtn = document.createElement("button");
      delBtn.textContent = "Apagar";
      delBtn.className = "delete-btn";
      delBtn.style.marginLeft = "20px";
      delBtn.style.padding = "8px 16px";
      delBtn.style.backgroundColor = "#ff6a00";
      delBtn.style.color = "#fff";
      delBtn.style.border = "none";
      delBtn.style.borderRadius = "6px";
      delBtn.style.cursor = "pointer";
      delBtn.style.fontWeight = "600";
      delBtn.style.transition = "background-color 0.3s ease";

      delBtn.addEventListener("mouseenter", () => delBtn.style.backgroundColor = "#cc5600");
      delBtn.addEventListener("mouseleave", () => delBtn.style.backgroundColor = "#ff6a00");

      delBtn.addEventListener("click", async () => {
        show();
        const confirmed = await waitForConfirm();
        if (confirmed) {
          try {
            await deleteDoc(doc(db, "clients", docSnap.id));
            await deleteDoc(doc(db, "users", client.uid));
            if (client.logoPath) {
              await deleteObject(ref(storage, client.logoPath)).catch(() => {});
            }
            showToast("Cliente removido com sucesso", "success");
            await loadClients();
          } catch (error) {
            showToast("Erro ao apagar cliente: " + error.message, "error");
          }
        } else {
          showToast("Ação de apagar cancelada", "info");
        }
      });

      li.appendChild(infoDiv);
      li.appendChild(delBtn);
      clientsListUl.appendChild(li);
    });
  } catch (err) {
    clientsListUl.innerHTML = `<li style="color: red;">Erro: ${err.message}</li>`;
    showToast("Erro ao carregar clientes: " + err.message, "error");
  }
}


  clientForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const role = roleInput.value.trim();
    const file = logoInput.files[0];

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      const logoRef = ref(storage, `logos/${uid}/${file.name}`);
      await uploadBytes(logoRef, file);
      const logoUrl = await getDownloadURL(logoRef);

      const clientData = {
        name,
        email,
        role,
        uid,
        logoUrl,
        logoPath: logoRef.fullPath,
      };

      await addDoc(collection(db, "clients"), clientData);
      await setDoc(doc(db, "users", uid), clientData);

      showToast("Cliente adicionado com sucesso!", "success");

      clientForm.reset();
      toggleSubmitBtn();

      await loadClients();
    } catch (err) {
      showToast("Erro ao adicionar cliente: " + err.message, "error");
    } finally {
      submitBtn.disabled = false;
    }
  });

  await loadClients();
}

async function renderTasksSection() {
  showLoading();

  contentArea.innerHTML = `
    <div style="max-width: 1200px; margin: 30px 10px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <h2 style="font-weight: 700; font-size: 1.6rem; margin-bottom: 20px; color: #163640;">
        Gestão de Tarefas
      </h2>
      <div style="display: flex; gap: 20px; align-items: flex-start; flex-wrap: nowrap;">
        <!-- Formulário -->
        <form id="task-form" aria-label="Formulário para adicionar nova tarefa" style="
          flex: 0 0 65%;
          background: #ffffff;
          padding: 10px;
          border: 2px solid #163640;
          border-radius: 10px;
          min-height: 500px;
          box-shadow: 0 3px 8px rgba(22, 54, 64, 0.15);
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          gap: 15px;
          overflow-y: auto;
        ">
          <label for="task-title" style="font-weight: 600; color: #163640;">Título</label>
          <input type="text" id="task-title" required style="padding: 10px; border: 1.5px solid #163640; border-radius: 6px;" />

          <label for="task-desc" style="font-weight: 600; color: #163640;">Descrição</label>
          <textarea id="task-desc" required style="padding: 10px; border: 1.5px solid #163640; border-radius: 6px;"></textarea>

          <label for="task-date" style="font-weight: 600; color: #163640;">Data de Entrega</label>
          <input type="date" id="task-date" required style="padding: 10px; border: 1.5px solid #163640; border-radius: 6px;" />

          <label for="task-priority" style="font-weight: 600; color: #163640;">Prioridade</label>
          <select id="task-priority" required style="padding: 14px 10px; font-size: 1rem; border: 1.5px solid #163640; border-radius: 6px;">
            <option value="" disabled selected>Selecione</option>
            <option value="Baixa">Baixa</option>
            <option value="Média">Média</option>
            <option value="Alta">Alta</option>
          </select>

          <label for="task-category" style="font-weight: 600; color: #163640;">Comentário</label>
          <input type="text" id="task-category" placeholder="Comentário aqui" style="padding: 10px; border: 1.5px solid #163640; border-radius: 6px;" />

          <button type="submit" class="submit-btn" disabled style="
            margin-top: 15px;
            padding: 12px 0;
            font-size: 1.1rem;
            font-weight: 700;
            color: white;
            background-color: #ff6a00;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: background-color 0.3s ease;
          ">
            Adicionar Tarefa
          </button>
        </form>

        <!-- Coluna direita com as duas seções empilhadas -->
        <div style="
          flex: 0 0 65%;
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-height: 800px;
          overflow-y: auto;
        ">
          <!-- Tarefas pendentes / em andamento -->
          <div style="
            background: #ffffff;
            padding: 25px;
            border: 2px solid #163640;
            border-radius: 10px;
            min-height: 300px;
            box-shadow: 0 3px 8px rgba(22, 54, 64, 0.15);
            overflow-y: auto;
            display: flex;
            flex-direction: column;
          ">
            <h3 style="margin-top: 0; font-weight: 700; font-size: 1.3rem; color: #163640; border-bottom: 2px solid #ff6a00; padding-bottom: 8px;">
              Tarefas Pendentes / Em andamento
            </h3>
            <ul id="tasks-list-ul" aria-live="polite" aria-atomic="true" style="list-style: none; padding-left: 0; margin-top: 10px;">
              <li>Carregando tarefas...</li>
            </ul>
          </div>

          <!-- Tarefas concluídas -->
          <div style="
            background: #ffffff;
            padding: 25px;
            border: 2px solid #163640;
            border-radius: 10px;
            min-height: 200px;
            box-shadow: 0 3px 8px rgba(22, 54, 64, 0.15);
            overflow-y: auto;
            display: flex;
            flex-direction: column;
          ">
            <h3 style="margin-top: 0; font-weight: 700; font-size: 1.3rem; color: #163640; border-bottom: 2px solid #ff6a00; padding-bottom: 8px;">
              Tarefas Concluídas
            </h3>
            <ul id="completed-tasks-list-ul" style="list-style: none; padding-left: 0; margin-top: 15px;">
              <li>Nenhuma tarefa concluída.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;

  const taskForm = document.getElementById("task-form");
  const titleInput = document.getElementById("task-title");
  const descInput = document.getElementById("task-desc");
  const dateInput = document.getElementById("task-date");
  const priorityInput = document.getElementById("task-priority");
  const categoryInput = document.getElementById("task-category");
  const submitBtn = taskForm.querySelector("button[type='submit']");
  const tasksListUl = document.getElementById("tasks-list-ul");
  const completedTasksListUl = document.getElementById("completed-tasks-list-ul");

  // Habilita botão submit só se campos obrigatórios preenchidos
  function toggleSubmitBtn() {
    submitBtn.disabled = !(
      titleInput.value.trim() &&
      descInput.value.trim() &&
      dateInput.value.trim() &&
      priorityInput.value
    );
  }

  [titleInput, descInput, dateInput, priorityInput].forEach((input) =>
    input.addEventListener("input", toggleSubmitBtn)
  );

  // Renderiza cada tarefa pendente/em andamento com dropdown status para alterar
  function createPendingTaskElement(task, id) {
    const li = document.createElement("li");
    li.style.borderBottom = "1px solid #ddd";
    li.style.padding = "8px 5px";
    li.style.display = "flex";
    li.style.flexDirection = "column";
    li.style.gap = "6px";

    // Conteúdo
    const titleEl = document.createElement("strong");
    titleEl.textContent = task.title;

    const descEl = document.createElement("span");
    descEl.textContent = `Descrição: ${task.description}`;

    const dueDateEl = document.createElement("span");
    dueDateEl.textContent = `Data de Entrega: ${task.dueDate}`;

    const priorityEl = document.createElement("span");
    priorityEl.textContent = `Prioridade: ${task.priority}`;

    const categoryEl = document.createElement("span");
    categoryEl.textContent = `Comentário: ${task.category || "—"}`;

    // Dropdown status grande
    const statusLabel = document.createElement("label");
    statusLabel.textContent = "Status: ";
    statusLabel.style.fontWeight = "600";
    statusLabel.style.color = "#163640";

    const statusSelect = document.createElement("select");
    statusSelect.style.padding = "14px 10px";
    statusSelect.style.fontSize = "1rem";
    statusSelect.style.border = "1.5px solid #163640";
    statusSelect.style.borderRadius = "6px";
    statusSelect.style.width = "100%";
    statusSelect.setAttribute("aria-label", `Alterar status da tarefa ${task.title}`);

    ["Pendente", "Em andamento", "Concluído"].forEach((statusOption) => {
      const option = document.createElement("option");
      option.value = statusOption;
      option.textContent = statusOption;
      if (task.status === statusOption) option.selected = true;
      statusSelect.appendChild(option);
    });

    statusSelect.addEventListener("change", async () => {
      const newStatus = statusSelect.value;

      try {
        await updateDoc(doc(db, "tasks", id), { status: newStatus });

        if (newStatus === "Concluído") {
          showToast(`Tarefa "${task.title}" concluída!`, "success");
        } else {
          showToast(`Status da tarefa "${task.title}" atualizado para "${newStatus}"`, "success");
        }

        await loadTasks();
      } catch (err) {
            console.error("Erro ao atualizar status:", err);
            showToast(`Erro ao atualizar status: ${err.message}`, "error");
            statusSelect.value = task.status;
            }
    });

    statusLabel.appendChild(statusSelect);

    li.appendChild(titleEl);
    li.appendChild(descEl);
    li.appendChild(dueDateEl);
    li.appendChild(priorityEl);
    li.appendChild(categoryEl);
    li.appendChild(statusLabel);

    return li;
  }

  // Renderiza tarefas nas listas
  async function loadTasks() {
    tasksListUl.innerHTML = "<li>Carregando tarefas...</li>";
    completedTasksListUl.innerHTML = "<li>Carregando tarefas...</li>";

    try {
      const q = query(collection(db, "tasks"), orderBy("dueDate"));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        tasksListUl.innerHTML = "<li>Nenhuma tarefa pendente ou em andamento.</li>";
        completedTasksListUl.innerHTML = "<li>Nenhuma tarefa concluída.</li>";
        return;
      }

      tasksListUl.innerHTML = "";
      completedTasksListUl.innerHTML = "";

      snapshot.forEach((docSnap) => {
        const task = docSnap.data();
        const id = docSnap.id;

        if (task.status === "Concluído") {
          const li = document.createElement("li");
          li.style.borderBottom = "1px solid #ddd";
          li.style.padding = "8px 5px";
          li.innerHTML = `
            <strong>${task.title}</strong><br>
            Descrição: ${task.description}<br>
            Data de Entrega: ${task.dueDate}<br>
            Prioridade: ${task.priority}<br>
            Comentário: ${task.category || "—"}
          `;
          completedTasksListUl.appendChild(li);
        } else {
          const li = createPendingTaskElement(task, id);
          tasksListUl.appendChild(li);
        }
      });

      if (tasksListUl.children.length === 0) {
        tasksListUl.innerHTML = "<li>Nenhuma tarefa pendente ou em andamento.</li>";
      }
      if (completedTasksListUl.children.length === 0) {
        completedTasksListUl.innerHTML = "<li>Nenhuma tarefa concluída.</li>";
      }
    } catch (err) {
      tasksListUl.innerHTML = `<li>Erro: ${err.message}</li>`;
      completedTasksListUl.innerHTML = `<li>Erro: ${err.message}</li>`;
      showToast("Erro ao carregar tarefas: " + err.message, "error");
    }
  }

taskForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;

  const newTask = {
    title: titleInput.value.trim(),
    description: descInput.value.trim(),
    dueDate: dateInput.value.trim(),
    priority: priorityInput.value,
    status: "Pendente",  // Sempre iniciar com "Pendente"
    category: categoryInput.value.trim() || null,
  };

  try {
    await addDoc(collection(db, "tasks"), newTask);
    showToast("Tarefa adicionada com sucesso!", "success");
    taskForm.reset();
    toggleSubmitBtn();
    await loadTasks();
  } catch (err) {
    console.error(err);  // <- Aqui você adiciona este console.log
    showToast("Erro ao adicionar tarefa: " + err.message, "error");
  } finally {
    submitBtn.disabled = false;
  }
});


  toggleSubmitBtn();
  await loadTasks();
}


















// Função para criar um card expansível
function createExpandableCard(id, title, fields) {
  /*
    id: string id do card (ex: "card1")
    title: título do card com emoji
    fields: array de objetos { label, id, type, placeholder, rows? }
  */
  const card = document.createElement("div");
  card.className = "expandable-card";
  card.style = `
    background-color: #ffffff;
    border: 1.5px solid #163640;
    border-radius: 10px;
    padding: 15px;
    margin-bottom: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
    max-width: 700px;
  `;

  // Título clicável
  const header = document.createElement("h3");
  header.textContent = title;
  header.style.userSelect = "none";
  card.appendChild(header);

  // Container dos campos (inicialmente escondido)
  const content = document.createElement("div");
  content.style.display = "none";
  content.style.marginTop = "10px";

  // Cria inputs/textarea conforme fields
  fields.forEach(field => {
    const label = document.createElement("label");
    label.textContent = field.label;
    label.style.display = "block";
    label.style.marginTop = "10px";

    let input;
    if (field.type === "textarea") {
      input = document.createElement("textarea");
      input.rows = field.rows || 3;
    } else {
      input = document.createElement("input");
      input.type = field.type || "text";
    }
    input.id = field.id;
    input.placeholder = field.placeholder || "";
    input.style = `
      width: 100%;
      padding: 8px;
      margin-top: 4px;
      border: 1.5px solid #163640;
      border-radius: 6px;
      font-size: 1rem;
      resize: vertical;
    `;

    label.appendChild(input);
    content.appendChild(label);
  });

  card.appendChild(content);

  // Toggle expand/collapse ao clicar no card (exceto quando clicar nos inputs)
  card.addEventListener("click", e => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "LABEL") return;
    if (content.style.display === "none") {
      content.style.display = "block";
    } else {
      content.style.display = "none";
    }
  });

  return card;
}

async function renderBrandingSection() {
  contentArea.innerHTML = "";

  const container = document.createElement("div");
  container.style.paddingLeft = "10px";
  container.style.maxWidth = "900px";

  const title = document.createElement("h2");
  title.textContent = "Gestão de Branding";
  title.style.marginBottom = "12px";
  container.appendChild(title);

  const clientSelect = document.createElement("select");
  clientSelect.id = "client-select";
  clientSelect.style.cssText = `
    padding: 14px 20px;
    border: 1.5px solid #163640;
    border-radius: 6px;
    width: 320px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    margin-bottom: 25px;
  `;
  clientSelect.innerHTML = `<option value="" disabled selected>-- Selecione o Cliente --</option>`;
  container.appendChild(clientSelect);

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Salvar";
  saveBtn.style.cssText = `
    padding: 10px 20px;
    font-size: 1.2rem;
    background-color: #163640;
    color: white;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 600;
    margin-top: 20px;
    margin-left: 10px;
    display: none;
  `;
  container.appendChild(saveBtn);

  const statusMsg = document.createElement("div");
  statusMsg.style.marginTop = "15px";
  container.appendChild(statusMsg);

  const cardsContainer = document.createElement("div");
  cardsContainer.style.display = "flex";
  cardsContainer.style.flexDirection = "column";
  container.appendChild(cardsContainer);

  contentArea.appendChild(container);

  const cardsData = [
    {
      id: "card1",
      title: "🧠 1. Identidade",
      fields: [
        { label: "Marca", id: "branding-name", type: "text" },
        { label: "Slogan", id: "branding-slogan", type: "text" },
        { label: "Missão", id: "branding-mission", type: "textarea" },
        { label: "Visão", id: "branding-vision", type: "textarea" },
        { label: "Valores", id: "branding-values", type: "textarea" },
        { label: "Público-alvo", id: "target-audience", type: "textarea" },    
        { label: "Tom de Voz", id: "tone-of-voice", type: "textarea" },
      ],
    },
    {
      id: "card2",
      title: "🎨 2. Cores",
      fields: [
        { label: "Cor principal", id: "branding-primary-colors", type: "text" },
        { label: "Cor secundária", id: "branding-secondary-colors", type: "text" },
        { label: "Cor terciária", id: "branding-third-colors", type: "text" },
      ],
    },
    {
      id: "card3",
      title: "🖋 3. Tipografia",
      fields: [
        { label: "Fonte principal", id: "typography-primary", type: "text" },
        { label: "Fonte secundária", id: "typography-secondary", type: "text" },
      ],
    },
    {
      id: "card4",
      title: "📂 4. Links úteis",
      fields: [
        { label: "Google Drive / Dropbox", id: "files-drive-link", type: "text" },
        { label: "Manual de marca (PDF)", id: "files-manual-pdf", type: "text" },
        { label: "Marca em Canva", id: "files-canva-link", type: "text" },
      ],
    },
  ];

  cardsData.forEach(cardData => {
    const card = createExpandableCard(cardData.id, cardData.title, cardData.fields);
    cardsContainer.appendChild(card);
  });

  async function loadClients() {
    try {
      const clientsCol = collection(db, "clients");
      const q = query(clientsCol, orderBy("name"));
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach(doc => {
        const client = doc.data();
        const option = document.createElement("option");
        option.value = doc.id;
        option.textContent = client.name;
        clientSelect.appendChild(option);
      });
    } catch (error) {
      statusMsg.textContent = "Erro ao carregar clientes: " + error.message;
      statusMsg.style.color = "red";
    }
  }

  await loadClients();

  clientSelect.addEventListener("change", async () => {
    const clientId = clientSelect.value;
    if (!clientId) return;

    saveBtn.style.display = "inline-block";
    statusMsg.textContent = "";

    const docRef = doc(db, "clients", clientId, "branding", "data");

    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();

        // Preenche campos existentes
        cardsData.forEach(card => {
          card.fields.forEach(field => {
            const el = document.getElementById(field.id);
            if (el && data[field.id] !== undefined) {
              el.value = data[field.id];
            } else if (el) {
              el.value = "";
            }
          });
        });
      } else {
        // Branding ainda não criado
        clearAllInputs();
      }
    } catch (err) {
      console.error("Erro ao buscar branding:", err);
      statusMsg.textContent = "Erro ao buscar branding do cliente.";
      statusMsg.style.color = "red";
    }
  });

  function clearAllInputs() {
    cardsData.forEach(card => {
      card.fields.forEach(field => {
        const el = document.getElementById(field.id);
        if (el) el.value = "";
      });
    });
  }

  function collectBrandingData() {
    const data = {};
    cardsData.forEach(card => {
      card.fields.forEach(field => {
        const el = document.getElementById(field.id);
        if (el) {
          data[field.id] = el.value.trim();
        }
      });
    });
    return data;
  }

  saveBtn.addEventListener("click", async () => {
    const clientId = clientSelect.value;
    if (!clientId) {
      alert("Selecione um cliente antes de salvar.");
      return;
    }

    saveBtn.disabled = true;
    statusMsg.textContent = "Salvando branding...";
    statusMsg.style.color = "black";

    try {
      const brandingData = collectBrandingData();
      await setDoc(doc(db, "clients", clientId, "branding", "data"), brandingData);
      statusMsg.textContent = "Branding salvo com sucesso!";
      statusMsg.style.color = "green";
    } catch (error) {
      statusMsg.textContent = "Erro ao salvar branding: " + error.message;
      statusMsg.style.color = "red";
    } finally {
      saveBtn.disabled = false;
    }
  });
}















// --- Atualize os listeners do menu e auth para incluir branding ---

// No seu listener de menu, adicione:

menuButtons.forEach((btn) => {
  btn.addEventListener("click", async () => {
    currentSection = btn.dataset.section;
    setActiveButton(currentSection);
    switch (currentSection) {
      case "clients":
        await renderClientsSection();
        break;
      case "tasks":
        await renderTasksSection();
        break;
      case "users":
        await renderUsersSection();
        break;
      case "settings":
        await renderSettingsSection();
        break;
      case "branding":
        await renderBrandingSection();
        break;
    }
  });
});

// No onAuthStateChanged também:

onAuthStateChanged(auth, async (user) => {
  if (user) {
    setActiveButton(currentSection);
    switch (currentSection) {
      case "clients":
        await renderClientsSection();
        break;
      case "tasks":
        await renderTasksSection();
        break;
      case "users":
        await renderUsersSection();
        break;
      case "settings":
        await renderSettingsSection();
        break;
      case "branding":
        await renderBrandingSection();
        break;
    }
  } else {
    window.location.href = "/index.html";
  }
});







































async function renderUsersSection() {
  showLoading();

  contentArea.innerHTML = `
    <h2>Gestão de Utilizadores</h2>
    <p>Em desenvolvimento...</p>
  `;
}

async function renderSettingsSection() {
  showLoading();

  contentArea.innerHTML = `
    <h2>Configurações</h2>
    <p>Em desenvolvimento...</p>
  `;
}

// Toast Notifications (mantém igual ao anterior)
function showToast(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.setAttribute("aria-live", "polite");
    container.setAttribute("aria-atomic", "true");
    container.style.position = "fixed";
    container.style.bottom = "20px";
    container.style.right = "20px";
    container.style.zIndex = "10000";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "10px";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.style.minWidth = "200px";
  toast.style.padding = "12px 20px";
  toast.style.borderRadius = "8px";
  toast.style.color = "#fff";
  toast.style.fontSize = "1rem";
  toast.style.boxShadow = "0 4px 10px rgba(0,0,0,0.15)";
  toast.style.cursor = "default";
  toast.style.opacity = "0";
  toast.style.transform = "translateY(20px)";
  toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
  toast.textContent = message;

  const bgColors = {
    success: "#28a745",
    error: "#dc3545",
    info: "#007bff",
    warning: "#ffc107",
  };
  toast.style.backgroundColor = bgColors[type] || bgColors.info;
  if (type === "warning") toast.style.color = "#000";

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  }, 50);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    toast.addEventListener("transitionend", () => {
      toast.remove();
      if (container.children.length === 0) container.remove();
    });
  }, 3500);
}

// Novo handler global para botões que tenham "adicionar" no texto
document.addEventListener("click", (e) => {
  if (
    e.target.tagName === "BUTTON" &&
    e.target.textContent.toLowerCase().includes("adicionar")
  ) {
    // Aqui, pode ser só notificação genérica, pq as ações async já tem notificações próprias
    showToast("Ação executada!", "success");
  }
});


// Logout
logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "/index.html";
  } catch (err) {
    showToast("Erro ao fazer logout: " + err.message, "error");
  }
});

// Mudar secção ao clicar no menu
menuButtons.forEach((btn) => {
  btn.addEventListener("click", async () => {
    currentSection = btn.dataset.section;
    setActiveButton(currentSection);
    switch (currentSection) {
      case "clients":
        await renderClientsSection();
        break;
      case "tasks":
        await renderTasksSection();
        break;
      case "users":
        await renderUsersSection();
        break;
      case "settings":
        await renderSettingsSection();
        break;
    }
  });
});

// Estado da autenticação
onAuthStateChanged(auth, async (user) => {
  if (user) {
    setActiveButton(currentSection);
    switch (currentSection) {
      case "clients":
        await renderClientsSection();
        break;
      case "tasks":
        await renderTasksSection();
        break;
      case "users":
        await renderUsersSection();
        break;
      case "settings":
        await renderSettingsSection();
        break;
    }
  } else {
    window.location.href = "/index.html";
  }
});

// Primeiro, certifique-se de incluir o Howler.js no seu HTML, antes do admin.js:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.3/howler.min.js"></script>

// Depois, no final do admin.js:

const notificationSound = new Howl({
  src: ['https://www.myinstants.com/pt/instant/google-pixel-popcorn-notification-sound-43662/?utm_source=copy&utm_medium=share'], // som parecido com alerta do iPhone
  volume: 1,
});
document.body.addEventListener("click", (event) => {
  const el = event.target;
  // Se o elemento clicado for um botão e o texto contiver "adicionar"
  if (el.tagName === "BUTTON" && /adicionar/i.test(el.textContent)) {
    notificationSound.play();
  }
});
