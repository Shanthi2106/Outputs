#!/bin/bash
set -e

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "Current directory: $(pwd)"
echo "Building from: $SCRIPT_DIR"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "Error: package.json not found. Current directory: $(pwd)"
  ls -la
  exit 1
fi

# Build backend
echo "📦 Installing backend dependencies..."
if [ -d "backend" ]; then
  cd backend
  npm install
  echo "📦 Building backend..."
  npm run build
  cd ..
else
  echo "Error: backend directory not found"
  exit 1
fi

# Build frontend
echo "📦 Installing frontend dependencies..."
if [ -d "frontend" ]; then
  cd frontend
  npm install
  echo "📦 Building frontend..."
  npm run build
  cd ..
else
  echo "Error: frontend directory not found"
  exit 1
fi

echo "✅ Build complete!"
