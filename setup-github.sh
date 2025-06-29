#!/bin/bash

# Data Control Tower - GitHub Setup Script
# This script helps initialize your GitHub repository

echo "🚀 Data Control Tower - GitHub Setup"
echo "===================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    echo "✅ Git repository initialized"
else
    echo "📦 Git repository already exists"
fi

# Add all files to git
echo "📁 Adding files to Git..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "🎉 Initial commit: Data Control Tower platform

✨ Features included:
- Enterprise data discovery & cataloging
- Advanced data quality monitoring  
- Query Studio with performance optimization
- BI tool integration (Power BI/Tableau)
- System health monitoring
- Production-ready architecture

🏗️ Tech Stack:
- Frontend: React 18 + TypeScript + Tailwind CSS
- Backend: Node.js + Express + PostgreSQL
- Database: Drizzle ORM + Neon PostgreSQL
- Build: Vite + ESBuild"

echo ""
echo "🎯 Next Steps:"
echo "1. Create a new repository on GitHub"
echo "2. Copy the repository URL"
echo "3. Run: git remote add origin <your-repo-url>"
echo "4. Run: git branch -M main"
echo "5. Run: git push -u origin main"
echo ""
echo "📋 Example commands:"
echo "git remote add origin https://github.com/yourusername/data-control-tower.git"
echo "git branch -M main"
echo "git push -u origin main"
echo ""
echo "✅ Setup complete! Your project is ready for GitHub."