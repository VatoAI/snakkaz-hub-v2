@echo off
echo Stopping running processes...
taskkill /F /IM node.exe
taskkill /F /IM next.exe

echo Clearing caches...
rmdir /s /q .next
rmdir /s /q node_modules\.cache

echo Installing dependencies...
call npm install

echo Building application...
call npm run build

echo Starting application...
call npm start 