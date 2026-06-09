const API_URL =
  window.LISTIFY_API_URL ||
  (window.location.protocol === "file:" ? "http://localhost:8080/tasks" : "/tasks");

const taskList = document.querySelector("#taskList");
const taskCount = document.querySelector("#taskCount");
const modalBackdrop = document.querySelector("#modalBackdrop");
const openModalBtn = document.querySelector("#openModalBtn");
const closeModalBtn = document.querySelector("#closeModalBtn");
const taskForm = document.querySelector("#taskForm");
const titleInput = document.querySelector("#titleInput");
const descriptionInput = document.querySelector("#descriptionInput");
const modalTitle = document.querySelector("#modalTitle");

let tasks = [];
let editingTaskId = null;

const icons = {
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m20 6-11 11-5-5"/></svg>',
  edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>'
};

function escapeHtml(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

async function request(path = "", options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

function sortTasks(items) {
  return [...items].sort((a, b) => {
    if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

function updateCount() {
  const active = tasks.filter((task) => !task.completed).length;
  taskCount.textContent = `${active} active`;
}

function renderTasks() {
  updateCount();

  if (!tasks.length) {
    taskList.innerHTML = '<p class="empty-state">No tasks yet.</p>';
    return;
  }

  taskList.innerHTML = sortTasks(tasks)
    .map((task) => {
      const description = task.description
        ? `<p class="task-description">${escapeHtml(task.description)}</p>`
        : "";

      return `
        <article class="task-card ${task.completed ? "is-completed" : ""}" data-id="${task._id}">
          <button
            class="check-button ${task.completed ? "is-checked" : ""}"
            type="button"
            aria-label="${task.completed ? "Mark task active" : "Mark task completed"}"
            data-action="toggle"
          >
            ${icons.check}
          </button>

          <div class="task-card__content">
            <h3 class="task-title">${escapeHtml(task.title)}</h3>
            ${description}
            <time class="task-date" datetime="${task.createdAt}">${formatDate(task.createdAt)}</time>
          </div>

          <div class="task-actions">
            <button class="icon-button" type="button" aria-label="Edit task" data-action="edit">
              ${icons.edit}
            </button>
            <button class="icon-button icon-button--danger" type="button" aria-label="Delete task" data-action="delete">
              ${icons.trash}
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadTasks() {
  taskList.innerHTML = '<p class="loading-state">Loading tasks...</p>';

  try {
    const data = await request();
    tasks = data.tasks || [];
    renderTasks();
  } catch (error) {
    taskList.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
  }
}

function openModal(task = null) {
  editingTaskId = task?._id || null;
  modalTitle.textContent = editingTaskId ? "Edit task" : "New task";
  titleInput.value = task?.title || "";
  descriptionInput.value = task?.description || "";
  modalBackdrop.classList.add("is-open");
  modalBackdrop.setAttribute("aria-hidden", "false");
  window.setTimeout(() => titleInput.focus(), 120);
}

function closeModal() {
  modalBackdrop.classList.remove("is-open");
  modalBackdrop.setAttribute("aria-hidden", "true");
  taskForm.reset();
  editingTaskId = null;
  openModalBtn.focus();
}

async function saveTask(event) {
  event.preventDefault();

  const payload = {
    title: titleInput.value.trim(),
    description: descriptionInput.value.trim()
  };

  if (!payload.title) {
    titleInput.focus();
    return;
  }

  const existingTask = tasks.find((task) => task._id === editingTaskId);
  const options = {
    method: editingTaskId ? "PUT" : "POST",
    body: JSON.stringify({
      ...payload,
      completed: existingTask?.completed || false
    })
  };

  const data = await request(editingTaskId ? `/${editingTaskId}` : "", options);

  if (editingTaskId) {
    tasks = tasks.map((task) => (task._id === editingTaskId ? data.task : task));
  } else {
    tasks = [data.task, ...tasks];
  }

  closeModal();
  renderTasks();
}

async function toggleTask(taskId) {
  const task = tasks.find((item) => item._id === taskId);
  if (!task) return;

  const nextTask = { ...task, completed: !task.completed };
  tasks = tasks.map((item) => (item._id === taskId ? nextTask : item));
  renderTasks();

  try {
    const data = await request(`/${taskId}`, {
      method: "PUT",
      body: JSON.stringify({
        title: task.title,
        description: task.description || "",
        completed: nextTask.completed
      })
    });
    tasks = tasks.map((item) => (item._id === taskId ? data.task : item));
    renderTasks();
  } catch (error) {
    tasks = tasks.map((item) => (item._id === taskId ? task : item));
    renderTasks();
  }
}

async function deleteTask(taskId) {
  const card = taskList.querySelector(`[data-id="${taskId}"]`);
  card?.classList.add("is-removing");
  await new Promise((resolve) => window.setTimeout(resolve, 220));
  await request(`/${taskId}`, { method: "DELETE" });
  tasks = tasks.filter((task) => task._id !== taskId);
  renderTasks();
}

taskList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  const card = event.target.closest(".task-card");

  if (!button || !card) return;

  const taskId = card.dataset.id;
  const task = tasks.find((item) => item._id === taskId);

  if (button.dataset.action === "toggle") toggleTask(taskId);
  if (button.dataset.action === "edit" && task) openModal(task);
  if (button.dataset.action === "delete") deleteTask(taskId);
});

openModalBtn.addEventListener("click", () => openModal());
closeModalBtn.addEventListener("click", closeModal);
taskForm.addEventListener("submit", saveTask);

modalBackdrop.addEventListener("click", (event) => {
  if (event.target === modalBackdrop) closeModal();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modalBackdrop.classList.contains("is-open")) {
    closeModal();
  }
});

loadTasks();
