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
            target_user_id INTEGER NOT NULL,
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


def save_message(user_id: int, target_user_id: int, message: str):
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO messages (user_id, target_user_id, msg) VALUES (?, ?, ?)", (user_id, target_user_id, message))
        conn.commit()

def get_messages(user_id: int, target_user_id: int):
    with sqlite3.connect(DB_NAME) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        query = """
            SELECT messages.*, username.username, targetUser.username
            FROM messages
            LEFT JOIN users AS username ON messages.user_id = username.id
            LEFT JOIN users AS targetUser ON messages.target_user_id = targetUser.id
            WHERE (user_id = ? AND target_user_id = ?) OR (target_user_id = ? AND user_id = ?) 
            ORDER BY id DESC LIMIT 10
        """
        cursor.execute(query, (user_id, target_user_id, user_id, target_user_id))

        row = cursor.fetchall()
        return [dict(row) for row in row] if row else []

def get_contacts_history(user_id: int):
    with sqlite3.connect(DB_NAME) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        query = """
            SELECT DISTINCT messages.user_id AS id, COALESCE(username.username, 'Deleted User') AS username
            FROM messages
            LEFT JOIN users AS username ON messages.user_id = username.id
            WHERE target_user_id = ?
        """
        cursor.execute(query, (user_id,))

        row = cursor.fetchall()
        result1 = [dict(row) for row in row]


        query = """
            SELECT DISTINCT messages.target_user_id AS id, COALESCE(targetUser.username, 'Deleted User') AS username
            FROM messages
            LEFT JOIN users AS targetUser ON messages.target_user_id = targetUser.id
            WHERE user_id = ?
        """
        cursor.execute(query, (user_id,))

        row = cursor.fetchall()
        result2 = [dict(row) for row in row]

        last_result = result1 or []

        for i in result2:
            for j in result1:
                if i['id'] == j['id']:
                    break
            else:
                last_result.append(i)
        
        return last_result


