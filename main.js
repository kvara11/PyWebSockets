let ws = null;
let selectedUser = null;
let username = null;


// event listeners:
window.addEventListener("load", () => {
    const liveUser = sessionStorage.getItem("live_user");
    if (liveUser) {
        startChat(JSON.parse(liveUser).username);
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
        sessionStorage.setItem("live_user", JSON.stringify({id: data.data.id, username: data.data.username}));
        startChat(data.data.username);
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


function startChat(username) {

    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('room-screen').style.display = 'flex';
    document.getElementById('welcome-msg').innerText = `Welcome, ${username}`;

    ws = new WebSocket(`ws://localhost:8006/live`);

    // ?username=${encodeURIComponent(username)}
    ws.onopen = () => {
        ws.send(JSON.stringify({
            type: "join",
            username: username
        }));
    };
    

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "message") {
            const messages = document.getElementById("messages");
            const li = document.createElement("li");
            li.textContent = data.content;
            if (data.is_private) li.style.color = "red";
            messages.prepend(li);
        }

        if (data.type === "users") {
            renderUsers(data.list);
        }
    };
}


function showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('room-screen').style.display = 'none';
}


function renderUsers(users) {
    const username = JSON.parse(sessionStorage.getItem("live_user")).username;
    const list = document.getElementById("active-users-list");
    
    list.innerHTML = "";

    users.forEach(user => {
        if (user === username) return;
        
        const div = document.createElement("div");
        div.textContent = user;
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
    document.getElementById("messageText").placeholder = `Message to ${user}...`;
}

function sendMessage() {
    const input = document.getElementById("messageText");
    if (!input.value || !selectedUser) return;

    ws.send(JSON.stringify({
        type: "message",
        to: selectedUser,
        content: input.value
    }));

    input.value = "";
}