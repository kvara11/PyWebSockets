import sqlite3

DB_NAME = "chat.db"

def init_db():
    create_schema(DB_NAME)

def create_schema(db):
    conn = sqlite3.connect(db)
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            active INTEGER DEFAULT 1
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            msg TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_deleted INTEGER DEFAULT 0
        )
    ''')

    conn.commit()
    conn.close()


def get_user(username: str):
    with sqlite3.connect(DB_NAME) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))

        row = cursor.fetchone()
        return dict(row) if row else None


def save_user(username: str):
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO users (username, active) VALUES (?, 1)", (username,))
        conn.commit()


def save_message(user_id: int, message: str):
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO messages (user_id, msg) VALUES (?, ?)", (user_id, message))
        conn.commit()