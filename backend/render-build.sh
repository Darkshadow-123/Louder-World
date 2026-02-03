#!/bin/bash
set -e

echo "==> Installing Node dependencies..."
npm install --omit=dev --prefer-offline --no-audit

echo "==> Setup complete"
