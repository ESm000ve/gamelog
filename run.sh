#!/usr/bin/env bash
set -e

echo "Starting Gamelog..."

if ! command -v node >/dev/null 2>&1; then
    echo "=================================================="
    echo "Error: Node.js is not installed."
    echo "Please install Node.js (version 18+) from https://nodejs.org/"
    echo "=================================================="
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "First run detected. Installing dependencies..."
    npm install
fi

echo "Launching dev server..."
npm run dev
