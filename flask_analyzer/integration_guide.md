# Flask Analyzer Integration Guide

## Overview

The Flask analyzer has been successfully integrated with LeviatanCode's main application. The integration provides comprehensive project analysis capabilities that enhance both project import and document analysis workflows.

## Integration Points

### 1. Project Import Integration

**Location**: `server/services/project-import.ts`

**Workflow**:
1. User uploads ZIP file or provides Git URL
2. Main app extracts files to project directory
3. **Flask analyzer automatically runs** on extracted project
4. Flask analysis results enhance project insights
5. Combined results displayed in UI

**Benefits**:
- Automatic quality scoring (1-10)
- Technology and framework detection
- Intelligent run command suggestions
- Dependency analysis
- AI-powered project insights

### 2. Document Analysis Integration

**Location**: `server/routes.ts` - `/api/projects/:projectId/analyze-documents`

**Workflow**:
1. User triggers document analysis
2. **Flask analyzer runs first** for comprehensive analysis
3. If Flask unavailable, falls back to standard analysis
4. Results saved to `insightsproject.ia` file
5. Enhanced insights provided to user

**Benefits**:
- Professional-grade project analysis
- Comprehensive code metrics
- Architecture analysis
- Quality recommendations

## Flask Analyzer Service

**Location**: `server/services/flask-analyzer.ts`

**Key Features**:
- **Health checks**: Verify Flask service availability
- **Path analysis**: Analyze project directories
- **ZIP analysis**: Direct ZIP file analysis
- **Response validation**: Zod schema validation
- **Data conversion**: Convert Flask results to LeviatanCode insights format

## Usage Examples

### Project Import with Flask Analysis

```javascript
// User uploads React project ZIP
// Main app processes upload
const importResult = await projectImportService.importFromFiles(files, "My React App");

// Flask analyzer runs automatically:
// - Detects: React, TypeScript, Vite
// - Quality Score: 8.5/10
// - Suggests: npm run dev
// - Identifies: Good test coverage

// Enhanced results returned to user
```

### Document Analysis with Flask Integration

```javascript
// User clicks "Analyze Documents"
POST /api/projects/demo-project/analyze-documents

// Flask analyzer runs first:
// - Comprehensive language detection
// - Framework identification
// - Code quality assessment
// - AI-powered recommendations

// Results saved and displayed immediately
```

## Service Communication

### Flask Analyzer API Endpoints

**Health Check**:
```
GET http://localhost:5001/health
```

**Project Analysis**:
```
POST http://localhost:5001/analyze
{
  "project_path": "/path/to/project"
}
```

**ZIP File Analysis**:
```
POST http://localhost:5001/analyze
Content-Type: multipart/form-data
file: project.zip
```

### Response Format

Flask analyzer returns comprehensive analysis including:

```json
{
  "success": true,
  "analysis": {
    "technologies": {
      "primary_language": "javascript",
      "frameworks": ["react", "vite"]
    },
    "quality_assessment": {
      "quality_score": 8.5,
      "has_tests": true,
      "has_documentation": true
    },
    "execution_methods": [
      {
        "command": "npm run dev",
        "description": "Start development server"
      }
    ],
    "insights": {
      "summary": "Modern React application with good structure",
      "recommendations": ["Add Docker support", "Improve test coverage"]
    }
  }
}
```

## Error Handling

### Flask Service Unavailable

When Flask analyzer is not available:
1. System logs warning message
2. Falls back to standard analysis
3. User still gets project analysis
4. No functionality lost

### Analysis Failures

If Flask analysis fails:
1. Error logged with details
2. Graceful fallback to basic analysis
3. User experience uninterrupted
4. Partial results still provided

## Configuration

### Environment Variables

```bash
# Flask analyzer service URL
FLASK_ANALYZER_URL=http://localhost:5001

# Analysis timeout (milliseconds)
FLASK_ANALYZER_TIMEOUT=60000
```

### Service Detection

Flask analyzer availability is checked automatically:
- During project import
- Before document analysis
- Health endpoint monitoring

## Benefits for Users

### Enhanced Project Import
- **Instant Quality Assessment**: Know project quality immediately
- **Smart Run Commands**: System knows how to start your project
- **Technology Detection**: Accurate framework and language identification
- **Professional Insights**: AI-powered analysis and recommendations

### Comprehensive Document Analysis
- **Deep Code Analysis**: Beyond basic file scanning
- **Architecture Understanding**: AI analysis of project structure
- **Quality Metrics**: Quantified assessment of code quality
- **Actionable Recommendations**: Specific improvement suggestions

### AI Chat Enhancement
- **Project Context**: AI understands your project's technologies
- **Intelligent Responses**: Answers specific to your tech stack
- **Quality-Aware**: AI knows your project's strengths and weaknesses
- **Contextual Help**: Debugging and development assistance

## Development Workflow

### Running Both Services

```bash
# Terminal 1: Main LeviatanCode app
npm run dev          # Starts on port 5000

# Terminal 2: Flask analyzer
cd flask_analyzer/
pip install -r requirements.txt
python run_server.py  # Starts on port 5001
```

### Testing Integration

```bash
# Test Flask service health
curl http://localhost:5001/health

# Test main app with Flask integration
# Upload a project ZIP and verify enhanced analysis
```

## Deployment Considerations

### Production Setup

1. **Both services required** for full functionality
2. **Flask service** can run on separate server
3. **Network communication** between services
4. **Graceful fallback** if Flask unavailable
5. **Monitoring** both service health

### Scaling Options

- **Horizontal**: Multiple Flask analyzers behind load balancer
- **Vertical**: Increase resources for analysis-heavy workloads
- **Separation**: Flask analyzer on dedicated analysis servers
- **Caching**: Results cached to reduce analysis load

## Troubleshooting

### Common Issues

**"Flask analyzer not available"**
- Check if Flask service is running on port 5001
- Verify `FLASK_ANALYZER_URL` environment variable
- Test Flask health endpoint directly

**"Analysis timeout"**
- Large projects may take longer to analyze
- Increase `FLASK_ANALYZER_TIMEOUT` setting
- Monitor Flask service logs for processing time

**"Invalid analysis response"**
- Check Flask service logs for errors
- Verify project path accessibility
- Test with smaller/simpler project

### Service Status

Check Flask analyzer integration status:
```
GET /api/settings/services/status
```

Response includes Flask analyzer availability and connection status.

## Integration Success

The Flask analyzer integration provides LeviatanCode with professional-grade project analysis capabilities that match or exceed commercial IDE features. Users get:

1. **Instant project understanding** upon import
2. **Quality-driven development** insights
3. **Intelligent AI assistance** with project context
4. **Professional analysis tools** without additional setup

This transforms LeviatanCode from a basic development environment into an intelligent, analysis-driven development platform that understands your code as well as you do.