# Flask Analyzer Integration Guide

This guide shows how to integrate the Flask Analyzer API with the main LeviatanCode application.

## Architecture Overview

```
LeviatanCode Main App (Port 5000)
        ↓ HTTP API Calls
Flask Analyzer API (Port 5001)
        ↓ AI API Calls  
OpenAI/Gemini APIs (Cloud)
```

## Integration Steps

### 1. Start Both Services

```bash
# Terminal 1: Main LeviatanCode (already running)
npm run dev

# Terminal 2: Flask Analyzer API
cd flask_analyzer
pip install -r requirements.txt
python run_server.py
```

### 2. Update Main App API Routes

Add Flask analyzer integration to `server/routes.ts`:

```typescript
// Add Flask analyzer endpoint
app.post("/api/analyze-with-flask", async (req, res) => {
  try {
    const { projectPath } = req.body;
    
    // Call Flask analyzer API
    const flaskResponse = await fetch('http://localhost:5001/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_path: projectPath })
    });
    
    if (!flaskResponse.ok) {
      throw new Error(`Flask API error: ${flaskResponse.statusText}`);
    }
    
    const analysisResult = await flaskResponse.json();
    
    // Store results in main database if needed
    // ...
    
    res.json(analysisResult);
    
  } catch (error) {
    console.error('Flask analyzer integration error:', error);
    res.status(500).json({ 
      error: 'Analysis service unavailable',
      details: error.message 
    });
  }
});
```

### 3. Frontend Integration

Add Flask analyzer calls to existing components:

