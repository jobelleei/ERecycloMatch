<?php
$conn = new mysqli("localhost", "root", "", "capstone_db");

$id = $_GET['id'];

$conn->query("DELETE FROM individuals WHERE id=$id");

header("Location: user_ver.php");
exit();
?>