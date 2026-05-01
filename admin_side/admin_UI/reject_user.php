<?php
$conn = new mysqli("localhost", "root", "", "capstone_db");

$id = $_POST['id'];
$reason = $_POST['reason'];

$res = $conn->query("SELECT * FROM pending_individuals WHERE id=$id");
$row = $res->fetch_assoc();

$conn->query("INSERT INTO rejected_individuals 
(name,email,address,password,id_image,rejection_reason)
VALUES (
'{$row['name']}',
'{$row['email']}',
'{$row['address']}',
'{$row['password']}',
'{$row['id_image']}',
'$reason'
)");

$conn->query("DELETE FROM pending_individuals WHERE id=$id");

header("Location: user_ver.php");
?>