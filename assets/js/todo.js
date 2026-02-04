const API_URL = 'http://localhost:3000'; // Change this to your backend port

// --- Cookie Helpers ---
function setCookie(name, value, days = 1) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i=0; i < ca.length; i++) {
        let c = ca[i].trim();
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function deleteCookie(name) {
    document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

// --- UI Toggling ---
function checkAuth() {
    const token = getCookie('authToken');
    const authSection = document.getElementById('auth-container');
    const todoSection = document.getElementById('todo-container');

    if (token) {
        authSection.style.display = 'none';
        todoSection.style.display = 'block';
        loadTodos();
    } else {
        authSection.style.display = 'block';
        todoSection.style.display = 'none';
        
        // Reset inputs whenever the Auth screen is shown
        document.getElementById('login-password').value = '';
        if (!localStorage.getItem('rememberedEmail')) {
            document.getElementById('login-email').value = '';
        }
    }
}

// --- API Calls ---
async function apiRequest(endpoint, method = 'GET', body = null) {
    const token = getCookie('authToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${API_URL}${endpoint}`, options);
    if (!response.ok) {
        const error = await response.json();
        alert(error.message || 'Action failed');
        return null;
    }
    return response.json();
}

// --- Event Listeners ---

// Register
document.getElementById('register-form').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const data = await apiRequest('/register', 'POST', { email, password });
    if (data) alert('Registration successful! Please login.');
};

// Login
document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const data = await apiRequest('/login', 'POST', { email, password });
    if (data && data.token) {
        setCookie('authToken', data.token);
        checkAuth();
    }
};

// Logout
document.getElementById('logout-btn').onclick = () => {
    // 1. Clear the Auth Token
    deleteCookie('authToken');

    // 2. Clear the input fields in the UI
    const loginEmailInput = document.getElementById('login-email');
    const loginPassInput = document.getElementById('login-password');
    const savedEmail = localStorage.getItem('rememberedEmail');

    // Always clear the password
    loginPassInput.value = '';

    // Only keep the email if "Remember Me" was used
    if (savedEmail) {
        loginEmailInput.value = savedEmail;
    } else {
        loginEmailInput.value = '';
    }

    // 3. Toggle the UI back to the login screen
    checkAuth();
};

// Create Todo
document.getElementById('todo-form').onsubmit = async (e) => {
    e.preventDefault();
    const title = document.getElementById('todo-title').value;
    const description = document.getElementById('todo-desc').value;
    const data = await apiRequest('/todos', 'POST', { title, description });
    if (data) {
        e.target.reset();
        loadTodos();
    }
};

// Load/Render Todos
async function loadTodos() {
    const todos = await apiRequest('/todos');
    const list = document.getElementById('todo-list');
    list.innerHTML = '';
    
    if (todos) {
        todos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <span><strong>${todo.title}</strong>: ${todo.description}</span>
                <div class="todo-actions">
                    <button onclick="updateTodo('${todo._id}', ${!todo.completed})">
                        ${todo.completed ? 'Undo' : 'Complete'}
                    </button>
                    <button onclick="editTodo('${todo._id}', '${todo.title}', '${todo.description}')">Edit</button>
                    <button onclick="deleteTodo('${todo._id}')">Delete</button>
                </div>
            `;
            list.appendChild(li);
        });
    }
}

// Delete Todo
window.deleteTodo = async (id) => {
    await apiRequest(`/todos/${id}`, 'DELETE');
    loadTodos();
};

// Toggle Complete
window.updateTodo = async (id, status) => {
    await apiRequest(`/todos/${id}`, 'PUT', { completed: status });
    loadTodos();
};

// Edit (Simple prompt-based edit)
window.editTodo = async (id, oldTitle, oldDesc) => {
    const title = prompt("New Title:", oldTitle);
    const description = prompt("New Description:", oldDesc);
    if (title !== null) {
        await apiRequest(`/todos/${id}`, 'PUT', { title, description });
        loadTodos();
    }
};

// Initialize
checkAuth();