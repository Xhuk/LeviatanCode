# Getting Started with LeviatanCode

Complete setup guide for the AI-powered development environment with Flask analyzer integration.

## Quick Setup (5 minutes)

### 1. Clone and Install
```bash
git clone <repository-url>
cd leviatancode
npm install
```

### 2. Database Setup
```bash
# Option A: Use Supabase (recommended)
# 1. Create account at https://supabase.com
# 2. Create new project
# 3. Get DATABASE_URL from Settings > Database > Connection string

# Option B: Local PostgreSQL
createdb leviatancode
```

### 3. Environment Configuration
```bash
cp .env.example .env
# Edit .env with your settings:

DATABASE_URL=postgresql://user:password@localhost/leviatancode
OPENAI_API_KEY=sk-your-openai-key-here
GEMINI_API_KEY=your-gemini-key-here
```

### 4. Start Services
```bash
# Terminal 1: Main application
npm run dev

# Terminal 2: Flask analyzer (optional but recommended)
cd flask_analyzer
pip install -r requirements.txt
python run_server.py
```

### 5. Open Browser
- Main app: http://localhost:5000
- Flask analyzer: http://localhost:5001 (API only)

## Complete User Guide

### Importing Your First Project

1. **Click "Import Project"** in the main interface
2. **Choose import method:**
   - Upload ZIP file of your project
   - Provide Git repository URL
   - Or browse to local directory

3. **Automatic Analysis** happens immediately:
   - Technology detection (Python, JavaScript, etc.)
   - Framework identification (React, Django, etc.)
   - Dependency analysis
   - Quality assessment
   - AI-powered insights

4. **View Enhanced Dashboard:**
   - Project overview with quality score
   - Detected technologies and frameworks
   - Recommended run commands
   - AI insights and improvement suggestions

### Using AI Chat with Project Context

1. **Open AI Chat Panel** (right side of interface)
2. **Ask project-specific questions:**
   - "How do I run this project?"
   - "What's the architecture of this codebase?"
   - "How can I add authentication?"
   - "Why is my build failing?"

3. **Get expert responses** powered by:
   - Complete project structure analysis
   - Technology stack understanding
   - Code quality metrics
   - Previous analysis insights

### File Explorer and Code Editor

1. **Browse project files** in the left panel
2. **Click any file** to open in Monaco editor
3. **AI understands the code** you're viewing:
   - Ask questions about specific functions
   - Get refactoring suggestions
   - Understand dependencies and relationships

### Running Projects

1. **Click "Run Project"** or check the terminal panel
2. **System suggests run commands** based on analysis:
   - `npm run dev` for Node.js projects
   - `python main.py` for Python apps
   - `./gradlew run` for Java projects
   - Custom scripts from package.json

3. **Execute with one click** and view output in terminal

## Advanced Features

### Project Quality Assessment
- **Quality Score**: 1-10 rating based on code structure, tests, documentation
- **Recommendations**: Specific improvements for your project
- **Technology Suggestions**: Better tools or frameworks for your use case

### Multi-Language Support
- **JavaScript/TypeScript**: React, Vue, Angular, Node.js
- **Python**: Django, Flask, FastAPI applications  
- **Java**: Spring Boot, Maven, Gradle projects
- **C++/C**: CMake, Make-based projects
- **And 10+ more languages**

### AI-Powered Insights
- **Architecture Analysis**: Understanding of your project's design patterns
- **Improvement Suggestions**: Specific, actionable recommendations
- **Technology Recommendations**: Better tools for your specific needs
- **Security Assessment**: Potential vulnerabilities and fixes

## Configuration Options

### AI Services Setup

**Option 1: OpenAI (Recommended for quality)**
1. Go to https://platform.openai.com
2. Create API key
3. Add to .env: `OPENAI_API_KEY=sk-...`

**Option 2: Google Gemini (Cost-effective)**
1. Go to https://aistudio.google.com
2. Get API key
3. Add to .env: `GEMINI_API_KEY=...`

**Option 3: Both services (Best experience)**
- System will use both for optimal cost/quality balance

### Database Options

**Supabase (Recommended)**
- Serverless PostgreSQL
- Easy setup and scaling
- Built-in authentication

**Local PostgreSQL**
- Full control and privacy
- Requires local installation
- Good for development

### Flask Analyzer (Optional)

The Flask analyzer provides enhanced analysis capabilities:
- **Without Flask**: Basic file analysis and AI chat
- **With Flask**: Comprehensive project analysis, quality scoring, advanced insights

To enable Flask analyzer:
```bash
cd flask_analyzer
pip install -r requirements.txt
python run_server.py
```

## Troubleshooting

### Common Issues

**"Cannot connect to database"**
- Check DATABASE_URL format
- Ensure database server is running
- Verify connection permissions

**"AI responses not working"**
- Check API keys are set correctly
- Verify API key has credits/quota
- Test with curl commands in API_SETUP_GUIDE.md

**"Flask analyzer not working"**
- Check if Flask service is running on port 5001
- Install Python dependencies: `pip install -r flask_analyzer/requirements.txt`
- Check Flask logs for error details

**"Project import failing"**
- Check file size (max 100MB for ZIP uploads)
- Ensure ZIP file contains actual project files
- Try different import method (Git URL vs ZIP)

### Getting Help

1. **Check logs** in browser developer tools console
2. **Review error messages** in terminal output
3. **Test API endpoints** using provided test scripts
4. **Check environment variables** are set correctly

## Development Workflow Examples

### Example 1: Analyzing a React Project
```bash
# 1. Import React project via ZIP upload
# 2. System detects: JavaScript, React, Vite, npm
# 3. Suggests: npm run dev, npm run build
# 4. AI chat knows: component structure, routing, state management
# 5. Quality score: 8.5/10 (has tests, good structure)
```

### Example 2: Working with Python Django
```bash
# 1. Import Django project from Git
# 2. System detects: Python, Django, PostgreSQL
# 3. Suggests: python manage.py runserver
# 4. AI chat knows: models, views, URL patterns
# 5. Recommendations: Add Docker, improve test coverage
```

### Example 3: Debugging Java Spring Boot
```bash
# 1. Import Spring Boot ZIP
# 2. System detects: Java, Spring, Maven
# 3. Suggests: ./mvnw spring-boot:run
# 4. AI chat knows: controllers, services, configuration
# 5. Helps debug: dependency injection, database connections
```

## Next Steps

Once you have LeviatanCode running:

1. **Import a project** to see the analysis capabilities
2. **Try AI chat** with project-specific questions
3. **Explore file structure** and code understanding
4. **Test run commands** suggested by the system
5. **Review quality recommendations** for improvements

## Production Deployment

For production use:
1. Use production database (Supabase Pro or dedicated PostgreSQL)
2. Set up proper API key management and rotation
3. Configure reverse proxy (nginx) for both services
4. Monitor both main app and Flask analyzer services
5. Set up automated backups for database and project files

LeviatanCode transforms any imported project into an intelligent development environment with AI assistance that understands your specific codebase, technologies, and architecture.