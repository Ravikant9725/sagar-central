const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const JWT_SECRET = "sagar-central-secret-key";

const usersFile = path.join(__dirname, "users.json");
const dataFile = path.join(__dirname, "data.json");

// =====================================
// MIDDLEWARE
// =====================================

app.use(cors());
app.use(express.json({ limit: "10mb" }));


// =====================================
// CREATE FILES IF THEY DON'T EXIST
// =====================================

if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, "[]");
}

if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(
        dataFile,
        JSON.stringify({}, null, 2)
    );
}


// =====================================
// USERS
// =====================================

function getUsers() {
    try {
        return JSON.parse(
            fs.readFileSync(usersFile, "utf8")
        );
    } catch (error) {
        return [];
    }
}

function saveUsers(users) {
    fs.writeFileSync(
        usersFile,
        JSON.stringify(users, null, 2)
    );
}


// =====================================
// DATA STORAGE
// =====================================

function getData() {
    try {
        const data = JSON.parse(
            fs.readFileSync(dataFile, "utf8")
        );

        return data;
    } catch (error) {
        return {};
    }
}

function saveData(data) {
    fs.writeFileSync(
        dataFile,
        JSON.stringify(data, null, 2)
    );
}


// =====================================
// CREATE USER DATA AREA
// =====================================

function getUserData(userId) {
    const data = getData();

    if (!data[userId]) {
        data[userId] = {
            meetings: [],
            events: [],
            policies: [],
            tasks: [],
            documents: []
        };

        saveData(data);
    }

    return data[userId];
}


// =====================================
// AUTHENTICATION MIDDLEWARE
// =====================================

function authenticateToken(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Authentication required."
        });
    }

    const token = authHeader.split(" ")[1];

    try {

        const decoded = jwt.verify(
            token,
            JWT_SECRET
        );

        req.user = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            message: "Invalid or expired token."
        });

    }
}


// =====================================
// REGISTER
// =====================================

app.post("/api/register", async (req, res) => {

    try {

        const { name, email, password } = req.body;

        if (!name || !email || !password) {

            return res.status(400).json({
                message:
                    "Name, email and password are required."
            });

        }

        if (password.length < 6) {

            return res.status(400).json({
                message:
                    "Password must contain at least 6 characters."
            });

        }

        const users = getUsers();

        const cleanEmail =
            email.trim().toLowerCase();

        const existingUser = users.find(
            user =>
                user.email.toLowerCase() === cleanEmail
        );

        if (existingUser) {

            return res.status(409).json({
                message:
                    "An account with this email already exists."
            });

        }

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const newUser = {

            id: Date.now().toString(),

            name: name.trim(),

            email: cleanEmail,

            password: hashedPassword,

            createdAt:
                new Date().toISOString()

        };

        users.push(newUser);

        saveUsers(users);

        // Create empty data area for new user
        const data = getData();

        data[newUser.id] = {

            meetings: [],

            events: [],

            policies: [],

            tasks: [],

            documents: []

        };

        saveData(data);

        res.status(201).json({

            message:
                "Account created successfully."

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error."
        });

    }

});


// =====================================
// LOGIN
// =====================================

app.post("/api/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {

            return res.status(400).json({
                message:
                    "Email and password are required."
            });

        }

        const users = getUsers();

        const user = users.find(
            user =>
                user.email.toLowerCase() ===
                email.trim().toLowerCase()
        );

        if (!user) {

            return res.status(401).json({
                message:
                    "Invalid email or password."
            });

        }

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!passwordMatch) {

            return res.status(401).json({
                message:
                    "Invalid email or password."
            });

        }

        const token = jwt.sign(

            {
                id: user.id,
                email: user.email,
                name: user.name
            },

            JWT_SECRET,

            {
                expiresIn: "2h"
            }

        );

        res.json({

            message: "Login successful.",

            token: token,

            user: {

                id: user.id,

                name: user.name,

                email: user.email

            }

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error."
        });

    }

});


// =====================================
// VERIFY LOGIN
// =====================================

app.get(
    "/api/me",
    authenticateToken,
    (req, res) => {

        res.json({

            authenticated: true,

            user: req.user

        });

    }
);


// =====================================
// LOGOUT
// =====================================

app.post("/api/logout", (req, res) => {

    res.json({
        message: "Logged out successfully."
    });

});


// =====================================
// GET ALL DATA
// =====================================

app.get(
    "/api/data",
    authenticateToken,
    (req, res) => {

        const userData =
            getUserData(req.user.id);

        res.json(userData);

    }
);


// =====================================
// MEETINGS
// =====================================

app.get(
    "/api/meetings",
    authenticateToken,
    (req, res) => {

        const userData =
            getUserData(req.user.id);

        res.json(userData.meetings);

    }
);


