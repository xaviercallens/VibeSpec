import sqlite3
import argparse
import sys
from pathlib import Path

def init_db(db_path: Path, schema_file: Path):
    if not schema_file.exists():
        print(f"[DB-Manager] Critical Error: Schema file {schema_file} missing.")
        sys.exit(1)
        
    print(f"[DB-Manager] Sandboxing SQLite ephemeral database at {db_path}...")
    with open(schema_file, 'r') as f:
        schema_sql = f.read()
        
    # Security: block exact table drops if we want immutable testing state
    # (Although SQLite in testing is ephemeral anyway, this shows agent validation)
    if "DROP TABLE" in schema_sql.upper() and "--force" not in sys.argv:
        print("[DB-Manager] Access Denied: Destructive 'DROP TABLE' command intercepted.")
        sys.exit(1)
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.executescript(schema_sql)
    conn.commit()
    conn.close()
    print(f"[DB-Manager] Successfully scaffolded synthetic tables.")

def main():
    parser = argparse.ArgumentParser(description="Ephemeral SQLite Test DB Provisioner")
    parser.add_argument("--db", default="/tmp/vibespec-test.sqlite", help="Target DB path")
    parser.add_argument("--schema", required=True, help="SQL schema to apply")
    parser.add_argument("--force", action="store_true", help="Allow destructive drop tables")
    args = parser.parse_args()

    init_db(Path(args.db), Path(args.schema))

if __name__ == "__main__":
    main()
