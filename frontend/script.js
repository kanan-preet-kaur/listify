const taskList = document.getElementById('task-list');
const taskForm = document.getElementById('task-form');
const modalOverlay = document.getElementById('modal-overlay');
const openModalBtn = document.getElementById('open-modal');
const closeModalBtn = document.getElementById('close-modal');
const modalTitle = document.getElementById('modal-title');

let tasks = [];

// Initialize
document.addEventListener('DOMContentLoaded', fetchTasks);

// Fetch all tasks
async function fetchTasks() {
    try {
        const response = await fetch('/tasks');
        const data = await response.json();
        tasks = data.tasks || [];
        renderTasks();
    } catch (error) {
        console.error('Error fetching tasks:', error);
        taskList.innerHTML = '<p class="error">Failed to load tasks. Please try again.</p>';
    }
}

// Render tasks to the UI
function renderTasks() {
    if (tasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <p>No tasks yet. Start by creating one!</p>
            </div>
        `;
        return;
    }

    taskList.innerHTML = tasks.map(task => `
        <div class="task-card ${task.completed ? 'completed' : ''}" data-id="${task._id}">
            <div class="checkbox-wrapper" onclick="toggleTask('${task._id}', ${task.completed})">
                <div class="custom-checkbox ${task.completed ? 'checked' : ''}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
            </div>
            <div class="task-content">
                <h3 class="task-title">${task.title}</h3>
                ${task.description ? `<p class="task-desc">${task.description}</p>` : ''}
            </div>
            <div class="task-actions">
                <button class="action-btn" onclick="editTask('${task._id}')" title="Edit">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="action-btn delete" onclick="deleteTask('${task._id}')" title="Delete">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </div>
        </div>
    `).join('');
}

// Open/Close Modal
openModalBtn.addEventListener('click', () => {
    modalTitle.textContent = 'Create New Task';
    taskForm.reset();
    document.getElementById('task-id').value = '';
    modalOverlay.classList.add('active');
});

closeModalBtn.addEventListener('click', () => {
    modalOverlay.classList.remove('active');
});

// Create or Update Task
taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('task-id').value;
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;

    let taskData = { title, description };
    
    try {
        let response;
        if (id) {
            // Preserve completed status when updating
            const existingTask = tasks.find(t => t._id === id);
            taskData.completed = existingTask ? existingTask.completed : false;

            // Update
            response = await fetch(`/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });
        } else {
            // Create
            response = await fetch('/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });
        }

        if (response.ok) {
            modalOverlay.classList.remove('active');
            fetchTasks();
        }
    } catch (error) {
        console.error('Error saving task:', error);
    }
});

// Toggle Task Completion
async function toggleTask(id, currentStatus) {
    try {
        const task = tasks.find(t => t._id === id);
        const response = await fetch(`/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                ...task,
                completed: !currentStatus 
            })
        });

        if (response.ok) {
            fetchTasks();
        }
    } catch (error) {
        console.error('Error toggling task:', error);
    }
}

// Delete Task
async function deleteTask(id) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
        const response = await fetch(`/tasks/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            fetchTasks();
        }
    } catch (error) {
        console.error('Error deleting task:', error);
    }
}

// Edit Task (Pre-fill modal)
function editTask(id) {
    const task = tasks.find(t => t._id === id);
    if (!task) return;

    document.getElementById('task-id').value = task._id;
    document.getElementById('title').value = task.title;
    document.getElementById('description').value = task.description || '';
    
    modalTitle.textContent = 'Edit Task';
    modalOverlay.classList.add('active');
}

// Close modal on click outside
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        modalOverlay.classList.remove('active');
    }
});
