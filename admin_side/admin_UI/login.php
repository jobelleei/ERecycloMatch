<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="../css/login.css">
    <title>ERECYCLOMATCH</title>
</head>
<body>
    <div class="login">
        <div class="logo">
            <img src="../../assets/icons/icon.png" alt="Logo">
        </div>

        <div class="name">
            <h2>ERECYCLOMATCH</h2>
            <p>Recycle Smarter. Match Faster.</p>
        </div>

        <form action="" method="post">
            <div class="input">
                <div class="input-box">
                    <img src="../../assets/icons/avatar.png" alt="user" class="icon">
                    <input type="text" id="username" name="username" placeholder="Enter Username" required>
                </div>

                <div class="input-box">
                    <img src="../../assets/icons/padlock_.png" alt="lock" class="icon">
                    <input type="password" id="password" name="password" placeholder="Enter Password" required>
                </div>
            </div>
        </form>

    <div class="button">
       <a href="user_ver.php">
        <button type="submit">Log In</button>
      </a>
    </div>
</body>
</html>