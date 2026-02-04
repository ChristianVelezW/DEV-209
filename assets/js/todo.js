const API_URL = 'http://localhost:3000';

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

        // --- RESTORE EMAIL LOGIC ---
        const savedEmail = localStorage.getItem('rememberedEmail');
        const emailInput = document.getElementById('login-email');
        const rememberCheckbox = document.getElementById('remember-me');
        
        // Always clear password security
        document.getElementById('login-password').value = '';

        if (savedEmail) {
            emailInput.value = savedEmail;
            if(rememberCheckbox) rememberCheckbox.checked = true;
        } else {
            emailInput.value = '';
            if(rememberCheckbox) rememberCheckbox.checked = false;
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

    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);

        if (!response.ok) {

            if (response.status === 401) {
                return null;
            }

            const error = await response.json().catch(() => ({ message: 'Action failed' }));
            alert(error.message || 'Action failed');
            return null;
        }
        
        if (response.status === 204 || (response.status === 200 && method === 'DELETE')) {
            return { success: true };
        }

        return await response.json();
    } catch (err) {
        console.error(err);
        return null;
    }
}

// --- Auth Toggles (Switch between Login/Register) ---
document.getElementById('show-register').onclick = (e) => {
    e.preventDefault();
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'flex';
};

document.getElementById('show-login').onclick = (e) => {
    e.preventDefault();
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'flex';
};

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
    const rememberMe = document.getElementById('remember-me').checked;
    const data = await apiRequest('/login', 'POST', { email, password });
    if (data && data.token) {
        // Save email to localStorage if checked
        if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }
        setCookie('authToken', data.token);
        checkAuth();
    } else {
        alert("Invalid login credentials");
    }
};

// Logout
document.getElementById('logout-btn').onclick = () => {
    // 1. Clear the Auth Token
    deleteCookie('authToken');
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
                    <button onclick="updateTodo('${todo.id}', ${!todo.completed})">
                        ${todo.completed ? 'Undo' : 'Complete'}
                    </button>
                    <button onclick="editTodo('${todo.id}', '${todo.title}', '${todo.description}')">Edit</button>
                    <button onclick="deleteTodo('${todo.id}')">Delete</button>
                </div>
            `;
            list.appendChild(li);
        });
    }
}

// Delete Todo
window.deleteTodo = async (id) => {
    console.log("Deleting item:", id);
    const result = await apiRequest(`/todos/${id}`, 'DELETE');
    
    if (result) {
        console.log("Server confirmed deletion. Refreshing UI...");
        await loadTodos(); // This re-draws the list from the server
    }
};

// Toggle Complete
window.updateTodo = async (id, status) => {
    const result = await apiRequest(`/todos/${id}`, 'PUT', { completed: status });
    if (result) await loadTodos();
};

window.editTodo = async (id, oldTitle, oldDesc) => {
    const title = prompt("New Title:", oldTitle);
    const description = prompt("New Description:", oldDesc);
    if (title !== null) {
        const result = await apiRequest(`/todos/${id}`, 'PUT', { title, description });
        if (result) await loadTodos();
    }
};

// Initialize
checkAuth();