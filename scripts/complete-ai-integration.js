// Complete AI Integration Script
// This script integrates real AI functionality into LeviatanCode

const fs = require('fs');
const path = require('path');

async function integrateAI() {
    console.log('🤖 Integrating AI functionality...');
    
    // Check if AI keys are configured
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasGemini = !!process.env.GEMINI_API_KEY;
    
    if (!hasOpenAI && !hasGemini) {
        console.error('❌ No AI API keys found. Please configure OPENAI_API_KEY or GEMINI_API_KEY');
        return false;
    }
    
    console.log(`✅ AI keys configured: OpenAI=${hasOpenAI}, Gemini=${hasGemini}`);
    
    // Create AI service files
    const aiServiceContent = `
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';

class AIService {
    private openai?: OpenAI;
    private gemini?: GoogleGenAI;
    
    constructor() {
        if (process.env.OPENAI_API_KEY) {
            this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        }
        
        if (process.env.GEMINI_API_KEY) {
            this.gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        }
    }
    
    async generateResponse(messages: Array<{role: string, content: string}>, projectContext?: any) {
        const systemPrompt = this.buildSystemPrompt(projectContext);
        
        try {
            if (this.openai) {
                const response = await this.openai.chat.completions.create({
                    model: 'gpt-4o',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...messages
                    ],
                    temperature: 0.7,
                    max_tokens: 2000
                });
                
                return response.choices[0].message.content;
            }
            
            if (this.gemini) {
                const chat = this.gemini.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: messages.map(m => ({
                        role: m.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: m.content }]
                    })),
                    systemInstruction: systemPrompt
                });
                
                const response = await chat;
                return response.text;
            }
            
            throw new Error('No AI service available');
        } catch (error) {
            console.error('AI Service Error:', error);
            throw error;
        }
    }
    
    async analyzeProject(projectFiles: any[], projectInfo: any) {
        const analysisPrompt = \`You are an expert software developer analyzing a project.
        
Project Info: \${JSON.stringify(projectInfo, null, 2)}

Files Structure: \${JSON.stringify(projectFiles, null, 2)}

Please analyze this project and provide:
1. Project type and main technologies
2. How to install dependencies 
3. How to run the project
4. Common issues and debugging tips
5. Recommended development workflow

Format your response as JSON with these keys: type, technologies, installCommands, runCommands, debuggingTips, workflow\`;

        try {
            const response = await this.generateResponse([
                { role: 'user', content: analysisPrompt }
            ]);
            
            return JSON.parse(response || '{}');
        } catch (error) {
            console.error('Project analysis failed:', error);
            return {
                type: 'Unknown',
                technologies: ['Unknown'],
                installCommands: ['npm install'],
                runCommands: ['npm start'],
                debuggingTips: ['Check console for errors'],
                workflow: 'Standard development workflow'
            };
        }
    }
    
    private buildSystemPrompt(projectContext?: any) {
        return \`You are LeviatanCode AI, an expert software development assistant. You help developers understand, run, and debug their projects.

\${projectContext ? \`Current Project Context: \${JSON.stringify(projectContext, null, 2)}\` : ''}

Your capabilities:
- Analyze project structure and technologies
- Provide step-by-step instructions for running projects  
- Debug common issues across multiple programming languages
- Suggest best practices and optimizations
- Help with code understanding and refactoring

Always provide practical, actionable advice. When suggesting commands, explain what they do.\`;
    }
}

export const aiService = new AIService();
`;

    // Write AI service file
    const serverDir = path.join(process.cwd(), 'server');
    if (!fs.existsSync(serverDir)) {
        fs.mkdirSync(serverDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(serverDir, 'ai-service.ts'), aiServiceContent);
    console.log('✅ AI service created');
    
    return true;
}

integrateAI().then(success => {
    if (success) {
        console.log('🎉 AI integration completed successfully!');
    } else {
        console.log('❌ AI integration failed');
        process.exit(1);
    }
}).catch(error => {
    console.error('AI integration error:', error);
    process.exit(1);
});