@echo off
echo ===========================================
echo PostgreSQL Password Reset Script
echo ===========================================
echo.
echo This script will help you reset the postgres password
echo.
echo Step 1: Stop PostgreSQL service
net stop postgresql-x64-18

echo.
echo Step 2: Start PostgreSQL in single-user mode
echo Run this command as Administrator:
echo.
echo "C:\Program Files\PostgreSQL\18\bin\postgres.exe" --single -D "C:\Program Files\PostgreSQL\18\data" postgres

echo.
echo Step 3: In the single-user mode, run:
echo ALTER USER postgres PASSWORD 'your_new_password';
echo \q

echo.
echo Step 4: Start PostgreSQL service again
net start postgresql-x64-18

echo.
echo Done! Your postgres password has been changed.
pause