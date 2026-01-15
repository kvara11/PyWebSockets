let ws = null;
let selectedUser = null;
let username = null;
let activeUser = [];


// event listeners:
window.addEventListener("load", () => {
    const liveUser = sessionStorage.getItem("live_user");
    if (liveUser) {
        startChat(JSON.parse(liveUser));
    } else {
        showLogin();
    }
});

// window.addEventListener("keydown", (event) => {
//     console.log(2,event);

//     if (event.key === "Enter") {
//         const liveUser = sessionStorage.getItem("live_user");
//         if (liveUser) {
//             startChat(JSON.parse(liveUser));
//         } else {
//             showLogin();
//         }
//     }
// });


// functions:
async function login(event) {

    event.preventDefault();
    const username = document.getElementById("username-input").value;
    if (!username) return alert("Please enter a username");

    const response = await fetch(`/auth?username=${encodeURIComponent(username)}`);
    const data = await response.json();

    if (data?.data) {
        const currentUser = { id: data.data.id, username: data.data.username };

        sessionStorage.setItem("live_user", JSON.stringify(currentUser));
        startChat(currentUser);
    } else {
        return alert('No Access!')
    }
}


function logout() {
    sessionStorage.removeItem("live_user");
    if (ws) ws.close();
    location.reload();
    showLogin();
}


function startChat(user) {

    if (!user) {
        showLogin();
        return;
    }

    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('room-screen').style.display = 'flex';
    document.getElementById('welcome-msg').innerText = `Welcome, ${user.username}`;

    ws = new WebSocket(`ws://localhost:8006/live`);
    
    const data = JSON.stringify({
        type: "join",
        user: user
    });
    ws.onopen = () => {
        ws.send(data);
    };


    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "message") {
            if ((selectedUser?.id && data.from === selectedUser?.id) || data.from === JSON.parse(sessionStorage.getItem("live_user")).id) {
                renderMessage(data.from, data.text);
            } else {
                renderMessageAlert(data.from);
            }
        }

        if (data.type === "users") {
            activeUser = [...data.users];
            renderUsers(data.users);
        }

        if (data.type === "history") {
            data.data.forEach(msg => {
                const text = `${msg.username}: ${msg.msg}`;
                renderMessage(msg.user_id, text);
            });
        }
        
        if (data.type === "join") {
            renderUsers(data.contacts, true);
        }

    };
}


function showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('room-screen').style.display = 'none';
}


function renderUsers(users, contacts = false) {
    const userId = JSON.parse(sessionStorage.getItem("live_user")).id;

    const divId = contacts ? "history-users-list" : "active-users-list";
    const list = document.getElementById(divId);

    list.innerHTML = "";

    users.forEach(user => {
        if (user.id === userId) return;

        const div = document.createElement("div");
        div.textContent = user.username;
        div.classList.add("user-item");
        div.classList.add(`userId-${user.id}`);
        div.onclick = () => selectUser(user, div);

        if (selectedUser === user) {
            div.classList.add("selected");
        }

        list.appendChild(div);
    });
}


function renderMessage(user_id, text) {
    const messages = document.getElementById("messages");
    const li = document.createElement("li");

    li.textContent = text;
    li.style.backgroundColor = selectedUser?.id == user_id ? "#D8F999" : "#E0E7FF";

    messages.append(li);
}

function renderMessageAlert(userId) {
    const userElement = document.querySelector(`.userId-${userId}`);
    userElement.classList.add("new-msg");
}


function selectUser(user, element) {
    if (selectedUser?.id == user.id) return;

    selectedUser = user;
    document.querySelectorAll("#active-users-list div").forEach(div => div.classList.remove("selected"));

    element.classList.add("selected");
    document.getElementById("messageText").disabled = false;
    document.getElementById("messageBtn").disabled = false;
    document.getElementById("messageText").placeholder = `Message to ${user.username}...`;

    getHistory();
}

function sendMessage() {
    const input = document.getElementById("messageText");
    if (!input.value || !selectedUser) return;

    ws.send(JSON.stringify({
        type: "message",
        to: selectedUser.id,
        text: input.value
    }));

    input.value = "";
}

function getHistory() {
    ws.send(JSON.stringify({
        type: "history",
        target: selectedUser.id,
    }));
}