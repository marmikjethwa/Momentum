const apiUrl = "http://localhost:3000";
let selectedListId = null;
let currentListId = null;
let currentListName = null;

// function showRegister() {
//     document.querySelector('.login-box').style.display = 'none';
//     document.querySelector('.register-box').style.display = 'block';
// }

// function showLogin() {
//     document.querySelector('.register-box').style.display = 'none';
//     document.querySelector('.login-box').style.display = 'block';
// }

document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.container');
    const registerToggleBtn = document.querySelector('.register-btn'); 
    const loginToggleBtn = document.querySelector('.login-btn'); 
    const loginBtn = document.querySelector('.login-box .btn'); 
    const registerBtn = document.querySelector('.register-box .btn');

    registerToggleBtn.addEventListener('click', () => {
        container.classList.add('active');
    });

    loginToggleBtn.addEventListener('click', () => {
        container.classList.remove('active');
    });

    // Prevent duplicate event listeners
    if (registerBtn && !registerBtn.dataset.listenerAttached) {
        registerBtn.dataset.listenerAttached = "true"; 
        registerBtn.addEventListener('click', (event) => {
            event.preventDefault();
            register();
        });
    }

    if (loginBtn && !loginBtn.dataset.listenerAttached) {
        loginBtn.dataset.listenerAttached = "true"; 
        loginBtn.addEventListener('click', (event) => {
            event.preventDefault();
            login();
        });
    }
});

async function register() {
    const username = document.getElementById("register-username").value.trim();
    const password = document.getElementById("register-password").value.trim();

    if (!username || !password) {
        alert("Please enter both username and password.");
        return;
    }

    try {
        const response = await fetch(`${apiUrl}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();
        if (response.ok) {
            alert("Registration successful! Please login.");
            showLogin();
        } else {
            alert(result.error);
        }
    } catch (error) {
        alert("Error during registration. Please try again.");
    }
}

async function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const recaptchaResponse = grecaptcha.getResponse(); // Get reCAPTCHA response

    if (!username || !password) {
        alert("Please enter both username and password.");
        return;
    }

    if (!recaptchaResponse) {
        alert("Please complete the reCAPTCHA.");
        return;
    }

    try {
        const response = await fetch(`${apiUrl}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, recaptchaResponse })
        });

        const result = await response.json();
        if (response.ok) {
            localStorage.setItem("userId", result.userId);
            localStorage.setItem("username", username);
            window.location.href = "dashboard.html";
        } else {
            alert(result.error);
        }
    } catch (error) {
        alert("Error during login. Please try again.");
    }
}


function logout() {
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    window.location.href = "index.html";
}
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

function checkAuth() {
    const userId = localStorage.getItem("userId");
    if (!userId && !window.location.pathname.includes("index.html")) {
        window.location.href = "index.html";
    } else if (window.location.pathname.includes("dashboard.html")) {
        loadLists();
    }
}

function setupEventListeners() {
    // Modal close on outside click
    window.addEventListener('click', (event) => {
        const modals = document.getElementsByClassName('modal');
        Array.from(modals).forEach(modal => {
            if (event.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    // Close modal when clicking X button
    const closeButtons = document.getElementsByClassName('close-modal');
    Array.from(closeButtons).forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            closeModal(modal.id);
        });
    });

    // Handle Enter key in rename input
    const renameInput = document.getElementById('rename-input');
    if (renameInput) {
        renameInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                handleRename();
            }
        });
    }

    // Handle Escape key to close modals
    document.addEventListener('keyup', (event) => {
        if (event.key === 'Escape') {
            const modals = document.getElementsByClassName('modal');
            Array.from(modals).forEach(modal => {
                closeModal(modal.id);
            });
        }
    });
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'block';
    
    if (modalId === 'renameModal') {
        const input = document.getElementById('rename-input');
        input.value = currentListName;
        input.focus();
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
    currentListId = null;
    currentListName = null;
}

