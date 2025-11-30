import sqlite3
from pathlib import Path

DB_PATH = Path('data/db.sqlite')

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY,
        name TEXT,
        model TEXT,
        characteristics TEXT,
        group_id TEXT
    )
    ''')
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        name TEXT,
        score REAL,
        user_score INTEGER
    )
    ''')
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS group_products (
        group_id TEXT,
        product_id INTEGER,
        FOREIGN KEY(group_id) REFERENCES groups(id),
        FOREIGN KEY(product_id) REFERENCES products(id)
    )
    ''')
    conn.commit()
    conn.close()

init_db()  # Call on startup