```typescript
// In src/hooks/use-project-insights.ts
export const useFlaskAnalysis = (projectPath: string) => {
  return useQuery({
    queryKey: ['flask-analysis', projectPath],
    queryFn: async () => {
      const response = await fetch('/api/analyze-with-flask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath })
      });
      
      if (!response.ok) {
        throw new Error('Flask analysis failed');
      }
      
      return response.json();
    },
    enabled: !!projectPath,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

### 4. Enhanced Analysis Panel

Extend existing analysis components to use Flask results:

```typescript
// In src/components/panels/ai-chat-panel.tsx
const AnalysisPanel = () => {
  const { data: flaskAnalysis } = useFlaskAnalysis(currentProjectPath);
  const { data: existingInsights } = useProjectInsights(projectId);
  
  // Combine both analysis results
  const combinedAnalysis = {
    ...existingInsights,
    flaskAnalysis: flaskAnalysis?.analysis,
    enhancedRecommendations: flaskAnalysis?.analysis?.recommendations
  };
  
  return (
    <div className="space-y-4">
      {/* Existing analysis display */}
      
      {flaskAnalysis && (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">🔍 Enhanced Analysis</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Quality Score</p>
              <p className="font-mono text-lg">
                {flaskAnalysis.analysis.quality_assessment.quality_score}/10
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Complexity</p>
              <p className="font-mono">
                {flaskAnalysis.analysis.code_metrics.complexity_estimate}
              </p>
            </div>
          </div>
          
          {flaskAnalysis.analysis.insights.summary && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">AI Insights</p>
              <p className="text-sm mt-1">
                {flaskAnalysis.analysis.insights.summary}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

## Environment Configuration

### Main App .env (add Flask integration)
```bash
# Existing environment variables...

# Flask Analyzer Integration
FLASK_ANALYZER_URL=http://localhost:5001
FLASK_ANALYZER_ENABLED=true
```

### Flask App .env
```bash
# AI Services (same as main app)
OPENAI_API_KEY=sk-your-openai-key-here
GEMINI_API_KEY=your-gemini-key-here

# Flask Configuration
FLASK_PORT=5001
FLASK_DEBUG=true
FLASK_SECRET_KEY=your-secret-key-here
```

## API Endpoints Comparison

| Feature | Main App | Flask Analyzer |
|---------|----------|----------------|
| Project Import | ✅ Full UI | ➡️ API only |
| File Analysis | ✅ Basic | ✅ Comprehensive |
| AI Chat | ✅ Interactive | ➡️ Analysis only |
| Technology Detection | ✅ Simple | ✅ 15+ languages |
| Code Metrics | ❌ Limited | ✅ Detailed |
| Quality Assessment | ❌ Basic | ✅ Scoring system |
| Build System Detection | ❌ None | ✅ 10+ systems |
| Execution Methods | ✅ Manual | ✅ Auto-detection |

## Usage Scenarios

### Scenario 1: Enhanced Project Import
When user imports a project, automatically run Flask analysis:

```typescript
const handleProjectImport = async (projectData) => {
  // 1. Standard import (existing)
  const project = await importProject(projectData);
  
  // 2. Enhanced analysis (new)
  const flaskAnalysis = await analyzeWithFlask(project.path);
  
  // 3. Combine and display results
  setProjectInsights({
    ...project.insights,
    enhancedAnalysis: flaskAnalysis
  });
};
```

### Scenario 2: Deep Code Analysis
For detailed code analysis requests in AI chat:

```typescript
const handleDeepAnalysis = async (projectPath) => {
  const analysis = await fetch('/api/analyze-with-flask', {
    method: 'POST',
    body: JSON.stringify({ projectPath })
  });
  
  // Use comprehensive results for AI context
  return analysis.data.analysis;
};
```

### Scenario 3: Project Quality Reports
Generate comprehensive project reports:

```typescript
const generateQualityReport = async (projectId) => {
  const [basicInsights, flaskAnalysis] = await Promise.all([
    getProjectInsights(projectId),
    analyzeWithFlask(projectPath)
  ]);
  
  return {
    ...basicInsights,
    qualityScore: flaskAnalysis.quality_assessment.quality_score,
    recommendations: flaskAnalysis.recommendations,
    codeMetrics: flaskAnalysis.code_metrics
  };
};
```

## Testing Integration

### 1. Test Flask API
```bash
cd flask_analyzer
python test_analyzer.py
```

### 2. Test Main App Integration
```bash
# Test the integration endpoint
curl -X POST http://localhost:5000/api/analyze-with-flask \
  -H "Content-Type: application/json" \
  -d '{"projectPath": "."}'
```

### 3. End-to-End Test
1. Import a project in the main UI
2. Verify Flask analysis runs automatically
3. Check enhanced insights are displayed
4. Test AI chat with comprehensive context

## Error Handling

### Flask Service Unavailable
```typescript
const analyzeWithFlask = async (projectPath) => {
  try {
    const response = await fetch('http://localhost:5001/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_path: projectPath })
    });
    
    if (!response.ok) {
      throw new Error(`Flask API error: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn('Flask analyzer unavailable, using fallback analysis');
    return { 
      success: false, 
      error: 'Enhanced analysis service unavailable',
      fallback: true 
    };
  }
};
```

### Timeout Handling
```typescript
const analyzeWithTimeout = async (projectPath, timeout = 30000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch('http://localhost:5001/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_path: projectPath }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Analysis timeout - project may be too large');
    }
    throw error;
  }
};
```

## Deployment Considerations

### Development
- Main app: `npm run dev` (port 5000)
- Flask API: `python run_server.py` (port 5001)

### Production
- Use process managers for both services (PM2, systemd)
- Configure reverse proxy (nginx) for both services
- Ensure both services share same AI API keys
- Monitor both services for health and performance

### Docker Deployment
```dockerfile
# Dockerfile for combined deployment
FROM node:18 AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM python:3.11 AS analyzer
WORKDIR /app/flask_analyzer
COPY flask_analyzer/requirements.txt .
RUN pip install -r requirements.txt
COPY flask_analyzer/ .

FROM python:3.11
# Install Node.js for main app
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Copy both applications
COPY --from=frontend /app /app
COPY --from=analyzer /app/flask_analyzer /app/flask_analyzer

# Start both services
COPY start_services.sh /start_services.sh
CMD ["/start_services.sh"]
```

This integration provides the main LeviatanCode application with comprehensive project analysis capabilities while maintaining the existing user experience and adding powerful new features.