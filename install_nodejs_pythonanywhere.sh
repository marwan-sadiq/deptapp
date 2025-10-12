#!/bin/bash

# Install Node.js on PythonAnywhere
echo "🔧 Installing Node.js on PythonAnywhere..."

# Update package list
sudo apt update

# Install Node.js 18.x
echo "📦 Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
echo "✅ Node.js and npm installed successfully!"
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "✅ Frontend dependencies installed!"
echo "🚀 You can now run: npm run build"
