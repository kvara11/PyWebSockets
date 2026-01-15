from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import json
from fastapi.responses import FileResponse
from database import init_db, get_user, save_user, save_message, get_messages, get_contacts_history
from socket_conn import manager
from fastapi.staticfiles import StaticFiles


app = FastAPI()
app.mount("/public", StaticFiles(directory="."), name="public")


@app.on_event("startup")
def startup_event():
    init_db()

@app.get("/")
async def get():
    return FileResponse("index.html")


@app.get("/auth")
async def login(username: str):
    user = get_user(username)
    if user:
        contacts = get_contacts_history(user["id"])
        return {"data": user, "contacts": contacts}
    else:
        save_user(username)
        return {"data": get_user(username)}


@app.websocket("/live")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    user_id = None
    username = None

    try:
        while True:
            data = json.loads(await websocket.receive_text())

            if data["type"] == "join":
                user = data["user"]
                user_id = user["id"]
                username = user["username"]
                if user_id:
                    await manager.add_user(user_id, websocket, username)
                
                message = {
                    "type": "join",
                    "contacts": get_contacts_history(user_id)
                }

                await manager.send_message(user_id, message)

            if data["type"] == "message":
                target = data["to"]
                content = data["text"]
                
                message = {
                    "type": "message",
                    "text": f"{username}: {content}",
                    "from": user_id
                }
                
                save_message(user_id, target, content)

                await manager.send_message(target, message)
                await manager.send_message(user_id, message)

            if data["type"] == "history":
                target = data["target"]
                messages = list(get_messages(user_id, target))
                
                await manager.send_history(user_id, messages)

    except WebSocketDisconnect:
        if user_id:
            await manager.remove_user(user_id)