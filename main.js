let ws = null;
let selectedUser = null;
let username = null;


// event listeners:
window.addEventListener("load", () => {
    const liveUser = sessionStorage.getItem("live_user");
    if (liveUser) {
        startChat(JSON.parse(liveUser));
    } else {
        showLogin();
    }
});


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

    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('room-screen').style.display = 'flex';
    document.getElementById('welcome-msg').innerText = `Welcome, ${user.username}`;

    const data = JSON.stringify({
        type: "join",
        user: user
    });

    ws = new WebSocket(`ws://localhost:8006/live`);
    ws.onopen = () => {
        ws.send(data);
    };


    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "message") {
            const messages = document.getElementById("messages");
            const li = document.createElement("li");
            li.textContent = data.text;
            messages.prepend(li);
        }

        if (data.type === "users") {
            renderUsers(data.users);
        }
    };
}


function showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('room-screen').style.display = 'none';
}


function renderUsers(users) {
    const userId = JSON.parse(sessionStorage.getItem("live_user")).id;
    const list = document.getElementById("active-users-list");

    list.innerHTML = "";
    
    users.forEach(user => {
        if (user.id === userId) return;

        const div = document.createElement("div");
        div.textContent = user.username;
        div.classList.add("user-item");
        div.onclick = () => selectUser(user, div);

        if (selectedUser === user) {
            div.classList.add("selected");
        }

        list.appendChild(div);
    });
}


function selectUser(user, element) {
    selectedUser = user;
    document.querySelectorAll("#active-users-list div").forEach(div => div.classList.remove("selected"));

    element.classList.add("selected");
    document.getElementById("messageText").disabled = false;
    document.getElementById("messageBtn").disabled = false;
    document.getElementById("messageText").placeholder = `Message to ${user.username}...`;
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