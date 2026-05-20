<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

$conn = new mysqli("localhost", "root", "", "capstone_db");

if ($conn->connect_error) {
    die(json_encode([
        "success" => false,
        "items" => []
    ]));
}

$submitter_name = $_GET['submitter_name'] ?? "";

$stmt = $conn->prepare("
    SELECT *
    FROM approved_items
    WHERE TRIM(submitter_name) = TRIM(?)
    AND status = 'Listed'
    ORDER BY id DESC
");

$stmt->bind_param("s", $submitter_name);
$stmt->execute();

$result = $stmt->get_result();

$items = [];

while ($row = $result->fetch_assoc()) {
    $items[] = $row;
}

echo json_encode([
    "success" => true,
    "items" => $items
]);

$stmt->close();
$conn->close();
?>