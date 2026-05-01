<?php
$conn = new mysqli("localhost", "root", "", "capstone_db");

$id = $_POST['id'];
$reason = $_POST['reason'];

$res = $conn->query("SELECT * FROM pending_facilities WHERE id=$id");
$row = $res->fetch_assoc();

$conn->query("INSERT INTO rejected_facilities 
(name,location,email,contactNum,password,certification,rejection_reason)
VALUES (
'{$row['name']}',
'{$row['location']}',
'{$row['email']}',
'{$row['contactNum']}',
'{$row['password']}',
'{$row['certification']}',
'$reason'
)");

$conn->query("DELETE FROM pending_facilities WHERE id=$id");

header("Location: facility_ver.php");
?>