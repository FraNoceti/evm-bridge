#!/bin/bash

# EVM Bridge - Start Script
# Runs both the frontend and relayer together

echo "=============================================="
echo "  EVM Bridge - Starting Services"
echo "=============================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down services..."
    kill $RELAYER_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start the relayer
echo -e "${BLUE}[1/2]${NC} Starting relayer..."
cd scripts
npx ts-node relayer.ts &
RELAYER_PID=$!
cd ..

# Wait a moment for relayer to initialize
sleep 2

# Start the frontend
echo -e "${BLUE}[2/2]${NC} Starting frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo -e "${GREEN}=============================================="
echo "  Services Running!"
echo "==============================================${NC}"
echo ""
echo "  Frontend:  http://localhost:3000"
echo "  Relayer:   Watching for bridge events..."
echo ""
echo "  Press Ctrl+C to stop all services"
echo ""

# Wait for any process to exit
wait