async function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const recaptchaResponse = grecaptcha.getResponse();

    if (!username || !password) {
        alert("Please enter both username and password.");
        return;
    }

    if (!recaptchaResponse) {
        alert("Please complete the reCAPTCHA.");
        return;
    }

    try {
        const response = await fetch(`${apiUrl}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, recaptchaResponse })
        });

        const result = await response.json();
        if (response.ok) {
            localStorage.setItem("userId", result.userId);
            localStorage.setItem("username", username);
            window.location.href = "dashboard.html";
        } else {
            alert(result.error);
        }
    } catch (error) {
        alert("Error during login. Please try again.");
    }
}

function logout() {
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    window.location.href = "index.html";
}

async function createList() {
    const userId = localStorage.getItem("userId");
    const name = document.getElementById("list-name").value.trim();
    
    if (!name) {
        alert("List name cannot be empty");
        return;
    }

    try {
        const response = await fetch(`${apiUrl}/lists`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, name })
        });

        if (response.ok) {
            document.getElementById("list-name").value = "";
            loadLists();
        } else {
            alert("Error creating list");
        }
    } catch (error) {
        alert("Error creating list. Please try again.");
    }
}

async function loadLists() {
    const userId = localStorage.getItem("userId");
    const username = localStorage.getItem("username");
    
    document.getElementById("welcome-message").textContent = `Welcome, ${username}!`;

    try {
        const response = await fetch(`${apiUrl}/lists/${userId}`);
        const lists = await response.json();

        const container = document.getElementById("lists-container");
        container.innerHTML = "";

        lists.forEach(list => {
            const listDiv = document.createElement("div");
            listDiv.className = "list-box";
            listDiv.innerHTML = `
                <h3 onclick="showTasks(${list.id}, '${list.name}')">${list.name}</h3>
                <p class="last-modified">Last modified: ${new Date(list.last_modified).toLocaleString()}</p>
                <div class="options-menu">
                    <button onclick="toggleOptions(${list.id})" class="options-btn">⋮</button>
                    <div id="options-${list.id}" class="options-content">
                        <a href="#" onclick="renameList(${list.id}, '${list.name}')">Rename</a>
                        <a href="#" onclick="confirmDeleteList(${list.id})">Delete</a>
                    </div>
                </div>
            `;
            container.appendChild(listDiv);
        });
    } catch (error) {
        alert("Error loading lists. Please try again.");
    }
}

function toggleOptions(listId) {
    const optionsContent = document.getElementById(`options-${listId}`);
    document.querySelectorAll('.options-content').forEach(menu => {
        if (menu.id !== `options-${listId}`) menu.classList.remove('show');
    });
    optionsContent.classList.toggle('show');
}

function renameList(listId, listName) {
    currentListId = listId;
    currentListName = listName;
    showModal('renameModal');
}

function confirmDeleteList(listId) {
    currentListId = listId;
    showModal('deleteModal');
}

async function handleRename() {
    const newName = document.getElementById('rename-input').value.trim();
    if (newName && newName !== currentListName) {
        try {
            const response = await fetch(`${apiUrl}/lists/${currentListId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName })
            });
            if (response.ok) {
                loadLists();
                closeModal('renameModal');
            }
        } catch (error) {
            console.error("Error renaming list:", error);
        }
    }
}

async function handleDelete() {
    try {
        const response = await fetch(`${apiUrl}/lists/${currentListId}`, { 
            method: "DELETE" 
        });
        if (response.ok) {
            if (selectedListId === currentListId) {
                backToLists();
            }
            loadLists();
            closeModal('deleteModal');
        }
    } catch (error) {
        console.error("Error deleting list:", error);
    }
}

function backToLists() {
    selectedListId = null;
    document.getElementById("tasks-container").style.display = "none";
    document.getElementById("lists-container").style.display = "grid";
}

async function showTasks(listId, listName) {
    selectedListId = listId;
    document.getElementById("selected-list-name").textContent = listName;
    document.getElementById("tasks-container").style.display = "block";
    document.getElementById("lists-container").style.display = "none";
    loadTasks(listId);
}

async function addTask() {
    if (!selectedListId) {
        alert("Please select a list first");
        return;
    }

    const content = document.getElementById("task-input").value.trim();
    if (!content) {
        alert("Task cannot be empty");
        return;
    }

    try {
        const response = await fetch(`${apiUrl}/tasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ listId: selectedListId, content })
        });

        if (response.ok) {
            document.getElementById("task-input").value = "";
            loadTasks(selectedListId);
        }
    } catch (error) {
        alert("Error adding task. Please try again.");
    }
}

async function loadTasks(listId) {
    try {
        const response = await fetch(`${apiUrl}/tasks/${listId}`);
        const tasks = await response.json();

        const taskList = document.getElementById("task-list");
        taskList.innerHTML = "";

        tasks.forEach(task => {
            const taskItem = document.createElement("li");
            taskItem.className = `task ${task.is_completed ? 'completed' : ''}`;
            taskItem.innerHTML = `
                <span ondblclick="editTask(${task.id}, '${task.content}')">${task.content}</span>
                <div class="task-actions">
                    <button onclick="toggleTask(${task.id})" class="toggle-btn">
                        ${task.is_completed ? '✓' : '○'}
                    </button>
                    <button onclick="deleteTask(${task.id})" class="delete-btn">×</button>
                </div>
            `;
            taskList.appendChild(taskItem);
        });
    } catch (error) {
        alert("Error loading tasks. Please try again.");
    }
}

async function editTask(taskId, currentContent) {
    const newContent = prompt("Edit task:", currentContent);
    if (newContent && newContent.trim() !== "" && newContent !== currentContent) {
        try {
            const response = await fetch(`${apiUrl}/tasks/${taskId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newContent })
            });
            if (response.ok) loadTasks(selectedListId);
        } catch (error) {
            alert("Error updating task. Please try again.");
        }
    }
}

async function toggleTask(taskId) {
    try {
        const response = await fetch(`${apiUrl}/tasks/${taskId}/toggle`, {
            method: "PATCH"
        });
        if (response.ok) loadTasks(selectedListId);
    } catch (error) {
        alert("Error updating task. Please try again.");
    }
}

async function deleteTask(taskId) {
    try {
        const response = await fetch(`${apiUrl}/tasks/${taskId}`, {
            method: "DELETE"
        });
        if (response.ok) loadTasks(selectedListId);
    } catch (error) {
        alert("Error deleting task. Please try again.");
    }
}

// Initialize dashboard if on dashboard page
if (window.location.pathname.includes("dashboard.html")) {
    loadLists();
}