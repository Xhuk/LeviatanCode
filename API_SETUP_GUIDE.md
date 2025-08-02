# AI API Setup Guide - No Local LLM Required

LeviatanCode works with cloud-based AI services, so you don't need to install any AI models on your machine. You just need API keys from the AI providers.

## Quick Answer: No Local AI Required

❌ **You DO NOT need:**
- Local LLM installation (like Ollama, LM Studio, etc.)
- GPU with VRAM for AI models
- Large model files downloaded locally
- Complex AI environment setup

✅ **You ONLY need:**
- Internet connection
- API keys from AI providers
- Standard web browser

## Supported AI Services

### 1. OpenAI (ChatGPT API)
**Best for:** Advanced code analysis, complex reasoning, high-quality responses

**Setup Steps:**
1. Go to [https://platform.openai.com](https://platform.openai.com)
2. Create an account or sign in
3. Navigate to "API Keys" section
4. Click "Create new secret key"
5. Copy the key (starts with `sk-...`)
6. Add to your environment: `OPENAI_API_KEY=sk-your-key-here`

**Cost:** Pay-per-use, typically $0.03 per 1K tokens
**Models Used:** GPT-4o (most advanced), GPT-3.5-turbo (faster/cheaper)

### 2. Google Gemini API
**Best for:** Multimodal analysis, cost-effective alternative, Google integration

**Setup Steps:**
1. Go to [https://aistudio.google.com](https://aistudio.google.com)  
2. Sign in with Google account
3. Click "Get API Key" 
4. Create new project or select existing one
5. Generate API key
6. Add to your environment: `GEMINI_API_KEY=your-gemini-key-here`

**Cost:** Generous free tier, then pay-per-use
**Models Used:** Gemini 1.5 Pro, Gemini 1.5 Flash

## Environment Configuration

Create a `.env` file in your project root:

```bash
# AI Services (choose one or both)
OPENAI_API_KEY=sk-your-openai-key-here
GEMINI_API_KEY=your-gemini-key-here

# Database (required)
DATABASE_URL=postgresql://user:password@localhost:5432/leviatancode

# Application Settings
NODE_ENV=development
PORT=5000
SESSION_SECRET=your-secure-session-secret
```

## How It Works (Cloud-Based)

```mermaid
graph LR
    A[Your Browser] --> B[LeviatanCode Server]
    B --> C[OpenAI API]
    B --> D[Gemini API]
    C --> E[GPT-4o Response]
    D --> F[Gemini Response]
    E --> B
    F --> B
    B --> A
```

1. **You interact** with LeviatanCode in your browser
2. **Server sends requests** to cloud AI APIs (OpenAI/Gemini)
3. **AI processes** your code and questions in the cloud
4. **Responses return** through the server to your browser
5. **No local AI computation** required on your machine

## API Key Security

### ✅ Secure Practices
- Store keys in `.env` file (never commit to Git)
- Use environment variables only
- Rotate keys regularly
- Monitor usage in AI provider dashboards

### ❌ Never Do This
- Put API keys directly in code
- Commit `.env` file to version control
- Share keys in chat/email/screenshots
- Use keys in frontend JavaScript

## Testing Your Setup

### Test OpenAI Connection
```bash
curl -X POST https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 10
  }'
```

### Test Gemini Connection
```bash
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{"parts": [{"text": "Hello!"}]}]
  }'
```

## Cost Management

### OpenAI Costs
- **GPT-4o**: ~$0.03 per 1K tokens (expensive but highest quality)
- **GPT-3.5-turbo**: ~$0.002 per 1K tokens (cheaper, good for simple tasks)
- **Typical usage**: $5-20/month for active development

### Gemini Costs  
- **Free tier**: 15 requests per minute, 1500 requests per day
- **Paid tier**: Very competitive pricing, often cheaper than OpenAI
- **Typical usage**: Often free for individual development

### Cost Optimization Tips
1. Use Gemini for simple tasks (cheaper/free)
2. Use OpenAI for complex analysis (better quality)
3. Enable caching for repeated analyses
4. Set usage limits in provider dashboards

## Troubleshooting

### "API Key Invalid" Error
- Check key format (OpenAI starts with `sk-`, Gemini is alphanumeric)
- Verify key is active in provider dashboard
- Ensure no extra spaces or characters

### "Rate Limited" Error
- You've exceeded API request limits
- Wait a few minutes and try again
- Upgrade to paid tier for higher limits

### "Network Error" 
- Check internet connection
- Verify API endpoints are accessible
- Check firewall/proxy settings

## Alternative Setup Options

### Option 1: OpenAI Only
```bash
OPENAI_API_KEY=sk-your-key-here
# System will use ChatGPT for all AI features
```

### Option 2: Gemini Only  
```bash
GEMINI_API_KEY=your-key-here
# System will use Gemini for all AI features
```

### Option 3: Both Services (Recommended)
```bash
OPENAI_API_KEY=sk-your-key-here
GEMINI_API_KEY=your-key-here
# System can switch between services for optimal cost/quality
```

## Getting Started Checklist

- [ ] Create OpenAI account and get API key
- [ ] Create Google AI Studio account and get Gemini key
- [ ] Add keys to `.env` file
- [ ] Test API connections
- [ ] Set usage limits in provider dashboards
- [ ] Start using LeviatanCode with AI assistance

## Summary

LeviatanCode requires **NO local AI installation**. It's a cloud-based system that works with:
- ✅ OpenAI API (ChatGPT) 
- ✅ Google Gemini API
- ❌ No local LLMs needed
- ❌ No GPU requirements
- ❌ No large model downloads

Just get your API keys, add them to the environment, and start developing with AI assistance!