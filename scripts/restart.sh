#!/bin/bash

# Stop any running processes
echo "Stopping running processes..."
pkill -f "next"
pkill -f "node"

# Clear caches
echo "Clearing caches..."
rm -rf .next
rm -rf node_modules/.cache

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building application..."
npm run build

# Start the application
echo "Starting application..."
npm start 