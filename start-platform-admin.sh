#!/bin/bash

echo "Starting Nexus Platform Admin Panel..."
echo

cd platform-admin
echo "Installing dependencies..."
pnpm install

echo
echo "Starting development server..."
echo "Platform Admin will be available at: http://localhost:5174"
echo "Main Nexus app should be running at: http://localhost:5173"
echo "Backend API should be running at: http://localhost:3001"
echo

pnpm dev
