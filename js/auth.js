// ============================================================
// AUTH HELPERS
// ============================================================

async function getCurrentEmployee() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('employees')
    .select('*, jabatan(nama, division_id, divisions(nama))')
    .eq('user_id', user.id)
    .single();
  if (error || !data) return null;
  return data;
}

async function requireAuth() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    window.location.href = '/index.html';
    return null;
  }
  const emp = await getCurrentEmployee();
  if (!emp) {
    await supabase.auth.signOut();
    window.location.href = '/index.html';
    return null;
  }
  return emp;
}

async function requireRole(roles) {
  const emp = await requireAuth();
  if (!emp) return null;
  if (!roles.includes(emp.role)) {
    showToast('Akses ditolak. Anda tidak memiliki izin.', 'error');
    setTimeout(() => { window.location.href = '/dashboard.html'; }, 1500);
    return null;
  }
  return emp;
}

async function logout() {
  await supabase.auth.signOut();
  window.location.href = '/index.html';
}

function formatRupiah(n) {
  if (n === null || n === undefined || isNaN(n)) return 'Rp 0';
  const num = Math.abs(Math.round(Number(n)));
  const formatted = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (Number(n) < 0 ? '-' : '') + 'Rp ' + formatted;
}

function formatPoin(n) {
  if (n === null || n === undefined || isNaN(n)) return '0';
  const num = Number(n);
  if (Math.abs(num) >= 1000) {
    return (num / 1000).toFixed(1).replace('.0', '') + 'k';
  }
  return num.toFixed(1).replace('.0', '');
}

function getPeriodLabel(period) {
  if (!period) return '';
  const [year, month] = period.split('-');
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return months[parseInt(month) - 1] + ' ' + year;
}

function getCurrentPeriod() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getSidebar(role, activePage) {
  const allLinks = [
    { href: '/dashboard.html', icon: '&#9732;', label: 'Dashboard', roles: ['karyawan', 'hr', 'finance', 'ceo'] },
    { href: '/kpi/view.html', icon: '&#9733;', label: 'KPI Saya', roles: ['karyawan', 'hr', 'finance', 'ceo'] },
    { href: '/kpi/input.html', icon: '&#9998;', label: 'Input KPI', roles: ['hr', 'ceo'] },
    { href: '/kpi/template.html', icon: '&#9889;', label: 'Template KPI', roles: ['hr', 'ceo'] },
    { href: '/admin/employees.html', icon: '&#9824;', label: 'Karyawan', roles: ['hr', 'ceo'] },
    { href: '/admin/products.html', icon: '&#9827;', label: 'Produk', roles: ['hr', 'ceo'] },
    { href: '/payroll/index.html', icon: '&#9829;', label: 'Payroll', roles: ['finance', 'ceo'] },
    { href: '/admin/settings.html', icon: '&#9881;', label: 'Pengaturan', roles: ['finance', 'ceo'] },
  ];

  const visibleLinks = allLinks.filter(l => l.roles.includes(role));
  const currentPath = window.location.pathname;

  const navItems = visibleLinks.map(link => {
    const isActive = currentPath.includes(link.href.replace('/index.html', '').replace('/dashboard.html', ''));
    const activeClass = (currentPath === link.href || (link.href !== '/dashboard.html' && currentPath.includes(link.href))) ? 'active' : '';
    return `
      <a href="${link.href}" class="nav-link ${activeClass}">
        <span class="nav-icon">${link.icon}</span>
        <span class="nav-label">${link.label}</span>
      </a>
    `;
  }).join('');

  return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <div class="logo-icon">ADS</div>
          <div class="logo-text">
            <div class="logo-name">KPI System</div>
            <div class="logo-sub">Albanna Digital</div>
          </div>
        </div>
      </div>
      <nav class="sidebar-nav">
        ${navItems}
      </nav>
      <div class="sidebar-footer">
        <div class="user-info" id="sidebarUserInfo">
          <div class="user-avatar" id="sidebarAvatar">-</div>
          <div class="user-details">
            <div class="user-name" id="sidebarUserName">Loading...</div>
            <div class="user-role" id="sidebarUserRole">-</div>
          </div>
        </div>
        <button class="btn-logout" onclick="logout()">Keluar</button>
      </div>
    </aside>
  `;
}

function initSidebar(employee) {
  const sidebarContainer = document.getElementById('sidebarContainer');
  if (sidebarContainer) {
    sidebarContainer.innerHTML = getSidebar(employee.role);
  }
  const nameEl = document.getElementById('sidebarUserName');
  const roleEl = document.getElementById('sidebarUserRole');
  const avatarEl = document.getElementById('sidebarAvatar');
  if (nameEl) nameEl.textContent = employee.nama;
  if (roleEl) roleEl.textContent = employee.role.toUpperCase();
  if (avatarEl) avatarEl.textContent = employee.nama.charAt(0).toUpperCase();

  const topBarUser = document.getElementById('topBarUser');
  if (topBarUser) topBarUser.textContent = employee.nama;

  // Mobile hamburger
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar');
  if (hamburger && sidebar) {
    hamburger.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }
}

// Toast notification
function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  const colors = { success: '#10b981', error: '#ef4444', warning: '#f59e0b', info: '#4f46e5' };
  toast.style.cssText = `
    background:${colors[type] || colors.info};
    color:white;
    padding:12px 20px;
    border-radius:8px;
    font-size:14px;
    font-weight:500;
    box-shadow:0 4px 12px rgba(0,0,0,0.15);
    animation:slideIn 0.3s ease;
    max-width:320px;
    cursor:pointer;
  `;
  toast.textContent = message;
  toast.onclick = () => toast.remove();
  container.appendChild(toast);
  setTimeout(() => { if (toast.parentNode) toast.remove(); }, 4000);
}

function showLoading(show = true) {
  let overlay = document.getElementById('loadingOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.innerHTML = '<div class="spinner"></div>';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(255,255,255,0.7);display:flex;align-items:center;justify-content:center;z-index:9998;';
    document.body.appendChild(overlay);
  }
  overlay.style.display = show ? 'flex' : 'none';
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) { modal.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) { modal.style.display = 'none'; document.body.style.overflow = ''; }
}
