<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>eRecycloMatch | Admin Dashboard</title>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --green-dark:  #1a5c00;
      --green-main:  #257901;
      --green-light: #7ED957;
      --green-pale:  #c8f0a0;
      --bg:          #f0fae6;
      --white:       #ffffff;
      --gray:        #666666;
      --gray-light:  #f5f5f5;
      --text:        #1a1a1a;
      --sidebar-w:   240px;
      --shadow:      0 2px 16px rgba(37,121,1,0.10);
    }

    body {
      font-family: 'DM Sans', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
    }

    /* ── SIDEBAR ── */
    .sidebar {
      width: var(--sidebar-w);
      min-height: 100vh;
      background: var(--green-main);
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0; left: 0;
      z-index: 100;
    }

    .sidebar-brand {
      padding: 28px 20px 24px;
      border-bottom: 1px solid rgba(255,255,255,0.15);
      text-align: center;
    }

    .sidebar-brand img {
      width: 64px;
      height: 64px;
      object-fit: contain;
      margin-bottom: 8px;
    }

    .sidebar-brand .brand-name {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.2rem;
      letter-spacing: 2px;
      color: var(--white);
    }

    .sidebar-brand .brand-sub {
      font-size: 0.7rem;
      color: rgba(255,255,255,0.6);
      margin-top: 2px;
    }

    .sidebar-nav {
      flex: 1;
      padding: 16px 0;
    }

    .nav-label {
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 1.5px;
      color: rgba(255,255,255,0.45);
      text-transform: uppercase;
      padding: 12px 20px 6px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      color: rgba(255,255,255,0.75);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      transition: background 0.2s, color 0.2s;
      cursor: pointer;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
    }

    .nav-item:hover {
      background: rgba(255,255,255,0.12);
      color: var(--white);
    }

    .nav-item.active {
      background: rgba(255,255,255,0.18);
      color: var(--white);
      border-right: 3px solid var(--green-light);
    }

    .nav-item svg {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .badge {
      margin-left: auto;
      background: var(--green-light);
      color: var(--green-dark);
      font-size: 0.7rem;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 20px;
      min-width: 20px;
      text-align: center;
    }

    .sidebar-footer {
      padding: 16px 20px;
      border-top: 1px solid rgba(255,255,255,0.15);
    }

    .btn-logout {
      display: flex;
      align-items: center;
      gap: 10px;
      color: rgba(255,255,255,0.7);
      font-size: 0.9rem;
      font-weight: 500;
      text-decoration: none;
      transition: color 0.2s;
      background: none;
      border: none;
      cursor: pointer;
      width: 100%;
    }
    .btn-logout:hover { color: var(--white); }
    .btn-logout svg { width: 18px; height: 18px; }

    /* ── MAIN CONTENT ── */
    .main {
      margin-left: var(--sidebar-w);
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    /* ── TOPBAR ── */
    .topbar {
      background: var(--white);
      padding: 16px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: var(--shadow);
      position: sticky;
      top: 0;
      z-index: 50;
    }

    .topbar-title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.4rem;
      letter-spacing: 1.5px;
      color: var(--green-main);
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .admin-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--green-pale);
      border-radius: 20px;
      padding: 6px 14px 6px 8px;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--green-dark);
    }

    .admin-pill .avatar {
      width: 28px;
      height: 28px;
      background: var(--green-main);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 0.75rem;
      font-weight: 700;
    }

    /* ── PAGE BODY ── */
    .page-body {
      padding: 32px;
      flex: 1;
    }

    /* ── SUMMARY CARDS ── */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .summary-card {
      background: var(--white);
      border-radius: 16px;
      padding: 24px 20px;
      box-shadow: var(--shadow);
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: transform 0.2s;
    }
    .summary-card:hover { transform: translateY(-2px); }

    .summary-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .summary-icon svg { width: 20px; height: 20px; }
    .icon-green  { background: #e6f9d8; color: var(--green-main); }
    .icon-yellow { background: #fff8e1; color: #f59e0b; }
    .icon-red    { background: #fee2e2; color: #ef4444; }
    .icon-blue   { background: #e0f2fe; color: #0284c7; }

    .summary-value {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 2rem;
      color: var(--text);
      line-height: 1;
    }

    .summary-label {
      font-size: 0.8rem;
      color: var(--gray);
      font-weight: 500;
    }

    /* ── SECTION HEADER ── */
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .section-title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.2rem;
      letter-spacing: 1px;
      color: var(--green-dark);
    }

    .btn-view-all {
      font-size: 0.82rem;
      color: var(--green-main);
      font-weight: 600;
      text-decoration: none;
      transition: color 0.2s;
    }
    .btn-view-all:hover { color: var(--green-dark); }

    /* ── TABLES ── */
    .table-card {
      background: var(--white);
      border-radius: 16px;
      box-shadow: var(--shadow);
      overflow: hidden;
      margin-bottom: 32px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    thead {
      background: var(--green-pale);
    }

    th {
      padding: 12px 20px;
      text-align: left;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: var(--green-dark);
    }

    td {
      padding: 14px 20px;
      font-size: 0.88rem;
      border-bottom: 1px solid #f0f0f0;
      color: var(--text);
    }

    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #fafff5; }

    /* ── STATUS BADGES ── */
    .status {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .status-pending  { background: #fff8e1; color: #b45309; }
    .status-approved { background: #dcfce7; color: #15803d; }
    .status-rejected { background: #fee2e2; color: #b91c1c; }

    /* ── ACTION BUTTONS ── */
    .action-btns {
      display: flex;
      gap: 6px;
    }

    .btn-approve, .btn-reject, .btn-view {
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn-approve:hover, .btn-reject:hover, .btn-view:hover { opacity: 0.8; }

    .btn-approve { background: #dcfce7; color: #15803d; }
    .btn-reject  { background: #fee2e2; color: #b91c1c; }
    .btn-view    { background: var(--green-pale); color: var(--green-dark); }

    /* ── EMPTY STATE ── */
    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--gray);
      font-size: 0.9rem;
    }
  </style>
</head>
<body>

<!-- ══════════════ SIDEBAR ══════════════ -->
<aside class="sidebar">
  <div class="sidebar-brand">
    <img src="../assets/icon.png" alt="Logo" />
    <div class="brand-name">ERECYCLOMATCH</div>
    <div class="brand-sub">Admin Panel</div>
  </div>

  <nav class="sidebar-nav">
    <div class="nav-label">Main</div>
    <a class="nav-item active" href="dashboard.php">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
      Dashboard
    </a>

    <div class="nav-label">Manage</div>
    <a class="nav-item" href="facilities.php">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
      Facility Registrations
      <span class="badge">5</span>
    </a>

    <a class="nav-item" href="items.php">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="21 8 21 21 3 21 3 8"/>
        <rect x="1" y="3" width="22" height="5"/>
        <line x1="10" y1="12" x2="14" y2="12"/>
      </svg>
      Item Listings
      <span class="badge">3</span>
    </a>

    <div class="nav-label">Users</div>
    <a class="nav-item" href="users.php">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
      Users
    </a>
  </nav>

  <div class="sidebar-footer">
    <a class="btn-logout" href="login.php">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
      Log Out
    </a>
  </div>
</aside>

<!-- ══════════════ MAIN ══════════════ -->
<div class="main">

  <!-- Topbar -->
  <header class="topbar">
    <div class="topbar-title">Dashboard</div>
    <div class="topbar-right">
      <div class="admin-pill">
        <div class="avatar">A</div>
        Admin
      </div>
    </div>
  </header>

  <div class="page-body">

    <!-- Summary Cards -->
    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-icon icon-yellow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div class="summary-value">5</div>
        <div class="summary-label">Pending Facilities</div>
      </div>

      <div class="summary-card">
        <div class="summary-icon icon-yellow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div class="summary-value">3</div>
        <div class="summary-label">Pending Items</div>
      </div>

      <div class="summary-card">
        <div class="summary-icon icon-green">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
        </div>
        <div class="summary-value">12</div>
        <div class="summary-label">Approved Facilities</div>
      </div>

      <div class="summary-card">
        <div class="summary-icon icon-blue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
          </svg>
        </div>
        <div class="summary-value">48</div>
        <div class="summary-label">Total Users</div>
      </div>
    </div>

    <!-- Facility Registrations Table -->
    <div class="section-header">
      <div class="section-title">Pending Facility Registrations</div>
      <a href="facilities.php" class="btn-view-all">View All →</a>
    </div>

    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Facility Name</th>
            <th>Location</th>
            <th>Email</th>
            <th>Contact</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>Green Earth Recycling</td>
            <td>Bacolod City</td>
            <td>greenearth@email.com</td>
            <td>09171234567</td>
            <td><span class="status status-pending">Pending</span></td>
            <td>
              <div class="action-btns">
                <button class="btn-view">View</button>
                <button class="btn-approve">Approve</button>
                <button class="btn-reject">Reject</button>
              </div>
            </td>
          </tr>
          <tr>
            <td>2</td>
            <td>EcoHub Negros</td>
            <td>Silay City</td>
            <td>ecohub@email.com</td>
            <td>09281234567</td>
            <td><span class="status status-pending">Pending</span></td>
            <td>
              <div class="action-btns">
                <button class="btn-view">View</button>
                <button class="btn-approve">Approve</button>
                <button class="btn-reject">Reject</button>
              </div>
            </td>
          </tr>
          <tr>
            <td>3</td>
            <td>RecycloPoint PH</td>
            <td>Talisay City</td>
            <td>recyclopoint@email.com</td>
            <td>09391234567</td>
            <td><span class="status status-approved">Approved</span></td>
            <td>
              <div class="action-btns">
                <button class="btn-view">View</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Item Listings Table -->
    <div class="section-header">
      <div class="section-title">Pending Item Listings</div>
      <a href="items.php" class="btn-view-all">View All →</a>
    </div>

    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Item Name</th>
            <th>Submitted By</th>
            <th>Description</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>Old Laptop</td>
            <td>Juan Dela Cruz</td>
            <td>Working laptop, 4GB RAM</td>
            <td><span class="status status-pending">Pending</span></td>
            <td>
              <div class="action-btns">
                <button class="btn-view">View</button>
                <button class="btn-approve">Approve</button>
                <button class="btn-reject">Reject</button>
              </div>
            </td>
          </tr>
          <tr>
            <td>2</td>
            <td>Broken Printer</td>
            <td>Maria Santos</td>
            <td>HP printer, needs repair</td>
            <td><span class="status status-pending">Pending</span></td>
            <td>
              <div class="action-btns">
                <button class="btn-view">View</button>
                <button class="btn-approve">Approve</button>
                <button class="btn-reject">Reject</button>
              </div>
            </td>
          </tr>
          <tr>
            <td>3</td>
            <td>Mobile Phones x5</td>
            <td>Pedro Reyes</td>
            <td>5 old Android phones</td>
            <td><span class="status status-rejected">Rejected</span></td>
            <td>
              <div class="action-btns">
                <button class="btn-view">View</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div><!-- end page-body -->
</div><!-- end main -->

</body>
</html>