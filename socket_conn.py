from fastapi import WebSocket
import json

class ConnectionManager:
    
    def __init__(self):
        self.active_users: dict[int, WebSocket, str] = {}


    async def add_user(self, id: int, websocket: WebSocket, username: str):
        self.active_users[id] = {"ws": websocket, "id": id, "username": username}
        await self.broadcast_users()


    async def remove_user(self, id: int):
        self.active_users.pop(id, None)
        await self.broadcast_users()


    async def broadcast_users(self):
        users = []
        for user in self.active_users.values():
            users.append({"username": user["username"], "id": user["id"]})

        message = json.dumps({
            "type": "users",
            "users": users
        })

        for ws in self.active_users.values():
            await ws["ws"].send_text(message)


    async def send_message(self, user_id: int, message: dict):
        ws = self.active_users.get(user_id)
        if ws:
            await ws["ws"].send_text(json.dumps(message))


manager = ConnectionManager()