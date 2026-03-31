<?php
$conn = new mysqli("localhost", "root", "", "capstone_db");

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$currentPage = basename($_SERVER['PHP_SELF']);

// get pending users
$sql = "SELECT * FROM individuals WHERE status='pending'";
$result = $conn->query($sql);
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>ERECYCLOMATCH</title>
    <link rel="stylesheet" href="../css/all.css">
    <script src="../script/all.js" defer></script>
</head>

<body>

    <div class="container">

        <!-- SIDEBAR -->
        <div class="sidebar">
            <div class="admin">
                <div class="logo">
                    <img src="/ERECYCLOMATCH/assets/icons/icon.png" alt="logo">
                </div>
                <p>Admin</p>
            </div>

            <ul class="menu">
                <li onclick="window.location.href='user_ver.php'"
                    class="<?= $currentPage === 'user_ver.php' ? 'active' : '' ?>">
                    <img src="../../assets/icons/group.png">
                    <span>Users</span>
                </li>

                <li onclick="window.location.href='facility_ver.php'">
                    <img src="../../assets/icons/building.png">
                    <span>Facilities/Shops</span>
                </li>
            </ul>

            <a href="login.php" class="logout">
                <span>Log Out</span>
                <img src="../../assets/icons/logout.png">
            </a>
        </div>

        <!-- MAIN -->
        <div class="main">

            <!-- HEADER -->
            <div class="header">
                <div class="dropdown-container">
                    <h1>Users</h1>
                    <button class="dropdown-btn">▼</button>

                    <div class="dropdown-menu">
                        <p onclick="window.location.href='registered_users.php'">Registered Users</p>
                        <p onclick="window.location.href='user_ver.php'">Pending Approval</p>
                    </div>
                </div>
            </div>

            <!-- CONTROLS -->
            <div class="controls">
                <div class="search-box">
                    <input type="text" placeholder="Search">
                </div>

                <button class="sort-btn">
                    <img src="../../assets/icons/sort.png">
                </button>
            </div>

            <!-- TABLE -->
            <div class="table-container">
                <table border="1" cellpadding="10">
                    <tr>
                        <th>No.</th>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Address</th>
                        <th>ID Image</th>
                        <th>Action</th>
                    </tr>

                    <?php $count = 1; ?>
                    <?php while($row = $result->fetch_assoc()): ?>
                    <tr>
                        <td><?= $count++ ?></td>
                        <td><?= $row['id'] ?></td>
                        <td><?= $row['name'] ?></td>
                        <td><?= $row['email'] ?></td>
                        <td><?= $row['address'] ?></td>

                        <!-- IMAGE -->
                        <td>
                            <img src="http://192.168.1.14:3000/uploads/<?= $row['id_image'] ?>" width="80">
                        </td>

                        <!-- ACTION -->
                        <td>
                            <a href="approve.php?id=<?= $row['id'] ?>">✔</a>
                            <a href="reject.php?id=<?= $row['id'] ?>">✖</a>
                        </td>
                    </tr>
                    <?php endwhile; ?>
                </table>
            </div>

        </div>
    </div>

</body>

</html>