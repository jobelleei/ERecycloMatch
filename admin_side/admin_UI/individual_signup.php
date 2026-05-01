<?php
$conn = new mysqli("localhost", "root", "", "capstone_db");

$name = $_POST['name'];
$email = $_POST['email'];
$address = $_POST['address'];
$password = password_hash($_POST['password'], PASSWORD_DEFAULT);

// upload image
$imageName = "";
if (isset($_FILES['id_image'])) {
    $imageName = time() . "_" . $_FILES['id_image']['name'];
    move_uploaded_file($_FILES['id_image']['tmp_name'], "uploads/" . $imageName);
}

$sql = "INSERT INTO pending_individuals 
(name, email, address, password, id_image)
VALUES ('$name','$email','$address','$password','$imageName')";

if ($conn->query($sql)) {
    echo json_encode(["message" => "Submitted for approval"]);
} else {
    echo json_encode(["message" => "Error"]);
}
?>