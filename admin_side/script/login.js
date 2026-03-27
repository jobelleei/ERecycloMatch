const password = document.getElementById("password");
const toggle = document.getElementById("togglePassword");

toggle.addEventListener("click", () => {
    const isHidden = password.type === "password";
    password.type = isHidden ? "text" : "password";
    toggle.src = isHidden
        ? "../../assets/icons/view.png"
        : "../../assets/icons/hide.png";
    toggle.style.opacity = isHidden ? "1" : "0.6";
});

document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();
    window.location.href = "user_ver.php";
});