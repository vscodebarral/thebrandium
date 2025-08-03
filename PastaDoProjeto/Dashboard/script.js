// Inicializar o FullCalendar
document.addEventListener('DOMContentLoaded', function () {
  const calendarEl = document.getElementById('calendar');

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'pt',
    height: 'auto',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,listWeek'
    },
    events: [
      // Eventos simulados – depois vais puxar do Firebase
      {
        title: 'Publicar post Instagram',
        start: '2025-08-03',
        backgroundColor: '#ff6a00'
      },
      {
        title: 'Reunião com cliente',
        start: '2025-08-07T14:00:00',
        backgroundColor: '#163640'
      },
      {
        title: 'Enviar newsletter',
        start: '2025-08-10',
        backgroundColor: '#ff6a00'
      }
    ]
  });

  calendar.render();
});

// Exemplo simples de função para salvar tarefa (preparado para Firebase)
function saveData(type) {
  if (type === 'tarefas') {
    const task = document.querySelector('input[type="text"]').value;
    const date = document.querySelector('input[type="date"]').value;

    if (!task || !date) {
      alert('Preencha todos os campos.');
      return;
    }

    // Lógica futura para Firebase aqui
    console.log('Tarefa:', task);
    console.log('Data:', date);

    alert('Tarefa guardada! (ligação ao Firebase ainda por fazer)');
  }
}
