#!/usr/bin/env python
import psycopg2
from psycopg2 import OperationalError

def connect_postgres():
    """
    Connect to PostgreSQL database using the specified credentials
    """
    try:
        # Connection parameters
        connection_params = {
            "host": "localhost",
            "database": "rec",
            "user": "postgres",
            "password": "1234",
            "port": 5432
        }
        
        # Establish connection
        connection = psycopg2.connect(**connection_params)
        
        # Create a cursor
        cursor = connection.cursor()
        
        # Test connection with a simple query
        cursor.execute("SELECT version();")
        db_version = cursor.fetchone()
        
        print(f"Successfully connected to PostgreSQL!")
        print(f"PostgreSQL version: {db_version[0]}")
        
        return connection
    
    except OperationalError as e:
        print(f"Error connecting to PostgreSQL database: {e}")
        return None

def test_query(connection):
    """
    Run a test query to verify the connection is working
    """
    if connection is None:
        return
    
    try:
        cursor = connection.cursor()
        
        # List all tables in the current database
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        
        tables = cursor.fetchall()
        
        if tables:
            print("\nTables in database:")
            for table in tables:
                print(f"- {table[0]}")
        else:
            print("\nNo tables found in the database.")
            
    except Exception as e:
        print(f"Error executing query: {e}")
    finally:
        cursor.close()

if __name__ == "__main__":
    # Connect to PostgreSQL
    conn = connect_postgres()
    
    if conn is not None:
        # Test the connection with a query
        test_query(conn)
        
        # Close the connection
        conn.close()
        print("\nConnection closed.")
