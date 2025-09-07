document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('login-message');
    const toastContainer = document.getElementById('toast-container');
    const passwordInput = document.getElementById('password');
    const passwordToggleBtn = document.getElementById('password-toggle');
    const eyeOpenIcon = document.getElementById('eye-open');
    const eyeClosedIcon = document.getElementById('eye-closed');

    const SUPABASE_URL = 'https://vswelymucsciaezryaeo.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzd2VseW11Y3NjaWFlenJ5YWVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjI3NzEsImV4cCI6MjA3MjczODc3MX0.l8yPeocnNfJ0-eCwZsy_IpIIKrwRixatwchXgdcHozM';
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const showToast = (message, type = 'success') => {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    };

    // Redirect if already logged in
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    if (loggedInUser) {
        const user = JSON.parse(loggedInUser);
        if (user.role === 'student') window.location.href = 'student.html';
        else if (user.role === 'admin') window.location.href = 'admin.html';
    }

    const handleLogin = async (e) => {
        e.preventDefault();
        loginMessage.textContent = '';
        const username = document.getElementById('username').value.trim();
        const password = passwordInput.value;
        const role = document.getElementById('role').value;

        if (!username || !password || !role) {
            loginMessage.textContent = 'Please fill in all fields.';
            return;
        }
        
        const tableName = role === 'student' ? 'student' : 'admin';
        const idColumn = role === 'student' ? 'student_id' : 'admin_id';

        const { data, error } = await supabaseClient.from(tableName).select('*').eq(idColumn, username).single();

        if (error || !data) {
            loginMessage.textContent = 'Invalid user ID or role.';
            return;
        }

        if (data.password !== password) {
            loginMessage.textContent = 'Incorrect password.';
            return;
        }

        const userToStore = { id: data[idColumn], name: data.name, role: role };
        sessionStorage.setItem('loggedInUser', JSON.stringify(userToStore));
        showToast('Login successful! Redirecting...', 'success');

        setTimeout(() => {
            if (role === 'student') window.location.href = 'student.html';
            else if (role === 'admin') window.location.href = 'admin.html';
        }, 1500);
    };
    
    // NEW: Password toggle logic
    const togglePasswordVisibility = () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        eyeOpenIcon.style.display = isPassword ? 'none' : 'block';
        eyeClosedIcon.style.display = isPassword ? 'block' : 'none';
    };

    loginForm.addEventListener('submit', handleLogin);
    passwordToggleBtn.addEventListener('click', togglePasswordVisibility);
});