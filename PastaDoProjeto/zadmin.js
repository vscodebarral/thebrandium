import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

// Configuração Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA-Em5uc8-h5P5YaJSzD9Ay1tgZkgOksGg",
  authDomain: "website-task-masters.firebaseapp.com",
  projectId: "website-task-masters",
  storageBucket: "website-task-masters.firebasestorage.app",
  messagingSenderId: "610510302558",
  appId: "1:610510302558:web:9bdef4b19679f85601b3cf",
  measurementId: "G-YBNTNNLLGX"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Função para mostrar notificações toast
function showToast(message, duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;

  toast.style.opacity = '1';
  toast.style.transition = 'opacity 0.5s ease';

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      if (container.contains(toast)) container.removeChild(toast);
    }, 500);
  }, duration);
}

document.addEventListener('DOMContentLoaded', () => {
  // --- EXISTENTES ---
  const sections = document.querySelectorAll('.section');
  const navButtons = document.querySelectorAll('.sidebar nav button');
  const clientSelector = document.getElementById('clientSelector'); // select do header
  const clientForm = document.getElementById('client-form');
  const clientListContainer = document.getElementById('clientsListContainer'); 
  const loader = document.getElementById('loader');

  const logoNameDisplay = document.getElementById('logoNameDisplay');
  const logoPreview = document.getElementById('logoPreview');

  let clients = [];

  // --- NOVOS ELEMENTOS PARA TAREFAS ---
  const taskForm = document.getElementById('task-form');
  const tasksInProgress = document.getElementById('tasksInProgress');
  const tasksCompleted = document.getElementById('tasksCompleted');

  let tasks = [];

  // Troca de secção
  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      navButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      const target = button.getAttribute('data-section');

      sections.forEach(section => {
        section.classList.toggle('active', section.id === target);
      });
    });
  });

  // Atualizar nome e preview do arquivo selecionado para logo
  const clientLogoInput = document.getElementById('clientLogo');
  clientLogoInput.addEventListener('change', () => {
    const file = clientLogoInput.files[0];
    if (file) {
      logoNameDisplay.textContent = `Imagem selecionada: ${file.name}`;

      const reader = new FileReader();
      reader.onload = e => {
        logoPreview.src = e.target.result;
        logoPreview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    } else {
      logoNameDisplay.textContent = "Nenhuma imagem selecionada";
      logoPreview.style.display = 'none';
      logoPreview.src = '';
    }
  });

  // Renderiza lista de clientes na UI
  function renderClients() {
    if (clients.length === 0) {
      clientListContainer.innerHTML = `<p>Nenhum cliente encontrado.</p>`;
      clientSelector.innerHTML = '<option value="" disabled selected>Selecionar cliente</option>';
      return;
    }

    clientListContainer.innerHTML = clients.map(client => `
      <article class="client-card" data-id="${client.id}">
        ${client.logoURL ? `<img src="${client.logoURL}" alt="${client.name} logo" class="client-logo" />` : ''}
        <div class="client-info">
          <div><strong>${client.name}</strong></div>
          <div>${client.email} — ${client.role || 'Sem cargo'}</div>
          <div><small><strong>UID:</strong> ${client.uid || 'Desconhecido'}</small></div>
        </div>
      </article>
    `).join('');

    clientSelector.innerHTML = '<option value="" disabled selected>Selecionar cliente</option>' +
      clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }

  // Busca clientes da Firestore
  async function fetchClients() {
    loader.classList.remove('hidden');
    try {
      const clientsCol = collection(db, 'clients');
      const clientsSnapshot = await getDocs(clientsCol);
      clients = [];

      clientsSnapshot.forEach(doc => {
        const data = doc.data();
        clients.push({
          id: doc.id,
          name: data.name,
          email: data.email,
          role: data.role,
          logoURL: data.logoURL || null,
          uid: data.uid || ''
        });
      });

      renderClients();
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      clientListContainer.innerHTML = `<p>Erro ao carregar clientes.</p>`;
    }
    loader.classList.add('hidden');
  }

  // --- FUNÇÕES DE TAREFAS ---

  // Busca tarefas para o cliente selecionado
  async function fetchTasksForClient(clientId) {
    if (!clientId) {
      tasks = [];
      renderTasks();
      return;
    }

    loader.classList.remove('hidden');

    try {
      const q = query(collection(db, 'tasks'), where('assignedTo', '==', clientId));
      const querySnapshot = await getDocs(q);

      tasks = [];
      querySnapshot.forEach(doc => {
        tasks.push({ id: doc.id, ...doc.data() });
      });

      renderTasks();
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
      alert('Erro ao buscar tarefas.');
    }

    loader.classList.add('hidden');
  }

  // Renderiza tarefas em Execução e Concluídas
  function renderTasks() {
  tasksInProgress.innerHTML = '';
  tasksCompleted.innerHTML = '';

  if (tasks.length === 0) {
    tasksInProgress.innerHTML = '<p>Nenhuma tarefa em execução.</p>';
    tasksCompleted.innerHTML = '<p>Nenhuma tarefa concluída.</p>';
    return;
  }

  const inProgressTasks = tasks.filter(t => t.status === 'pendente' || t.status === 'em andamento');
  const completedTasks = tasks.filter(t => t.status === 'concluída');

  if (inProgressTasks.length === 0) {
    tasksInProgress.innerHTML = '<p>Nenhuma tarefa em execução.</p>';
  } else {
    tasksInProgress.innerHTML = inProgressTasks.map(task => renderTaskCard(task)).join('');
  }

  if (completedTasks.length === 0) {
    tasksCompleted.innerHTML = '<p>Nenhuma tarefa concluída.</p>';
  } else {
    tasksCompleted.innerHTML = completedTasks.map(task => renderTaskCard(task, true)).join('');
  }

  // Event listeners para dropdown status
  document.querySelectorAll('.task-status-select').forEach(select => {
    select.addEventListener('change', handleTaskStatusChange);
  });

  // Event listeners para botões de excluir
  document.querySelectorAll('.delete-task-btn').forEach(button => {
    button.addEventListener('click', handleDeleteTask);
  });
}

function renderTaskCard(task, isCompleted = false) {
  return `
    <article 
      class="client-card task-card" 
      data-id="${task.id}"
      style="
        background: #fff; 
        border-radius: 14px; 
        padding: 20px 24px; 
        box-shadow: 0 4px 10px rgba(22, 54, 64, 0.08);
        color: #163640; 
        font-family: 'Inter', sans-serif;
        margin-bottom: 20px;
        user-select: none;
        text-align: left !important;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        position: relative;
      "
    >
      <h4 style="
        margin: 0 0 12px 0; 
        font-weight: 700; 
        font-size: 19px; 
        color: #ff6a00; 
        text-shadow: 0 0 3px rgba(255, 106, 0, 0.3);
        width: 100%;
        text-align: left !important;
      ">${task.title}</h4>

      <p style="
        color: #475d58; 
        white-space: pre-wrap; 
        word-break: break-word; 
        line-height: 1.2; 
        font-weight: 400; 
        letter-spacing: 0.01em;
        margin: 0 0 10px 0;
        user-select: text;
        width: 100%;
        text-align: left !important;
      ">${task.description}</p>

      <p style="margin: 0 0 8px 0; width: 100%; text-align: left !important;"><strong>Data entrega:</strong> ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Sem data'}</p>

      <p style="margin: 0 0 8px 0; width: 100%; text-align: left !important;"><strong>Prioridade:</strong> ${task.priority}</p>

      <p style="margin: 0 0 16px 0; width: 100%; text-align: left !important;"><strong>Comentário:</strong> ${task.comment || '-'}</p>

      <hr style="
        border: none; 
        border-top: 3px solid #ff6a00; 
        margin: 16px 0; 
        width: 100%;
      " />

      <label 
        style="
          display: flex; 
          align-items: center; 
          gap: 12px; 
          font-weight: 600; 
          color: #163640;
          user-select: none;
          width: 100%;
          justify-content: flex-start;
          text-align: left !important;
        "
      >
        Status:
        <select 
          class="task-status-select" 
          ${isCompleted ? 'disabled' : ''} 
          style="
            appearance: none;
            -webkit-appearance: none;
            -moz-appearance: none;
            cursor: ${isCompleted ? 'not-allowed' : 'pointer'};
            padding: 8px 24px;
            border-radius: 28px;
            border: 2px solid #ff6a00;
            background: linear-gradient(270deg, #ff6a00, #ff7d1f, #ff6a00);
            background-size: 600% 600%;
            color: white;
            font-weight: 700;
            font-family: 'Inter', sans-serif;
            text-transform: capitalize;
            box-shadow: 0 0 6px rgba(255, 106, 0, 0.6);
            transition: background-position 6s ease infinite, box-shadow 0.3s ease, transform 0.3s ease;
            outline: none;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 36px;
            width: auto;
            text-align: center;
          "
          onfocus="this.style.boxShadow='0 0 10px rgba(255, 140, 30, 0.9)';"
          onblur="this.style.boxShadow='0 0 6px rgba(255, 106, 0, 0.6)';"
          onchange="this.style.transform='scale(1.05)'; setTimeout(() => this.style.transform='scale(1)', 150);"
          ${isCompleted ? 'disabled' : ''}
        >
          <option value="pendente" ${task.status === 'pendente' ? 'selected' : ''}>Pendente</option>
          <option value="em andamento" ${task.status === 'em andamento' ? 'selected' : ''}>Em andamento</option>
          <option value="concluída" ${task.status === 'concluída' ? 'selected' : ''}>Concluída</option>
        </select>
      </label>

      <!-- Botão de excluir -->
      <button 
        class="delete-task-btn"
        aria-label="Excluir tarefa"
        style="
          position: absolute;
          top: 15px;
          right: 15px;
          background: transparent;
          border: none;
          cursor: pointer;
          color: #ff4c4c;
          font-size: 20px;
          user-select: none;
          transition: color 0.3s ease;
        "
        title="Excluir tarefa"
      >
        🗑️
      </button>
    </article>
  `;
}

  // Atualizar status da tarefa no Firebase e UI
  async function handleTaskStatusChange(e) {
    const select = e.target;
    const taskId = select.closest('.task-card').dataset.id;
    const newStatus = select.value;

    try {
      await updateDoc(doc(db, 'tasks', taskId), { status: newStatus });

      // Atualizar localmente e re-renderizar
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        task.status = newStatus;
      }
      renderTasks();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status.');
    }
  }

  async function handleDeleteTask(e) {
  const taskCard = e.target.closest('.task-card');
  if (!taskCard) return;

  const taskId = taskCard.dataset.id;

  if (!confirm('Tem certeza que deseja apagar esta tarefa?')) {
    return;
  }

  loader.classList.remove('hidden');

  try {
    await deleteDoc(doc(db, 'tasks', taskId));

    // Remover da lista local e re-renderizar
    tasks = tasks.filter(t => t.id !== taskId);
    renderTasks();

    showToast('Tarefa excluída com sucesso!');
  } catch (error) {
    console.error('Erro ao apagar tarefa:', error);
    alert('Erro ao apagar tarefa.');
  }

  loader.classList.add('hidden');
}

  // REMOVIDO: Evento seleção cliente tarefas
  // taskClientSelector.addEventListener('change', e => {
  //   selectedClientId = e.target.value;
  //   fetchTasksForClient(selectedClientId);
  // });

  // Evento submit formulário tarefas - usando clientSelector do header
  taskForm.addEventListener('submit', async e => {
    e.preventDefault();

    const selectedClientId = clientSelector.value;
    if (!selectedClientId) {
      alert('Por favor, selecione um cliente no menu superior antes de adicionar uma tarefa.');
      return;
    }

    const formData = new FormData(taskForm);

    const newTask = {
      title: formData.get('title').trim(),
      description: formData.get('description').trim(),
      dueDate: formData.get('dueDate'),
      priority: formData.get('priority'),
      comment: formData.get('comment').trim(),
      assignedTo: selectedClientId,
      status: 'pendente',
      createdAt: new Date()
    };

    loader.classList.remove('hidden');

    try {
      const taskRef = await addDoc(collection(db, 'tasks'), newTask);

      tasks.push({ id: taskRef.id, ...newTask });
      renderTasks();

      taskForm.reset();
      showToast('Tarefa adicionada com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error);
      alert('Erro ao adicionar tarefa.');
    }

    loader.classList.add('hidden');
  });

  // --- CLIENTES ---
  clientForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loader.classList.remove('hidden');

    try {
      const name = clientForm.clientName.value.trim();
      const email = clientForm.clientEmail.value.trim();
      const password = clientForm.clientPassword.value;
      const role = clientForm.clientRole.value.trim();
      const logoFile = clientForm.clientLogo.files[0];

      // Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Upload logo para Storage (se existir)
      let logoURL = null;
      if (logoFile) {
        try {
          const storageRef = ref(storage, `clientLogos/${user.uid}/${logoFile.name}`);
          await uploadBytes(storageRef, logoFile);
          logoURL = await getDownloadURL(storageRef);
          showToast("Logo carregado com sucesso!");
        } catch (uploadError) {
          console.error("Erro ao fazer upload do logo:", uploadError);
          showToast("Erro ao carregar logo.");
        }
      }

      // Criar doc no Firestore
      const clientsCol = collection(db, 'clients');
      const newClientRef = await addDoc(clientsCol, {
        uid: user.uid,
        name,
        email,
        role,
        logoURL,
        createdAt: new Date()
      });

      // Atualizar lista local e UI
      clients.push({
        id: newClientRef.id,
        name,
        email,
        role,
        logoURL,
      });

      renderClients();
      clientForm.reset();
      logoNameDisplay.textContent = "Nenhuma imagem selecionada";
      logoPreview.style.display = 'none';
      logoPreview.src = '';
      showToast("Cliente adicionado com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar cliente:", error);
      alert("Erro ao adicionar cliente: " + error.message);
    }

    loader.classList.add('hidden');
  });

  // Inicial fetch
  fetchClients();

  // Também atualiza as tarefas sempre que o cliente do header mudar
  clientSelector.addEventListener('change', () => {
    const clientId = clientSelector.value;
    fetchTasksForClient(clientId);
  });
});
