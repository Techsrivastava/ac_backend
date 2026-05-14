#!/bin/bash

# Be Cool Heating - Backend Deployment Script

echo "🚀 Starting deployment..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found! Copy from .env.example and configure it."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run seed if needed (optional)
# echo "🌱 Seeding database..."
# npm run seed

# Start server
echo "🔥 Starting server..."
npm start
