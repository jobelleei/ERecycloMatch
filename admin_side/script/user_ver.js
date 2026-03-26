const btn = document.querySelector(".dropdown-btn");
const menu = document.querySelector(".dropdown-menu");
const items = document.querySelectorAll(".dropdown-item");
const title = document.querySelector(".dropdown-container h1");

btn.addEventListener("click", () => {
    menu.style.display = menu.style.display === "block" ? "none" : "block";
});

items.forEach(item => {
    item.addEventListener("click", () => {

        items.forEach(i => i.classList.remove("active"));

        item.classList.add("active");

        title.textContent = item.textContent;

        menu.style.display = "none";
    });
});