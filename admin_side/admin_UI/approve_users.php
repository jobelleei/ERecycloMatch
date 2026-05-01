<?php
$conn = new mysqli("localhost", "root", "", "capstone_db");

$id = $_GET['id'];

$res = $conn->query("SELECT * FROM pending_individuals WHERE id=$id");
$row = $res->fetch_assoc();

$conn->query("INSERT INTO approved_individuals 
(name,email,address,password,id_image)
VALUES (
'{$row['name']}',
'{$row['email']}',
'{$row['address']}',
'{$row['password']}',
'{$row['id_image']}'
)");

$conn->query("DELETE FROM pending_individuals WHERE id=$id");

header("Location: user_ver.php");
?>