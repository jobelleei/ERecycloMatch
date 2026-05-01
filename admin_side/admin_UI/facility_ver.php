<?php
$conn = new mysqli("localhost", "root", "", "capstone_db");

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$currentPage = basename($_SERVER['PHP_SELF']);
$type = isset($_GET['type']) ? $_GET['type'] : 'pending';

if ($type == 'approved') {
    $sql = "SELECT * FROM approved_facilities";
} elseif ($type == 'rejected') {
    $sql = "SELECT * FROM rejected_facilities";
} else {
    $sql = "SELECT * FROM pending_facilities";
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
                <li onclick="window.location.href='user_ver.php'">
                    <img src="../../assets/icons/group.png">
                    <span>Users</span>
                </li>

                <li onclick="window.location.href='facility_ver.php'"
                    class="<?= $currentPage === 'facility_ver.php' ? 'active' : '' ?>">
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

            <!-- HEADER WITH YOUR DROPDOWN -->
            <div class="header">
                <div class="dropdown-container">
                    <h1>Facilities</h1>

                    <button class="dropdown-btn">▼</button>

                    <div class="dropdown-menu">
                        <p onclick="window.location.href='facility_ver.php?type=pending'">Pending</p>
                        <p onclick="window.location.href='facility_ver.php?type=approved'">Approved</p>
                        <p onclick="window.location.href='facility_ver.php?type=rejected'">Rejected</p>
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
                            <th>Location</th>
                            <th>Email</th>
                            <th>Contact</th>
                            <th>Certification</th>

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
                            <td><?= $row['location'] ?></td>
                            <td><?= $row['email'] ?></td>
                            <td><?= $row['contactNum'] ?></td>

                            <td>
                                <img src="../../uploads/<?= $row['certification'] ?>" width="80">
                            </td>

                            <?php if ($type == 'rejected'): ?>
                            <td><?= $row['rejection_reason'] ?></td>
                            <?php endif; ?>

                            <td class="actions">
                                <?php if ($type == 'pending'): ?>
                                <a href="approve_facility.php?id=<?= $row['id'] ?>" class="approve-btn">✔</a>
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
        style="display:none; position:fixed; top:30%; left:40%; background:white; padding:20px; border-radius:10px; box-shadow:0 0 10px rgba(0,0,0,0.3);">

        <form method="POST" action="reject_facility.php">
            <input type="hidden" name="id" id="rejectId">

            <label>Reason:</label><br>
            <select name="reason" required>
                <option value="Incomplete documents">Incomplete documents</option>
                <option value="Invalid certification">Invalid certification</option>
                <option value="Fake facility">Fake facility</option>
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