app.post(
    "/api/meetings",
    authenticateToken,
    (req, res) => {

        const title = String(req.body.title || "").trim();
        const date = String(req.body.date || "").trim();
        const time = String(req.body.time || "").trim();

        if (!title || !date || !time) {
            return res.status(400).json({
                message: "Meeting title, date and time are required."
            });
        }

        const userData =
            getUserData(req.user.id);

        const meeting = {

            id: Date.now().toString(),

            title: title,

            date: date,

            time: time,

            createdAt:
                new Date().toISOString()

        };

        userData.meetings.push(meeting);

        const data = getData();

        data[req.user.id] = userData;

        saveData(data);

        res.status(201).json(meeting);

    }
);

app.put(
    "/api/meetings/:id",
    authenticateToken,
    (req, res) => {

        const title = String(req.body.title || "").trim();
        const date = String(req.body.date || "").trim();
        const time = String(req.body.time || "").trim();

        if (!title || !date || !time) {
            return res.status(400).json({
                message: "Meeting title, date and time are required."
            });
        }

        const userData =
            getUserData(req.user.id);

        const meeting =
            userData.meetings.find(
                item => item.id === req.params.id
            );

        if (!meeting) {

            return res.status(404).json({
                message: "Meeting not found."
            });

        }

        meeting.title = title;
        meeting.date = date;
        meeting.time = time;

        const data = getData();

        data[req.user.id] = userData;

        saveData(data);

        res.json(meeting);

    }
);


app.delete(
    "/api/meetings/:id",
    authenticateToken,
    (req, res) => {

        const userData =
            getUserData(req.user.id);

        const oldLength =
            userData.meetings.length;

        userData.meetings =
            userData.meetings.filter(
                item => item.id !== req.params.id
            );

        if (userData.meetings.length === oldLength) {

            return res.status(404).json({
                message: "Meeting not found."
            });

        }

        const data = getData();

        data[req.user.id] = userData;

        saveData(data);

        res.json({
            message: "Meeting deleted."
        });

    }
);


// =====================================
// EVENTS
// =====================================

app.get(
    "/api/events",
    authenticateToken,
    (req, res) => {

        const userData =
            getUserData(req.user.id);

        res.json(userData.events);

    }
);
app.post(
    "/api/events",
    authenticateToken,
    (req, res) => {

        const title = String(req.body.title || "").trim();
        const date = String(req.body.date || "").trim();

        if (!title || !date) {
            return res.status(400).json({
                message: "Event title and date are required."
            });
        }

        const userData =
            getUserData(req.user.id);

        const event = {

            id: Date.now().toString(),

            title: title,

            date: date,

            createdAt:
                new Date().toISOString()

        };

        userData.events.push(event);

        const data = getData();

        data[req.user.id] = userData;

        saveData(data);

        res.status(201).json(event);

    }
);


app.put(
    "/api/events/:id",
    authenticateToken,
    (req, res) => {

        const userData =
            getUserData(req.user.id);

        const event =
            userData.events.find(
                item => item.id === req.params.id
            );

        if (!event) {

            return res.status(404).json({
                message: "Event not found."
            });

        }

        event.title =
            req.body.title ?? event.title;

        event.date =
            req.body.date ?? event.date;

        const data = getData();

        data[req.user.id] = userData;

        saveData(data);

        res.json(event);

    }
);


app.delete(
    "/api/events/:id",
    authenticateToken,
    (req, res) => {

        const userData =
            getUserData(req.user.id);

        const oldLength =
            userData.events.length;

        userData.events =
            userData.events.filter(
                item => item.id !== req.params.id
            );

        if (userData.events.length === oldLength) {

            return res.status(404).json({
                message: "Event not found."
            });

        }

        const data = getData();

        data[req.user.id] = userData;

        saveData(data);

        res.json({
            message: "Event deleted."
        });

    }
);


// =====================================
// POLICIES
// =====================================

app.get(
    "/api/policies",
    authenticateToken,
    (req, res) => {

        const userData =
            getUserData(req.user.id);

        res.json(userData.policies);

    }
);


app.post(
    "/api/policies",
    authenticateToken,
    (req, res) => {

        const userData =
            getUserData(req.user.id);

        const policy = {

            id: Date.now().toString(),

            title: req.body.title || "",

            description:
                req.body.description || "",

            category:
                req.body.category || "General",

            createdAt:
                new Date().toISOString()

        };

        userData.policies.push(policy);

        const data = getData();

        data[req.user.id] = userData;

        saveData(data);

        res.status(201).json(policy);

    }
);

app.put(
    "/api/events/:id",
    authenticateToken,
    (req, res) => {

        const title = String(req.body.title || "").trim();
        const date = String(req.body.date || "").trim();

        if (!title || !date) {
            return res.status(400).json({
                message: "Event title and date are required."
            });
        }

        const userData =
            getUserData(req.user.id);

        const event =
            userData.events.find(
                item => item.id === req.params.id
            );

        if (!event) {

            return res.status(404).json({
                message: "Event not found."
            });

        }

        event.title = title;
        event.date = date;

        const data = getData();

        data[req.user.id] = userData;

        saveData(data);

        res.json(event);

    }
);

