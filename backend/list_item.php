<?php
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "", "capstone_db");

if ($conn->connect_error) {
    die(json_encode([
        "success" => false,
        "message" => "Database connection failed"
    ]));
}

$id = $_POST['id'] ?? 0;

if (!$id) {
    die(json_encode([
        "success" => false,
        "message" => "Missing item id"
    ]));
}

$stmt = $conn->prepare("
    UPDATE approved_items
    SET status = 'Listed'
    WHERE id = ?
");

$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Item listed successfully"
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Failed to update item"
    ]);
}

$stmt->close();
$conn->close();
?>