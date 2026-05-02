#!/bin/bash
# Run this once in your gnsi-portal folder to set up Git
# Open terminal, navigate to gnsi-portal folder, then run: bash git-setup.sh

echo "Setting up Git for GNSI Portal..."

git init
git add .
git commit -m "GNSI Portal v1.0 — full modular structure complete"
git tag -a v1.0 -m "GNSI Portal v1.0 — modular structure, Supabase sync, 58 pages"

echo ""
echo "Done! Now push to GitHub:"
echo "  git remote add origin https://github.com/YOUR_USERNAME/gnsi-portal.git"
echo "  git push -u origin main --tags"
echo ""
echo "Replace YOUR_USERNAME with your actual GitHub username"
