let ws = null;

function enterChat(event) {
    
    event.preventDefault();
    const username = document.getElementById("username-input").value;
    
    if (username) {
        
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('room-screen').style.display = 'flex';
        document.getElementById('welcome-msg').innerText = `Welcome, ${username}`;

        // Connect to WebSocket
        ws = new WebSocket(`ws://localhost:8006/ws`);
        // ?username=${encodeURIComponent(username)}
        ws.onmessage = function (event) {
            var messages = document.getElementById('messages');
            var message = document.createElement('li');
            message.textContent = event.data;
            messages.prepend(message);
        };
    }
}

function sendMessage() {
    const input = document.getElementById("messageText");
    if (input.value && ws) {
        ws.send(input.value);
        input.value = '';
    }
}