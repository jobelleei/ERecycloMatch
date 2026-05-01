<?php
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "", "capstone_db");

if ($conn->connect_error) {
    echo json_encode(["status"=>"error","message"=>"Database connection failed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

$email = $conn->real_escape_string($data->email);
$password = $data->password;

/*
|--------------------------------------------------------------------------
| CHECK APPROVED INDIVIDUALS
|--------------------------------------------------------------------------
*/
$result = $conn->query("SELECT * FROM approved_individuals WHERE email='$email'");

if ($result && $result->num_rows > 0) {
    $user = $result->fetch_assoc();

    if (password_verify($password, $user['password'])) {
        echo json_encode([
            "status" => "success",
            "role" => "individual"
        ]);
        exit();
    }
}

/*
|--------------------------------------------------------------------------
| CHECK APPROVED FACILITIES
|--------------------------------------------------------------------------
*/
$result = $conn->query("SELECT * FROM approved_facilities WHERE email='$email'");

if ($result && $result->num_rows > 0) {
    $user = $result->fetch_assoc();

    if (password_verify($password, $user['password'])) {
        echo json_encode([
            "status" => "success",
            "role" => "facility"
        ]);
        exit();
    }
}

/*
|--------------------------------------------------------------------------
| CHECK PENDING
|--------------------------------------------------------------------------
*/
$result = $conn->query("SELECT * FROM pending_individuals WHERE email='$email'");
if ($result->num_rows > 0) {
    echo json_encode([
        "status"=>"error",
        "message"=>"Your account is still pending approval"
    ]);
    exit();
}

$result = $conn->query("SELECT * FROM pending_facilities WHERE email='$email'");
if ($result->num_rows > 0) {
    echo json_encode([
        "status"=>"error",
        "message"=>"Your facility is still pending approval"
    ]);
    exit();
}

/*
|--------------------------------------------------------------------------
| CHECK REJECTED
|--------------------------------------------------------------------------
*/
$result = $conn->query("SELECT * FROM rejected_individuals WHERE email='$email'");
if ($result->num_rows > 0) {
    echo json_encode([
        "status"=>"error",
        "message"=>"Your account was rejected"
    ]);
    exit();
}

$result = $conn->query("SELECT * FROM rejected_facilities WHERE email='$email'");
if ($result->num_rows > 0) {
    echo json_encode([
        "status"=>"error",
        "message"=>"Your facility was rejected"
    ]);
    exit();
}

/*
|--------------------------------------------------------------------------
| DEFAULT
|--------------------------------------------------------------------------
*/
echo json_encode([
    "status"=>"error",
    "message"=>"Invalid email or password"
]);
?>