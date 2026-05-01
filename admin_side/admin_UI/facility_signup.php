<?php
$conn = new mysqli("localhost", "root", "", "capstone_db");

$name = $_POST['name'];
$location = $_POST['location'];
$email = $_POST['email'];
$contact = $_POST['contactNum'];
$password = password_hash($_POST['password'], PASSWORD_DEFAULT);

// upload file
$fileName = "";
if (isset($_FILES['certification'])) {
    $fileName = time() . "_" . $_FILES['certification']['name'];
    move_uploaded_file($_FILES['certification']['tmp_name'], "uploads/" . $fileName);
}

$sql = "INSERT INTO pending_facilities 
(name, location, email, contactNum, password, certification)
VALUES ('$name','$location','$email','$contact','$password','$fileName')";

if ($conn->query($sql)) {
    echo json_encode(["message" => "Submitted for approval"]);
} else {
    echo json_encode(["message" => "Error"]);
}
?>