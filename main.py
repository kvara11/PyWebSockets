from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from database import init_db, save_message
from socket_conn import manager

app = FastAPI()

# Initialize DB on startup
# @app.on_event("startup")
# def startup_event():
#     init_db()

# Route to serve the HTML file
@app.get("/")
async def get():
    return FileResponse("index.html")

# WebSocket Route
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Wait for message from client
            data = await websocket.receive_text()
            # Save to SQLite
            save_message(data)
            # Send to everyone online
            await manager.broadcast(f"Anonymous: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)