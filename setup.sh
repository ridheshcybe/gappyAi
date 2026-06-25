#!/bin/bash

# SecureOps Sync - Automated Setup Script

echo "🚀 Starting SecureOps Sync setup..."

# 1. Setup Backend .env
if [ ! -f backend/.env ]; then
  if [ -f .env.example ]; then
    echo "📋 Copying .env.example to backend/.env..."
    cp .env.example backend/.env
  else
    echo "⚠️ No .env.example found. Creating blank backend/.env..."
    touch backend/.env
    echo "LEMMA_API_KEY=your_key_here" > backend/.env
  fi
else
  echo "✅ backend/.env already exists. Skipping."
fi

# 2. Setup Frontend .env (Optional, if you use VITE_ vars later)
if [ ! -f frontend/.env ]; then
  echo "📋 Creating blank frontend/.env..."
  touch frontend/.env
fi

echo "🎉 Setup script complete!"