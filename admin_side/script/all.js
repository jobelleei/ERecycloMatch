//Dropdown
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

//Sidebar
const currentPage = window.location.pathname.split("/").pop();

const pageMap = {
    "user_ver.php": 0,
    "facility_ver.php": 1,
    "item_listing.php": 2,
    "settings.php": 3
};

const menuItems = document.querySelectorAll(".menu li");
const activeIndex = pageMap[currentPage];

if (activeIndex !== undefined) {
    menuItems[activeIndex].classList.add("active");
}