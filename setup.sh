#!/bin/bash

echo "===================================="
echo "Autism Assistant - Setup Script"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js v20 or higher from https://nodejs.org/"
    exit 1
fi

echo "Checking Node.js version..."
node --version
echo ""

# Install root dependencies
echo "Installing root dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install root dependencies"
    exit 1
fi
echo ""

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
if [ ! -f ".env" ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo ""
    echo "IMPORTANT: Please edit backend/.env and add your OpenAI API key!"
    echo ""
fi
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install backend dependencies"
    cd ..
    exit 1
fi
cd ..
echo ""

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
if [ ! -f ".env" ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
fi
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install frontend dependencies"
    cd ..
    exit 1
fi
cd ..
echo ""

echo "===================================="
echo "Setup Complete!"
echo "===================================="
echo ""
echo "NEXT STEPS:"
echo ""
echo "1. Edit backend/.env and add your OpenAI API key:"
echo "   - AI_PROVIDER=openai"
echo "   - OPENAI_API_KEY=sk-your-key-here"
echo ""
echo "2. Start the application:"
echo "   npm run dev"
echo ""
echo "3. Open http://localhost:5173 in your browser"
echo ""
echo "For more information, see:"
echo "- QUICKSTART.md for 5-minute setup"
echo "- README.md for full documentation"
echo "- API_TESTING.md for testing the API"
echo ""
