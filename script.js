const apiUrl = "http://localhost:3000";
let selectedListId = null;

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
    const registerBtn = document.querySelector('.register-btn');
    const loginBtn = document.querySelector('.btn'); // Corrected selector

    if (registerBtn && loginBtn) {
        registerBtn.addEventListener('click', () => {
            container.classList.add('active');
        });

        loginBtn.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent form submission
            login();
        });
    } else {
        console.error("Buttons not found. Check HTML structure.");
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

async function renameList(listId, currentName) {
    const newName = prompt("Enter new list name:", currentName);
    if (newName && newName.trim() !== "" && newName !== currentName) {
        try {
            const response = await fetch(`${apiUrl}/lists/${listId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName })
            });
            if (response.ok) loadLists();
        } catch (error) {
            alert("Error renaming list. Please try again.");
        }
    }
}

function confirmDeleteList(listId) {
    if (confirm("Are you sure you want to delete this list?")) {
        deleteList(listId);
    }
}

async function deleteList(listId) {
    try {
        const response = await fetch(`${apiUrl}/lists/${listId}`, { 
            method: "DELETE" 
        });
        if (response.ok) {
            if (selectedListId === listId) {
                backToLists();
            }
            loadLists();
        }
    } catch (error) {
        alert("Error deleting list. Please try again.");
    }
}

function backToLists() {
    selectedListId = null;
    document.getElementById("tasks-container").style.display = "none";
    loadLists();
}

async function showTasks(listId, listName) {
    selectedListId = listId;
    document.getElementById("selected-list-name").textContent = listName;
    document.getElementById("tasks-container").style.display = "block";
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