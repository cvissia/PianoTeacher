#!/bin/bash

# PianoTeacher App Dependency Installation Script
set -e

echo "Installing PianoTeacher React App Dependencies..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies
echo "Installing dependencies with npm..."
npm install

echo "Dependencies installed successfully!"
echo "You can now run the development server with: npm run dev"