#!/bin/bash

# Deploy PianoTeacher to cvissia.github.io
set -e

echo "🎹 Deploying PianoTeacher to cvissia.github.io..."

# Build the project
echo "📦 Building project..."
npm install
npm run build

# Clone or update cvissia.github.io repo
REPO_DIR="../cvissia.github.io"
if [ -d "$REPO_DIR" ]; then
    echo "📂 Updating existing cvissia.github.io repo..."
    cd "$REPO_DIR"
    git pull origin main
    cd - > /dev/null
else
    echo "📥 Cloning cvissia.github.io repo..."
    cd ..
    git clone https://github.com/cvissia/cvissia.github.io.git
    cd PianoTeacher
fi

# Create PianoTeacher directory in cvissia.github.io
echo "📁 Setting up PianoTeacher directory..."
mkdir -p "$REPO_DIR/PianoTeacher"

# Copy built files
echo "📋 Copying built files..."
cp -r dist/* "$REPO_DIR/PianoTeacher/"

# Commit and push
echo "🚀 Committing and pushing to cvissia.github.io..."
cd "$REPO_DIR"
git add PianoTeacher/
git commit -m "Deploy PianoTeacher app - $(date '+%Y-%m-%d %H:%M:%S')"
git push origin main

echo "✅ Deployment complete!"
echo "🌐 Your app will be available at: https://cvissia.github.io/PianoTeacher/"