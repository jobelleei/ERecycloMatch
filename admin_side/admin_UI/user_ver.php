<?php
$conn = new mysqli("localhost", "root", "", "capstone_db");

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$currentPage = basename($_SERVER['PHP_SELF']);
$type = isset($_GET['type']) ? $_GET['type'] : 'pending';

if ($type == 'approved') {
    $sql = "SELECT * FROM approved_individuals";
} elseif ($type == 'rejected') {
    $sql = "SELECT * FROM rejected_individuals";
} else {
    $sql = "SELECT * FROM pending_individuals";
}

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
                    <img src="/ERECYCLOMATCH/assets/icons/icon.png">
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

            <!-- HEADER WITH YOUR ORIGINAL DROPDOWN -->
            <div class="header">
                <div class="dropdown-container">
                    <h1>Users</h1>

                    <button class="dropdown-btn">▼</button>

                    <div class="dropdown-menu">
                        <p onclick="window.location.href='user_ver.php?type=pending'">Pending</p>
                        <p onclick="window.location.href='user_ver.php?type=approved'">Approved</p>
                        <p onclick="window.location.href='user_ver.php?type=rejected'">Rejected</p>
                    </div>
                </div>
            </div>

            <!-- TABLE -->
            <div class="table-container">
                <table class="custom-table">
                    <thead>
                        <tr>
                            <th>No.</th>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Address</th>
                            <th>ID Image</th>

                            <?php if ($type == 'rejected'): ?>
                            <th>Reason</th>
                            <?php endif; ?>

                            <th>Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        <?php $count = 1; ?>
                        <?php while($row = $result->fetch_assoc()): ?>
                        <tr>
                            <td><?= $count++ ?></td>
                            <td><?= $row['id'] ?></td>
                            <td><?= $row['name'] ?></td>
                            <td><?= $row['email'] ?></td>
                            <td><?= $row['address'] ?></td>

                            <td>
                                <img src="../../uploads/<?= $row['id_image'] ?>" width="80">
                            </td>

                            <?php if ($type == 'rejected'): ?>
                            <td><?= $row['rejection_reason'] ?></td>
                            <?php endif; ?>

                            <td class="actions">
                                <?php if ($type == 'pending'): ?>
                                <a href="approve_users.php?id=<?= $row['id'] ?>" class="approve-btn">✔</a>
                                <button onclick="openModal(<?= $row['id'] ?>)" class="reject-btn">✖</button>
                                <?php else: ?>
                                -
                                <?php endif; ?>
                            </td>
                        </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
            </div>

        </div>

    </div>

    <!-- MODAL -->
    <div id="rejectModal"
        style="display:none; position:fixed; top:30%; left:40%; background:white; padding:20px; border-radius:10px;">
        <form method="POST" action="reject_user.php">
            <input type="hidden" name="id" id="rejectId">

            <label>Reason:</label>
            <select name="reason">
                <option value="Incomplete details">Incomplete details</option>
                <option value="Invalid ID">Invalid ID</option>
                <option value="Fake information">Fake information</option>
            </select>

            <br><br>

            <button type="submit">Submit</button>
            <button type="button" onclick="closeModal()">Cancel</button>
        </form>
    </div>

    <script>
    function openModal(id) {
        document.getElementById('rejectModal').style.display = 'block';
        document.getElementById('rejectId').value = id;
    }

    function closeModal() {
        document.getElementById('rejectModal').style.display = 'none';
    }
    </script>

</body>

</html>