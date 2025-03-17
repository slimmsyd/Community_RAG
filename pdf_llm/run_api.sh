#!/bin/bash

# Activate virtual environment if it exists
if [ -d "myenv" ]; then
    source myenv/bin/activate
fi

# Set environment variables
export FLASK_APP=api.py
export FLASK_ENV=development
export PORT=5002

# Run the Flask app
python api.py 