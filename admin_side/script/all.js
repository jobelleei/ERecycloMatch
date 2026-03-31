document.addEventListener("DOMContentLoaded", () => {

    const btn = document.querySelector(".dropdown-btn");
    const menu = document.querySelector(".dropdown-menu");

    if (btn && menu) {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            menu.style.display = (menu.style.display === "block") ? "none" : "block";
        });

        document.addEventListener("click", () => {
            menu.style.display = "none";
        });
    }

});