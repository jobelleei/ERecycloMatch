<?php
$conn = new mysqli("localhost", "root", "", "capstone_db");

$id = $_GET['id'];

$conn->query("UPDATE individuals SET status='approved' WHERE id=$id");

header("Location: registered_users.php");
exit();
?>