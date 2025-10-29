"""
Database migration script to add resume_text column to candidates table
"""

from sqlalchemy import create_engine, text
from app.config import settings
import sys

def add_resume_text_column():
    """Add resume_text column to candidates table if it doesn't exist"""
    engine = create_engine(settings.database_url)
    
    try:
        with engine.connect() as connection:
            # Check if the column already exists
            result = connection.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'candidates' AND column_name = 'resume_text';
            """))
            
            if result.fetchone() is None:
                # Column doesn't exist, add it
                print("Adding resume_text column to candidates table...")
                connection.execute(text("""
                    ALTER TABLE candidates 
                    ADD COLUMN resume_text TEXT;
                """))
                connection.commit()
                print("Successfully added resume_text column!")
            else:
                print("resume_text column already exists.")
                
    except Exception as e:
        print(f"Error during migration: {e}")
        sys.exit(1)

if __name__ == "__main__":
    add_resume_text_column()