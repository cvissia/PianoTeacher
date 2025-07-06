#!/bin/bash

# PianoTeacher GitHub Pages Deployment Script
set -e

echo "Deploying PianoTeacher to GitHub Pages..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the project
echo "Building project..."
npm run build

# Deploy using gh-pages
echo "Deploying to GitHub Pages..."
npm run deploy

echo "Deployment complete! Your app will be available at:"
echo "https://YOUR_USERNAME.github.io/PianoTeacher/"