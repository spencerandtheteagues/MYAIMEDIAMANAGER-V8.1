#!/bin/bash

# Test runner script for MyAiMediaMgr
# Usage: ./run-tests.sh [full|int|e2e]

PHASE=${1:-full}

echo "Running tests in $PHASE mode..."

case $PHASE in
  unit)
    echo "Running unit tests..."
    echo "No unit tests configured"
    ;;
  int)
    echo "Running integration tests..."
    node scripts/test-runner.js --phase=int
    ;;
  e2e)
    echo "Running E2E tests..."
    node scripts/test-runner.js --phase=e2e
    ;;
  full|*)
    echo "Running full test suite..."
    node scripts/test-runner.js --phase=full
    ;;
esac