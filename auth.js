const API_URL = "http://localhost:3000";

async function checkAuthentication() {
    const token = localStorage.getItem("token");

    // No token = not logged in
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/me`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok || !data.authenticated) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            window.location.href = "login.html";
            return;
        }

        // Save latest user information
        localStorage.setItem("user", JSON.stringify(data.user));

        showLoggedInUser(data.user);

    } catch (error) {
        console.error("Authentication error:", error);

        // Backend is not running
        alert("Unable to connect to Sagar Central server.");

        return;
    }
}


// =====================================
// SHOW USER + LOGOUT
// =====================================

function showLoggedInUser(user) {

    // Add user information to sidebar
    const logo = document.querySelector(".logo");

    if (logo && !document.getElementById("loggedInUser")) {

        const userBox = document.createElement("div");

        userBox.id = "loggedInUser";

        userBox.innerHTML = `
            <div style="
                margin-top:15px;
                padding:10px;
                background:rgba(255,255,255,0.1);
                border-radius:8px;
                text-align:center;
                font-size:13px;
            ">
                👤 ${escapeAuthHTML(user.name)}
            </div>
        `;

        logo.appendChild(userBox);
    }


    // Add logout button to sidebar
    const menu = document.querySelector(".menu");

    if (menu && !document.getElementById("logoutButton")) {

        const logoutItem = document.createElement("li");

        logoutItem.innerHTML = `
            <a href="#" id="logoutButton">
                🚪 Logout
            </a>
        `;

        menu.appendChild(logoutItem);

        document
            .getElementById("logoutButton")
            .addEventListener("click", function(event) {

                event.preventDefault();

                logoutUser();
            });
    }
}


// =====================================
// LOGOUT
// =====================================

function logoutUser() {

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "login.html";
}


// =====================================
// SAFE HTML
// =====================================

function escapeAuthHTML(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =====================================
// START AUTHENTICATION CHECK
// =====================================

checkAuthentication();