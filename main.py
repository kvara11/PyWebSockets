from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import json
from fastapi.responses import FileResponse
from database import init_db, user_exists, save_user, save_message
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
async def get_users(username: str):
    user = user_exists(username)
    if user:
        return {"data": user}
    else:
        save_user(username)
        return {"data": user_exists(username)}


@app.websocket("/live")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    username = None

    try:
        while True:
            data = json.loads(await websocket.receive_text())

            if data["type"] == "join":
                username = data["username"]
                await manager.add_user(username, websocket)

            if data["type"] == "message":
                target = data["to"]
                content = data["content"]

                message = {
                    "type": "message",
                    "content": f"{username}: {content}",
                    "is_private": True
                }

                # await manager.send_private(target, message)
                await manager.send_private(username, message)

    except WebSocketDisconnect:
        if username:
            await manager.remove_user(username)