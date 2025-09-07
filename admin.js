document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const adminTicketsTableBody = document.getElementById('admin-tickets-table');
    const logoutBtn = document.getElementById('logout-btn-admin');
    const generateReportBtn = document.getElementById('generate-report-btn');
    const latestReportDisplay = document.getElementById('latest-report-display');
    const toastContainer = document.getElementById('toast-container');
    const adminDashboardHeader = document.querySelector('#admin-view h1');
    const modal = document.getElementById('description-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalDescriptionText = document.getElementById('modal-description-text');
    // NEW: Filter DOM Elements
    const filterBlock = document.getElementById('filter-block');
    const filterCategory = document.getElementById('filter-category');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');

    // Supabase Setup
    const SUPABASE_URL = 'https://vswelymucsciaezryaeo.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzd2VseW11Y3NjaWFlenJ5YWVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjI3NzEsImV4cCI6MjA3MjczODc3MX0.l8yPeocnNfJ0-eCwZsy_IpIIKrwRixatwchXgdcHozM';
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    let chartInstances = {};
    let allTickets = [];
    // NEW: Filter State
    let currentBlockFilter = 'all';
    let currentCategoryFilter = 'all';

    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!loggedInUser || loggedInUser.role !== 'admin') {
        window.location.href = '/';
        return;
    }
    adminDashboardHeader.textContent = `🛠️ Welcome, ${loggedInUser.name}`;

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

    const updateUI = () => {
        // NEW: Apply filters before rendering
        let filteredTickets = allTickets;
        if (currentBlockFilter !== 'all') {
            filteredTickets = filteredTickets.filter(ticket => ticket.block === currentBlockFilter);
        }
        if (currentCategoryFilter !== 'all') {
            filteredTickets = filteredTickets.filter(ticket => ticket.category === currentCategoryFilter);
        }

        adminTicketsTableBody.innerHTML = filteredTickets.map(ticket => `
            <tr>
                <td>${ticket.student_id}</td>
                <td>${ticket.category}</td>
                <td><button class="btn-view-desc" data-ticket-id="${ticket.ticket_id}">View</button></td>
                <td><span class="ticket-status status-${getStatusClass(ticket.status)}">${ticket.status}</span></td>
                <td>
                    <select class="action-select" data-id="${ticket.ticket_id}" data-current-status="${ticket.status}">
                        <option value="Pending" ${ticket.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="In Progress" ${ticket.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                        <option value="Resolved" ${ticket.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                    </select>
                </td>
                <td>
                    <form class="feedback-form" data-ticket-id="${ticket.ticket_id}" data-student-id="${ticket.student_id}">
                        <input type="text" placeholder="Add a comment..." name="feedback_comment" required />
                        <button type="submit" aria-label="Send Feedback"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086L2.279 16.76a.75.75 0 00.95.826l16-5.333a.75.75 0 000-1.418l-16-5.333z" /></svg></button>
                    </form>
                </td>
            </tr>
        `).join('');

        const statusCounts = filteredTickets.reduce((acc, t) => ({ ...acc, [t.status]: (acc[t.status] || 0) + 1 }), {});
        document.getElementById('stats-total').textContent = filteredTickets.length;
        document.getElementById('stats-pending').textContent = statusCounts['Pending'] || 0;
        document.getElementById('stats-progress').textContent = statusCounts['In Progress'] || 0;
        document.getElementById('stats-resolved').textContent = statusCounts['Resolved'] || 0;
        updateCharts(filteredTickets);
    };

    const updateCharts = (data) => {
        const statusCounts = data.reduce((acc, t) => ({ ...acc, [t.status]: (acc[t.status] || 0) + 1 }), {});
        const categoryCounts = data.reduce((acc, t) => ({ ...acc, [t.category]: (acc[t.category] || 0) + 1 }), {});
        Chart.defaults.color = '#9CA3AF';
        const statusCtx = document.getElementById('statusChart').getContext('2d');
        if (chartInstances.status) chartInstances.status.destroy();
        chartInstances.status = new Chart(statusCtx, { type: 'doughnut', data: { labels: ['Pending', 'In Progress', 'Resolved'], datasets: [{ data: [statusCounts['Pending'] || 0, statusCounts['In Progress'] || 0, statusCounts['Resolved'] || 0], backgroundColor: ['#FBBF24', '#60A5FA', '#4ADE80'], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } } });
        const categoryCtx = document.getElementById('categoryChart').getContext('2d');
        if (chartInstances.category) chartInstances.category.destroy();
        chartInstances.category = new Chart(categoryCtx, { type: 'bar', data: { labels: Object.keys(categoryCounts), datasets: [{ label: 'Tickets', data: Object.values(categoryCounts), backgroundColor: '#8B5CF6', borderRadius: 5 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' } }, x: { grid: { display: false } } } } });
    };

    const fetchInitialData = async () => {
        const { data, error } = await supabaseClient.from('grievanceticket').select('*').order('ticket_id', { ascending: false });
        if (error) showToast('Failed to fetch ticket data.', 'error');
        else { allTickets = data; updateUI(); }
    };

    const fetchLatestReport = async () => {
        const { data } = await supabaseClient.from('report').select('*').order('generated_at', { ascending: false }).limit(1).single();
        if (data) { latestReportDisplay.innerHTML = `<strong>Last Report (${new Date(data.generated_at).toLocaleString('en-IN')}):</strong> ${data.type}`; }
        else { latestReportDisplay.textContent = 'No reports generated yet.'; }
    };

    const openModal = (ticketId) => {
        const ticket = allTickets.find(t => t.ticket_id === ticketId);
        if (ticket) {
            modalDescriptionText.textContent = ticket.description;
            modal.style.display = 'flex';
            document.body.classList.add('modal-open');
        }
    };
    const closeModal = () => {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    };
    
    const handleTableClick = (e) => {
        if (e.target.classList.contains('btn-view-desc')) {
            const ticketId = parseInt(e.target.dataset.ticketId);
            openModal(ticketId);
        }
    };

    const handleStatusChange = async (e) => {
        if (e.target.classList.contains('action-select')) {
            const ticketId = parseInt(e.target.dataset.id);
            const newStatus = e.target.value;
            const currentStatus = e.target.dataset.currentStatus;
            if (newStatus === currentStatus) return;
            const { error } = await supabaseClient.from('grievanceticket').update({ status: newStatus }).eq('ticket_id', ticketId);
            if (error) showToast(`Update failed: ${error.message}`, 'error');
            else { showToast(`Ticket #${ticketId} status updated.`); fetchInitialData(); }
        }
    };

    const handleFeedbackSubmit = async (e) => {
        if (e.target.closest('.feedback-form')) {
            e.preventDefault();
            const form = e.target.closest('.feedback-form');
            const { ticketId, studentId } = form.dataset;
            const comment = form.querySelector('input[name="feedback_comment"]').value;
            const { error } = await supabaseClient.from('feedback').insert([{ ticket_id: ticketId, student_id: studentId, comment }]);
            if (error) showToast(`Feedback failed: ${error.message}`, 'error');
            else { showToast('Feedback sent successfully!'); form.reset(); }
        }
    };

    const handleGenerateReport = async () => {
        const resolvedCount = allTickets.filter(t => t.status === 'Resolved').length;
        const pendingCount = allTickets.filter(t => t.status === 'Pending').length;
        const reportContent = `Summary: ${allTickets.length} total tickets (${resolvedCount} resolved, ${pendingCount} pending).`;
        const { error } = await supabaseClient.from('report').insert([{ admin_id: loggedInUser.id, type: reportContent }]);
        if (error) showToast(`Report generation failed: ${error.message}`, 'error');
        else { showToast('New report generated successfully!'); fetchLatestReport(); }
    };
    
    const handleLogout = () => {
        sessionStorage.removeItem('loggedInUser');
        window.location.href = '/';
    };
    
    // NEW: Event handlers for filters
    filterBlock.addEventListener('change', (e) => {
        currentBlockFilter = e.target.value;
        updateUI();
    });
    
    filterCategory.addEventListener('change', (e) => {
        currentCategoryFilter = e.target.value;
        updateUI();
    });
    
    clearFiltersBtn.addEventListener('click', () => {
        currentBlockFilter = 'all';
        currentCategoryFilter = 'all';
        filterBlock.value = 'all';
        filterCategory.value = 'all';
        updateUI();
    });

    // Initial Load and Event Listeners
    fetchInitialData();
    fetchLatestReport();
    adminTicketsTableBody.addEventListener('change', handleStatusChange);
    adminTicketsTableBody.addEventListener('submit', handleFeedbackSubmit);
    adminTicketsTableBody.addEventListener('click', handleTableClick);
    generateReportBtn.addEventListener('click', handleGenerateReport);
    logoutBtn.addEventListener('click', handleLogout);
    
    modalCloseBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
});
