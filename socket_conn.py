from fastapi import WebSocket
import json

class ConnectionManager:
    def __init__(self):
        self.active_users: dict[str, WebSocket] = {}

    async def add_user(self, username: str, websocket: WebSocket):
        self.active_users[username] = websocket
        await self.broadcast_users()

    async def remove_user(self, username: str):
        self.active_users.pop(username, None)
        await self.broadcast_users()

    async def broadcast_users(self):
        message = json.dumps({
            "type": "users",
            "list": list(self.active_users.keys())
        })
        for ws in self.active_users.values():
            await ws.send_text(message)

    async def send_private(self, username: str, message: dict):
        ws = self.active_users.get(username)
        if ws:
            await ws.send_text(json.dumps(message))

manager = ConnectionManager()