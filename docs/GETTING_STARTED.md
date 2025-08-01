# Getting Started with DataScraper Pro

A step-by-step guide to get DataScraper Pro running on your Windows machine.

## What You'll Need

1. **Node.js** (version 18 or higher)
2. **Supabase account** (free tier is sufficient)
3. **OpenAI API key** (for AI features)
4. **Gemini API key** (optional, for additional AI model)

## Step-by-Step Setup

### 1. Download and Install Node.js

1. Go to [nodejs.org](https://nodejs.org/)
2. Download the LTS version for Windows
3. Run the installer and follow the prompts
4. Verify installation by opening PowerShell and running:
   ```powershell
   node --version
   npm --version
   ```

### 2. Set Up the Project

1. **Download the project** (or clone with Git)
2. **Open PowerShell** in the project directory
3. **Install dependencies**:
   ```powershell
   npm install
   ```

### 3. Set Up Supabase Database

1. **Create Supabase account**:
   - Go to [supabase.com](https://supabase.com)
   - Sign up for a free account
   - Create a new project

2. **Get database credentials**:
   - In your Supabase project dashboard
   - Go to Settings → Database
   - Copy the connection string from "Connection string" → "Transaction pooler"
   - Replace `[YOUR-PASSWORD]` with your database password

3. **Run setup script**:
   ```powershell
   .\scripts\setup-supabase.ps1
   ```
   - Enter your Supabase project ID when prompted
   - Enter your database password
   - The script will test the connection and set up your environment

### 4. Get AI API Keys

#### OpenAI API Key (Required)
1. Go to [platform.openai.com](https://platform.openai.com/api-keys)
2. Sign up or log in
3. Create a new API key
4. Copy the key (starts with `sk-`)

#### Gemini API Key (Optional)
1. Go to [aistudio.google.com](https://aistudio.google.com/app/apikey)
2. Sign in with Google account
3. Create a new API key
4. Copy the key

### 5. Configure Environment

1. **Edit the `.env` file** that was created by the setup script
2. **Add your API keys**:
   ```env
   OPENAI_API_KEY=sk-your-openai-key-here
   GEMINI_API_KEY=your-gemini-key-here
   ```

### 6. Load Sample Data

```powershell
.\scripts\seed-data.ps1
```

This will create:
- A sample e-commerce scraping project
- Example JavaScript code files
- AI prompt templates
- Configuration examples

### 7. Start the Application

```powershell
.\scripts\dev.ps1
```

The application will start and be available at http://localhost:5000

## What's Included

### Sample Project
- **E-commerce Product Scraper**: Complete example with scraper code, data analyzer, and configuration
- **Real Code Examples**: Functional JavaScript files showing web scraping patterns
- **Documentation**: Markdown files explaining the project

### AI Prompt Templates
- **Data Analysis**: Templates for analyzing scraped data
- **Code Review**: Templates for reviewing and improving code
- **Debugging**: Templates for troubleshooting issues

### Features to Explore

1. **AI Chat**: 
   - Click the "AI Chat" tab
   - Ask questions about your code
   - Use the brain icon to select prompt templates

2. **File Analysis**:
   - Click the paperclip icon in AI chat
   - Select files to analyze (debug, review, explain, optimize)

3. **Prompt Management**:
   - Click the "Prompts" tab
   - Create custom templates with variables
   - Use AI to refine your prompts

4. **Code Editor**:
   - Edit files directly in the browser
   - Syntax highlighting and autocomplete
   - Save changes automatically

## Testing Your Setup

### Test Database Connection
```powershell
.\scripts\test-db.ps1
```

### Test AI Features
1. Open the application (http://localhost:5000)
2. Go to the AI Chat tab
3. Ask: "Explain what this project does"
4. The AI should read your project files and provide a detailed explanation

### Verify File Integration
1. In AI Chat, click the paperclip icon
2. Select "scraper.js" and click "Explain"
3. The AI should analyze the actual code and explain how it works

## Troubleshooting

### PowerShell Won't Run Scripts
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Database Connection Failed
1. Verify your Supabase project is active
2. Check your database password
3. Ensure your DATABASE_URL is correct in `.env`
4. Run: `.\scripts\test-db.ps1`

### AI Not Working
1. Verify your API keys in `.env`
2. Check that keys start with correct prefixes:
   - OpenAI: `sk-`
   - Gemini: Usually starts with letters
3. Test with a simple question first

### Port Already in Use
1. Change the port in `.env`: `PORT=5001`
2. Or kill the existing process:
   ```powershell
   netstat -ano | findstr :5000
   taskkill /PID [PID_NUMBER] /F
   ```

## Next Steps

1. **Explore the sample project** to understand the structure
2. **Create your own project** with the "New Project" button
3. **Customize prompt templates** for your specific needs
4. **Build your own scrapers** using the examples as a reference
5. **Use AI assistance** for debugging and optimization

## Windows-Specific Tips

- Always use **PowerShell** (not Command Prompt)
- Scripts are in the `scripts/` folder for easy access
- All paths use Windows-style backslashes
- The application is optimized for Windows development

## Support

If you encounter issues:

1. Check this guide first
2. Run the test scripts to identify problems
3. Review the detailed [Windows Setup Guide](WINDOWS_SETUP.md)
4. Check the main [README.md](../README.md) for additional information

The application includes comprehensive error handling and helpful error messages to guide you through any issues.