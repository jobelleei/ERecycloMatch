<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Users UI</title>
    <link rel="stylesheet" href="../css/user_ver.css">
    <script src="../script/user_ver.js" defer></script>
</head>

<body>

    <div class="container">
        <div class="sidebar">
            <div class="admin">
                <div class="logo">
                    <img src="/ERECYCLOMATCH/assets/icons/icon.png" alt="logo">
                </div>
                <p>Admin</p>
            </div>

            <ul class="menu">
                <li class="active">
                    <img src="../../assets/icons/group.png" alt="">
                    <span>Users</span>
                </li>

                <li>
                    <img src="../../assets/icons/building.png" alt="">
                    <span>Facilities/Shops</span>
                </li>

                <li>
                    <img src="../../assets/icons/list.png" alt="">
                    <span>Item Listing</span>
                </li>

                <li>
                    <img src="../../assets/icons/setting.png" alt="">
                    <span>Settings</span>
                </li>
            </ul>
            <button class="logout">
                <span>Log Out</span>
                <img id="leave" src="../../assets/icons/logout.png"></button>
        </div>

        <div class="main">
            <div class="header">
                <div class="dropdown-container">
                    <h1>Users</h1>
                    <button class="dropdown-btn">▼</button>

                    <div class="dropdown-menu">
                        <p>Registered Users</p>
                        <p>Pending Approval</p>
                    </div>
                </div>
            </div>

            <div class="controls">
                <div class="search-box">
                    <input type="text" placeholder="Search">
                </div>

                <button class="sort-btn">
                    <img src="../../assets/icons/sort.png" alt="sort">
                </button>
            </div>

        </div>

    </div>

</body>

</html>