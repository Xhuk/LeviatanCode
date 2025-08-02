# LeviatanCode Flask Analyzer API

AI-powered project analysis tool built with Flask that provides comprehensive project analysis through a single RESTful endpoint `/analyze`.

## Features

- **Single Endpoint Analysis**: `/analyze` endpoint that processes projects and returns structured JSON analysis
- **Multiple Input Methods**: Accept project paths or ZIP file uploads
- **Comprehensive Analysis**: Technology detection, dependency analysis, code metrics, quality assessment
- **AI-Powered Insights**: Integration with OpenAI GPT-4o and Google Gemini for intelligent recommendations
- **Multi-Language Support**: Supports 15+ programming languages including Python, JavaScript, Java, C++, etc.
- **Framework Detection**: Automatic detection of 20+ frameworks (React, Django, Flask, Spring, etc.)
- **Build System Analysis**: Identifies build tools like Webpack, Vite, Maven, Gradle, etc.
- **Execution Method Detection**: Automatically determines how to run projects
- **Code Quality Assessment**: Analyzes test coverage, documentation, CI/CD setup
- **Security**: File upload validation, size limits, temporary file cleanup

## Quick Start

### Installation

```bash
cd flask_analyzer
pip install -r requirements.txt
```

### Environment Setup

Create a `.env` file:

```bash
# AI Services (optional but recommended for full functionality)
OPENAI_API_KEY=sk-your-openai-key-here
GEMINI_API_KEY=your-gemini-key-here

# Flask Configuration
FLASK_PORT=5001
FLASK_DEBUG=true
FLASK_SECRET_KEY=your-secret-key-here
```

### Running the Server

```bash
python app.py
```

The API will be available at `http://localhost:5001`

## API Usage

### 1. Analyze Local Project Path

```bash
curl -X POST http://localhost:5001/analyze \
  -H "Content-Type: application/json" \
  -d '{"project_path": "/path/to/your/project"}'
```

### 2. Analyze Uploaded ZIP File

```bash
curl -X POST http://localhost:5001/analyze \
  -F "file=@your-project.zip"
```

### 3. Health Check

```bash
curl http://localhost:5001/health
```

## Response Format

The `/analyze` endpoint returns a comprehensive JSON analysis:

```json
{
  "success": true,
  "analysis": {
    "timestamp": "2025-01-02T16:00:00",
    "project_path": "/path/to/project",
    "basic_info": {
      "name": "my-project",
      "size_bytes": 1048576,
      "file_count": 150,
      "directory_count": 25
    },
    "technologies": {
      "primary_language": "javascript",
      "languages_detected": ["javascript", "typescript", "css"],
      "language_stats": {
        "javascript": 50000,
        "typescript": 30000
      }
    },
    "structure": {
      "tree": [...],
      "estimated_project_type": "web_application"
    },
    "dependencies": {
      "npm/node": {
        "dependencies": {"react": "^18.0.0"},
        "scripts": {"start": "npm run dev"}
      }
    },
    "frameworks": ["react", "express"],
    "build_systems": ["vite", "webpack"],
    "execution_methods": [
      {
        "type": "npm_script",
        "command": "npm run dev",
        "description": "Run development server"
      }
    ],
    "code_metrics": {
      "total_lines": 5000,
      "code_lines": 3500,
      "files_analyzed": 45,
      "complexity_estimate": "medium"
    },
    "quality_assessment": {
      "has_tests": true,
      "has_documentation": true,
      "quality_score": 8
    },
    "recommendations": [
      "Add CI/CD pipeline",
      "Improve test coverage"
    ],
    "insights": {
      "summary": "Modern React application with good structure...",
      "architecture_analysis": "Well-organized component hierarchy...",
      "improvement_suggestions": [...],
      "ai_service_used": "openai"
    }
  }
}
```

## Supported Technologies

### Programming Languages (15+)
- JavaScript/TypeScript (React, Node.js, Vue, Angular)
- Python (Django, Flask, FastAPI)
- Java (Spring, Maven, Gradle)
- C/C++ (CMake, Make)
- C# (.NET, MSBuild)
- Rust (Cargo)
- Go (Go modules)
- PHP (Laravel, Composer)
- Ruby (Rails, Bundler)
- Swift
- Kotlin
- Dart/Flutter
- Scala

### Package Managers
- npm, yarn, pnpm (Node.js)
- pip, poetry, pipenv (Python)
- maven, gradle (Java)
- cargo (Rust)
- composer (PHP)
- bundler (Ruby)
- go modules (Go)

### Frameworks Detection
- **Frontend**: React, Vue, Angular, Svelte
- **Backend**: Express, Django, Flask, FastAPI, Spring, Rails, Laravel
- **Mobile**: Flutter, React Native
- **Desktop**: Electron, Unity

### Build Systems
- Webpack, Vite, Rollup, Parcel
- Maven, Gradle, Make, CMake
- MSBuild, Cargo

## AI Integration

The system integrates with cloud-based AI services for intelligent analysis:

### OpenAI Integration
- Uses GPT-4o for advanced code analysis
- Provides architectural insights and recommendations
- Requires `OPENAI_API_KEY`

### Google Gemini Integration
- Alternative AI service for cost-effective analysis
- Multimodal analysis capabilities
- Requires `GEMINI_API_KEY`

### No Local LLM Required
- All AI processing happens in the cloud
- No GPU or local model installation needed
- Just requires API keys from providers

## Integration with LeviatanCode

This Flask API is designed to integrate with the main LeviatanCode system:

1. **Standalone Service**: Runs independently on port 5001
2. **API Integration**: Main LeviatanCode app calls this service
3. **Data Exchange**: Returns structured JSON for UI consumption
4. **File Processing**: Handles ZIP uploads and temporary extraction
5. **AI Enhancement**: Provides AI insights using the same API keys

### Integration Example

```typescript
// From main LeviatanCode app
const analyzeProject = async (projectPath: string) => {
  const response = await fetch('http://localhost:5001/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_path: projectPath })
  });
  
  const result = await response.json();
  return result.analysis;
};
```

## Error Handling

The API provides comprehensive error handling:

- **400 Bad Request**: Invalid input or missing parameters
- **404 Not Found**: Project path doesn't exist
- **413 Payload Too Large**: File exceeds 100MB limit
- **500 Internal Server Error**: Analysis or AI service errors

## Security Features

- File upload validation and size limits
- Secure filename handling
- Temporary file cleanup
- CORS protection
- Input sanitization
- API key protection

## Development

### Testing the API

```bash
# Test with sample project
curl -X POST http://localhost:5001/analyze \
  -H "Content-Type: application/json" \
  -d '{"project_path": "."}'

# Test health endpoint
curl http://localhost:5001/health
```

### Adding New Analysis Features

1. Extend `ProjectAnalyzer` class with new analysis methods
2. Add results to the main `analyze_project()` method
3. Update the response schema documentation
4. Test with various project types

## Deployment

### Production Setup

```bash
# Install production dependencies
pip install -r requirements.txt gunicorn

# Run with Gunicorn
gunicorn -w 4 -b 0.0.0.0:5001 app:app
```

### Environment Variables

```bash
FLASK_ENV=production
FLASK_DEBUG=false
OPENAI_API_KEY=sk-your-production-key
GEMINI_API_KEY=your-production-key
FLASK_SECRET_KEY=your-secure-production-secret
```

## License

Part of the LeviatanCode project - comprehensive AI-powered development environment.