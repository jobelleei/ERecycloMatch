<?php
$conn = new mysqli("localhost", "root", "", "capstone_db");

$id = $_GET['id'];

$res = $conn->query("SELECT * FROM pending_facilities WHERE id=$id");
$row = $res->fetch_assoc();

$conn->query("INSERT INTO approved_facilities 
(name, location, email, contactNum, password, certification)
VALUES (
'{$row['name']}',
'{$row['location']}',
'{$row['email']}',
'{$row['contactNum']}',
'{$row['password']}',
'{$row['certification']}'
)");

$conn->query("DELETE FROM pending_facilities WHERE id=$id");

header("Location: facility_ver.php");
?>