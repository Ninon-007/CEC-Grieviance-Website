document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const studentGrievancesList = document.getElementById('student-grievances-list');
    const ticketForm = document.getElementById('ticketForm');
    const logoutBtn = document.getElementById('logout-btn-student');
    const toastContainer = document.getElementById('toast-container');
    const studentDashboardHeader = document.querySelector('#student-view h1');

    // Supabase Setup
    const SUPABASE_URL = 'https://vswelymucsciaezryaeo.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzd2VseW11Y3NjaWFlenJ5YWVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjI3NzEsImV4cCI6MjA3MjczODc3MX0.l8yPeocnNfJ0-eCwZsy_IpIIKrwRixatwchXgdcHozM';
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!loggedInUser || loggedInUser.role !== 'student') {
        window.location.href = '/';
        return;
    }
    
    studentDashboardHeader.textContent = `🎓 Welcome, ${loggedInUser.name}`;

    const showToast = (message, type = 'success') => {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    };
    
    const getStatusClass = (status) => {
        if (status === 'In Progress') return 'inprogress';
        return status.toLowerCase();
    };

    const renderStudentTickets = async () => {
        studentGrievancesList.innerHTML = '<h4>Loading tickets...</h4>';
        const { data: tickets, error } = await supabaseClient.from('grievanceticket').select('*').eq('student_id', loggedInUser.id).order('ticket_id', { ascending: false });

        if (error) {
            showToast('Could not fetch grievances.', 'error');
            studentGrievancesList.innerHTML = '<h4>Error loading tickets.</h4>';
            return;
        }

        if (tickets && tickets.length > 0) {
            const ticketIds = tickets.map(t => t.ticket_id);
            const { data: feedbacks } = await supabaseClient.from('feedback').select('*').in('ticket_id', ticketIds);

            const feedbackMap = new Map();
            if (feedbacks) {
                feedbacks.forEach(fb => feedbackMap.set(fb.ticket_id, fb.comment));
            }

            studentGrievancesList.innerHTML = tickets.map(ticket => {
                const adminFeedback = feedbackMap.get(ticket.ticket_id);
                return `
                <div class="ticket-item">
                    <div class="ticket-header">
                        <h4>${ticket.category} - ${ticket.block}</h4>
                        <span class="ticket-status status-${getStatusClass(ticket.status)}">${ticket.status}</span>
                    </div>
                    <p class="ticket-body">${ticket.description}</p>
                    ${adminFeedback ? `<div class="admin-feedback"><strong>Admin Feedback:</strong> ${adminFeedback}</div>` : ''}
                    <div class="ticket-footer">
                        <button class="btn-delete" data-ticket-id="${ticket.ticket_id}">Delete</button>
                    </div>
                </div>
            `}).join('');
        } else {
            studentGrievancesList.innerHTML = `<div class="empty-state"><h4>No Grievances Yet</h4><p>Use the form on the left to submit one.</p></div>`;
        }
    };

    const handleTicketSubmit = async (e) => {
        e.preventDefault();
        const description = document.getElementById('description').value.trim();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (description.length < 10) {
            showToast("Description must be at least 10 characters long.", "error");
            return;
        }
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        const newTicket = { student_id: loggedInUser.id, category: document.getElementById('category').value, block: document.getElementById('block').value, description, status: 'Pending' };
        const { error } = await supabaseClient.from('grievanceticket').insert([newTicket]);

        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Ticket';

        if (error) showToast(`Error: ${error.message}`, 'error');
        else {
            showToast("Grievance submitted successfully!");
            ticketForm.reset();
            await renderStudentTickets();
        }
    };
    
    // NEW: Function to handle deleting a ticket
    const handleDeleteTicket = async (ticketId) => {
        const isConfirmed = confirm('Are you sure you want to permanently delete this grievance?');
        if (isConfirmed) {
            const { error } = await supabaseClient.from('grievanceticket').delete().eq('ticket_id', ticketId);
            if (error) {
                showToast(`Error deleting ticket: ${error.message}`, 'error');
            } else {
                showToast('Grievance deleted successfully.');
                renderStudentTickets(); // Refresh the list
            }
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('loggedInUser');
        window.location.href = '/';
    };

    renderStudentTickets();
    ticketForm.addEventListener('submit', handleTicketSubmit);
    logoutBtn.addEventListener('click', handleLogout);
    
    // NEW: Event listener for delete buttons
    studentGrievancesList.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-delete')) {
            const ticketId = e.target.dataset.ticketId;
            handleDeleteTicket(ticketId);
        }
    });
});
