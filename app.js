/* =====================================================
   SAGAR CENTRAL - COMMON APPLICATION JAVASCRIPT
   ===================================================== */

/* ---------- STORAGE ---------- */

function getData(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function generateId() {
    return Date.now().toString() + Math.random().toString(16).slice(2);
}

function formatDate(date) {
    if (!date) return "No date";

    let d = new Date(date + "T00:00:00");

    return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function escapeHTML(text) {
    if (text === undefined || text === null) return "";

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* ---------- SIDEBAR ---------- */

function createSidebar(activePage) {

    let sidebar = document.getElementById("sidebar");

    if (!sidebar) return;

    sidebar.innerHTML = `
        <div class="logo">
            <h2>Sagar Central</h2>
            <p>Enterprise Management System</p>
        </div>

        <ul class="menu">

            <li>
                <a href="index.html"
                   class="${activePage === "dashboard" ? "active" : ""}">
                   🏠 Dashboard
                </a>
            </li>

            <li>
                <a href="meetings.html"
                   class="${activePage === "meetings" ? "active" : ""}">
                   📅 Meetings
                </a>
            </li>

            <li>
                <a href="events.html"
                   class="${activePage === "events" ? "active" : ""}">
                   🎉 Events
                </a>
            </li>

            <li>
                <a href="policies.html"
                   class="${activePage === "policies" ? "active" : ""}">
                   📜 Policies
                </a>
            </li>

            <li>
                <a href="tasks.html"
                   class="${activePage === "tasks" ? "active" : ""}">
                   ✅ Tasks
                </a>
            </li>

            <li>
                <a href="documents.html"
                   class="${activePage === "documents" ? "active" : ""}">
                   📄 Documents
                </a>
            </li>

            <li>
                <a href="ai-assistant.html"
                   class="${activePage === "ai" ? "active" : ""}">
                   🤖 AI Assistant
                </a>
            </li>

            <li>
                <a href="settings.html"
                   class="${activePage === "settings" ? "active" : ""}">
                   ⚙️ Settings
                </a>
            </li>

        </ul>
    `;
}


/* ---------- TOPBAR ---------- */

function createTopbar(title) {

    let topbar = document.getElementById("topbar");

    if (!topbar) return;

    topbar.innerHTML = `
        <h1>${title}</h1>

        <div class="global-search">
            <input
                type="text"
                id="globalSearch"
                placeholder="Search meetings, events, policies..."
                oninput="globalSearch()"
            >

            <div id="searchResults"
                 class="search-results"
                 style="display:none;">
            </div>
        </div>

        <div class="profile">
            👤 Admin
        </div>
    `;
}


/* ---------- GLOBAL SEARCH ---------- */

function globalSearch() {

    let input = document.getElementById("globalSearch");
    let results = document.getElementById("searchResults");

    if (!input || !results) return;

    let query = input.value.toLowerCase().trim();

    if (query === "") {
        results.style.display = "none";
        results.innerHTML = "";
        return;
    }

    let allRecords = [];

    let meetings = getData("meetings");
    let events = getData("events");
    let policies = getData("policies");
    let tasks = getData("tasks");
    let documents = getData("documents");

    meetings.forEach((item, index) => {
        allRecords.push({
            type: "Meeting",
            title: item.title,
            text: `${item.title} ${item.date || ""} ${item.time || ""}`,
            page: "meetings.html",
            index: index
        });
    });

    events.forEach((item, index) => {
        allRecords.push({
            type: "Event",
            title: item.title,
            text: `${item.title} ${item.date || ""}`,
            page: "events.html",
            index: index
        });
    });

    policies.forEach((item, index) => {
        allRecords.push({
            type: "Policy",
            title: item.title,
            text: `${item.title} ${item.description || ""}`,
            page: "policies.html",
            index: index
        });
    });

    tasks.forEach((item, index) => {
        allRecords.push({
            type: "Task",
            title: item.title,
            text: item.title,
            page: "tasks.html",
            index: index
        });
    });

    documents.forEach((item, index) => {
        allRecords.push({
            type: "Document",
            title: item.title,
            text: `${item.title} ${item.description || ""}`,
            page: "documents.html",
            index: index
        });
    });

    let matches = allRecords.filter(item =>
        item.text.toLowerCase().includes(query)
    );

    if (matches.length === 0) {

        results.innerHTML = `
            <div class="search-result">
                No records found.
            </div>
        `;

    } else {

        results.innerHTML = matches
            .slice(0, 8)
            .map(item => `
                <div
                    class="search-result"
                    onclick="window.location.href='${item.page}'"
                >
                    <strong>${escapeHTML(item.title)}</strong>
                    <small>${item.type}</small>
                </div>
            `)
            .join("");
    }

    results.style.display = "block";
}


/* ---------- CONFIRM DELETE ---------- */

function confirmDelete(type) {
    return confirm(
        `Are you sure you want to delete this ${type}?`
    );
}


/* ---------- DASHBOARD ---------- */

function updateDashboard() {

    let meetings = getData("meetings");
    let events = getData("events");
    let policies = getData("policies");
    let tasks = getData("tasks");
    let documents = getData("documents");

    let meetingCount = document.getElementById("totalMeetings");
    let eventCount = document.getElementById("totalEvents");
    let policyCount = document.getElementById("totalPolicies");
    let taskCount = document.getElementById("totalTasks");
    let documentCount = document.getElementById("totalDocuments");
    let upcomingCount = document.getElementById("upcomingEvents");

    if (meetingCount) meetingCount.innerText = meetings.length;
    if (eventCount) eventCount.innerText = events.length;
    if (policyCount) policyCount.innerText = policies.length;
    if (taskCount) taskCount.innerText = tasks.length;
    if (documentCount) documentCount.innerText = documents.length;

    let today = new Date();
    today.setHours(0, 0, 0, 0);

    let upcomingEvents = events.filter(event => {

        if (!event.date) return false;

        let eventDate = new Date(event.date + "T00:00:00");

        return eventDate >= today;
    });

    if (upcomingCount) {
        upcomingCount.innerText = upcomingEvents.length;
    }

    renderDashboardLists(meetings, events, tasks);
    renderDashboardChart(
        meetings,
        events,
        policies,
        tasks,
        documents
    );
}


/* ---------- DASHBOARD LISTS ---------- */

function renderDashboardLists(meetings, events, tasks) {

    let meetingBox = document.getElementById("dashboardMeetings");
    let eventBox = document.getElementById("dashboardEvents");
    let taskBox = document.getElementById("dashboardTasks");

    let sortedMeetings = [...meetings]
        .filter(item => item.date)
        .sort((a, b) =>
            new Date(a.date) - new Date(b.date)
        );

    if (meetingBox) {

        if (sortedMeetings.length === 0) {

            meetingBox.innerHTML =
                `<div class="empty">No meetings available.</div>`;

        } else {

            meetingBox.innerHTML =
                sortedMeetings.slice(0, 5).map(item => `
                    <div class="item">
                        <strong>${escapeHTML(item.title)}</strong>
                        <small>
                            ${formatDate(item.date)}
                            ${item.time ? " • " + item.time : ""}
                        </small>
                    </div>
                `).join("");
        }
    }

    let sortedEvents = [...events]
        .filter(item => item.date)
        .sort((a, b) =>
            new Date(a.date) - new Date(b.date)
        );

    if (eventBox) {

        if (sortedEvents.length === 0) {

            eventBox.innerHTML =
                `<div class="empty">No upcoming events.</div>`;

        } else {

            eventBox.innerHTML =
                sortedEvents.slice(0, 5).map(item => `
                    <div class="item">
                        <strong>${escapeHTML(item.title)}</strong>
                        <small>${formatDate(item.date)}</small>
                    </div>
                `).join("");
        }
    }

    if (taskBox) {

        if (tasks.length === 0) {

            taskBox.innerHTML =
                `<div class="empty">No pending tasks.</div>`;

        } else {

            taskBox.innerHTML =
                tasks.slice(0, 5).map(item => `
                    <div class="item">
                        <strong>${escapeHTML(item.title)}</strong>
                        <small>Pending action item</small>
                    </div>
                `).join("");
        }
    }
}


/* ---------- DASHBOARD CHART ---------- */

function renderDashboardChart(
    meetings,
    events,
    policies,
    tasks,
    documents
) {

    let chart = document.getElementById("dashboardChart");

    if (!chart) return;

    let values = [
        ["Meetings", meetings.length],
        ["Events", events.length],
        ["Policies", policies.length],
        ["Tasks", tasks.length],
        ["Documents", documents.length]
    ];

    let max = Math.max(
        ...values.map(item => item[1]),
        1
    );

    chart.innerHTML = values.map(item => {

        let percentage =
            (item[1] / max) * 100;

        return `
            <div class="chart-row">

                <div class="chart-label">
                    <span>${item[0]}</span>
                    <strong>${item[1]}</strong>
                </div>

                <div class="chart-bar">
                    <div
                        class="chart-fill"
                        style="width:${percentage}%">
                    </div>
                </div>

            </div>
        `;

    }).join("");
}


/* ---------- SETTINGS ---------- */

function loadSettings() {

    let profileName =
        localStorage.getItem("profileName") || "Admin";

    let nameInput =
        document.getElementById("profileName");

    if (nameInput) {
        nameInput.value = profileName;
    }

    let notification =
        localStorage.getItem("notifications") !== "false";

    let notificationInput =
        document.getElementById("notifications");

    if (notificationInput) {
        notificationInput.checked = notification;
    }
}

function saveSettings() {

    let nameInput =
        document.getElementById("profileName");

    let notificationInput =
        document.getElementById("notifications");

    if (nameInput) {
        localStorage.setItem(
            "profileName",
            nameInput.value.trim() || "Admin"
        );
    }

    if (notificationInput) {
        localStorage.setItem(
            "notifications",
            notificationInput.checked
        );
    }

    alert("Settings saved successfully.");
}


/* ---------- CLEAR DATA ---------- */

function clearAllData() {

    let confirmed = confirm(
        "This will delete all meetings, events, policies, tasks and documents. Continue?"
    );

    if (!confirmed) return;

    localStorage.removeItem("meetings");
    localStorage.removeItem("events");
    localStorage.removeItem("policies");
    localStorage.removeItem("tasks");
    localStorage.removeItem("documents");

    alert("All application data has been cleared.");

    location.href = "index.html";
}