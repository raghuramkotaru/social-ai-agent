#!/bin/bash

echo "=================================================="
echo "   Social AI Agent - Setup Script"
echo "=================================================="
echo ""

# Check Node.js installation
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check npm installation
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm version: $(npm --version)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create config directory
echo ""
echo "📁 Creating config directory..."
mkdir -p config

# Check for .env file
if [ ! -f .env ]; then
    echo ""
    echo "⚠️  No .env file found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your API keys:"
    echo "   - YouTube API credentials"
    echo "   - Azure Text Analytics endpoint and key"
    echo "   - Azure OpenAI endpoint and key"
    echo "   - MongoDB connection string"
else
    echo "✅ .env file exists"
fi

# Check MongoDB
echo ""
echo "🔍 Checking MongoDB..."
if command -v mongod &> /dev/null; then
    echo "✅ MongoDB is installed"
else
    echo "⚠️  MongoDB not found. You'll need to:"
    echo "   - Install MongoDB locally, OR"
    echo "   - Use MongoDB Atlas (cloud) and update MONGODB_URI in .env"
fi

echo ""
echo "=================================================="
echo "   Setup Complete! 🎉"
echo "=================================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Edit .env file with your API credentials:"
echo "   nano .env"
echo ""
echo "2. Start MongoDB (if using local):"
echo "   mongod"
echo ""
echo "3. Start the server:"
echo "   npm start"
echo ""
echo "4. Authenticate with YouTube:"
echo "   Visit: http://localhost:5000/api/auth/youtube"
echo ""
echo "5. Test the API:"
echo "   curl http://localhost:5000/"
echo ""
echo "For detailed instructions, see README.md"
echo "For testing guide, see TESTING_GUIDE.md"
echo ""
echo "=================================================="
