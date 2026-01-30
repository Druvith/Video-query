#!/bin/bash
set -e

echo "Setting up environment using uv..."

# Ensure uv is installed
if ! command -v uv &> /dev/null; then
    echo "uv is not installed. Please install it: https://github.com/astral-sh/uv"
    exit 1
fi

# Create virtual environment
echo "Creating virtual environment..."
uv venv

# Activate virtual environment
source .venv/bin/activate

# Install dependencies from pyproject.toml
echo "Installing dependencies..."
uv pip install -r pyproject.toml

echo "Setup complete! Activate the environment with: source .venv/bin/activate"
