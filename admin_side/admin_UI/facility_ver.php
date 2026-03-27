<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>ERECYCLOMATCH</title>
    <link rel="stylesheet" href="../css/all.css">
    <script src="../script/all.js" defer></script>
</head>

<body>
    <?php $currentPage = basename($_SERVER['PHP_SELF']); ?>
    <!--Side Bar-->
    <div class="container">
        <div class="sidebar">
            <div class="admin">
                <div class="logo">
                    <!--Logo-->
                    <img src="/ERECYCLOMATCH/assets/icons/icon.png" alt="logo">
                </div>
                <p>Admin</p>
            </div>

            <!--Options-->
            <ul class="menu">
                <!--Users-->
                <li onclick="window.location.href='user_ver.php'"
                    class="<?= $currentPage === 'user_ver.php' ? 'active' : '' ?>">
                    <img src="../../assets/icons/group.png" alt="">
                    <span>Users</span>
                </li>

                <!--Facilities/Shops-->
                <li onclick="window.location.href='facility_ver.php'"
                    class="<?= $currentPage === 'facility_ver.php' ? 'active' : '' ?>">
                    <img src="../../assets/icons/building.png" alt="">
                    <span>Facilities/Shops</span>
                </li>

                <!--Item Listing-->
                <li onclick="window.location.href='item_listing.php'"
                    class="<?= $currentPage === 'item_listing.php' ? 'active' : '' ?>">
                    <img src="../../assets/icons/list.png" alt="">
                    <span>Item Listing</span>
                </li>

                <!--Settings-->
                <li onclick="window.location.href='settings.php'"
                    class="<?= $currentPage === 'settings.php' ? 'active' : '' ?>">
                    <img src="../../assets/icons/setting.png" alt="">
                    <span>Settings</span>
                </li>
            </ul>

            <!--Log Out Button-->
            <a href="login.php" class="logout">
                <span>Log Out</span>
                <img id="leave" src="../../assets/icons/logout.png">
            </a>
        </div>

        <div class="main">
            <div class="header">
                <div class="dropdown-container">
                    <h1>Facilities/Shops</h1>
                    <button class="dropdown-btn">▼</button>
                    <div class="dropdown-menu">
                        <p>Registered Facilities/Shops</p>
                        <p>Pending Facilities/Shops</p>
                    </div>
                </div>
            </div>

            <div class="controls">
                <!--Search Box-->
                <div class="search-box">
                    <input type="text" placeholder="Search">
                </div>

                <!--Sorting Button-->
                <button class="sort-btn">
                    <img src="../../assets/icons/sort.png" alt="sort">
                </button>
            </div>
        </div>
    </div>
</body>

</html>