app.delete(
    "/api/policies/:id",
    authenticateToken,
    (req, res) => {

        const userData =
            getUserData(req.user.id);

        const oldLength =
            userData.policies.length;

        userData.policies =
            userData.policies.filter(
                item => item.id !== req.params.id
            );

        if (userData.policies.length === oldLength) {

            return res.status(404).json({
                message: "Policy not found."
            });

        }

        const data = getData();

        data[req.user.id] = userData;

        saveData(data);

        res.json({
            message: "Policy deleted."
        });

    }
);


// =====================================
// TASKS
// =====================================

app.get(
    "/api/tasks",
    authenticateToken,
    (req, res) => {

        const userData =
            getUserData(req.user.id);

        res.json(userData.tasks);

    }
);


app.post(
    "/api/tasks",
    authenticateToken,
    (req, res) => {

        const userData =
            getUserData(req.user.id);

        const task = {

            id: Date.now().toString(),

            title: req.body.title || "",

            status:
                req.body.status || "Pending",

            createdAt:
                new Date().toISOString()

        };

        userData.tasks.push(task);

        const data = getData();

        data[req.user.id] = userData;

        saveData(data);

        res.status(201).json(task);

    }
);


app.put(
    "/api/tasks/:id",
    authenticateToken,
    (req, res) => {

        const userData =
            getUserData(req.user.id);

        const task =
            userData.tasks.find(
                item => item.id === req.params.id
            );

        if (!task) {

            return res.status(404).json({
                message: "Task not found."
            });

        }

        task.title =
            req.body.title ?? task.title;

        task.status =
            req.body.status ?? task.status;

        const data = getData();

        data[req.user.id] = userData;

        saveData(data);

        res.json(task);

    }
);


app.delete(
    "/api/tasks/:id",
    authenticateToken,
    (req, res) => {

        const userData =
            getUserData(req.user.id);

        const oldLength =
            userData.tasks.length;

        userData.tasks =
            userData.tasks.filter(
                item => item.id !== req.params.id
            );

        if (userData.tasks.length === oldLength) {

            return res.status(404).json({
                message: "Task not found."
            });

        }

        const data = getData();

        data[req.user.id] = userData;

        saveData(data);

        res.json({
            message: "Task deleted."
        });

    }
);


// =====================================
// DOCUMENTS
// =====================================

app.get(
    "/api/documents",
    authenticateToken,
    (req, res) => {

        const userData =
            getUserData(req.user.id);

        res.json(userData.documents);

    }
);


app.post(
    "/api/documents",
    authenticateToken,
    (req, res) => {

        const userData =
            getUserData(req.user.id);

        const document = {

            id: Date.now().toString(),

            title: req.body.title || "",

            description:
                req.body.description || "",

            fileName:
                req.body.fileName || "",

            fileType:
                req.body.fileType || "",

            fileData:
                req.body.fileData || "",

            createdAt:
                new Date().toISOString()

        };

        userData.documents.push(document);

        const data = getData();

        data[req.user.id] = userData;

        saveData(data);

        res.status(201).json(document);

    }
);


app.put(
    "/api/documents/:id",
    authenticateToken,
    (req, res) => {

        const userData =
            getUserData(req.user.id);

        const document =
            userData.documents.find(
                item => item.id === req.params.id
            );

        if (!document) {

            return res.status(404).json({
                message: "Document not found."
            });

        }

        document.title =
            req.body.title ?? document.title;

        document.description =
            req.body.description ??
            document.description;

        document.fileName =
            req.body.fileName ??
            document.fileName;

        document.fileType =
            req.body.fileType ??
            document.fileType;

        document.fileData =
            req.body.fileData ??
            document.fileData;

        const data = getData();

        data[req.user.id] = userData;

        saveData(data);

        res.json(document);

    }
);


app.delete(
    "/api/documents/:id",
    authenticateToken,
    (req, res) => {

        const userData =
            getUserData(req.user.id);

        const oldLength =
            userData.documents.length;

        userData.documents =
            userData.documents.filter(
                item => item.id !== req.params.id
            );

        if (userData.documents.length === oldLength) {

            return res.status(404).json({
                message: "Document not found."
            });

        }

        const data = getData();

        data[req.user.id] = userData;

        saveData(data);

        res.json({
            message: "Document deleted."
        });

    }
);


// =====================================
// TEST ROUTE
// =====================================

app.get("/api", (req, res) => {

    res.json({
        message:
            "Sagar Central backend is running!"
    });

});


// =====================================
// START SERVER
// =====================================

app.listen(PORT, () => {

    console.log("=================================");
    console.log("Sagar Central Backend");
    console.log("=================================");
    console.log(
        `Server running at http://localhost:${PORT}`
    );

});