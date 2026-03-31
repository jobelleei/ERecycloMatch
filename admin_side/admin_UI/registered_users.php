<?php
$conn = new mysqli("localhost", "root", "", "capstone_db");

$sql = "SELECT * FROM individuals WHERE status='approved'";
$result = $conn->query($sql);
?>

<h2>Registered Users</h2>

<table border="1">
    <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Email</th>
        <th>Address</th>
    </tr>

    <?php while($row = $result->fetch_assoc()): ?>
    <tr>
        <td><?= $row['id'] ?></td>
        <td><?= $row['name'] ?></td>
        <td><?= $row['email'] ?></td>
        <td><?= $row['address'] ?></td>
    </tr>
    <?php endwhile; ?>
</table>