import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, AnalysisResult } from "@shared/schema";
import { storage } from "../storage";
import { logger } from "../utils/colorLogger";
// Use native fetch in Node.js 18+

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || ""
});

const gemini = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || ""
});

export class AIService {
  private ollamaConfig = {
    url: process.env.OLLAMA_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3'
  };

  // Alias for backward compatibility
  async generateCompletion(
    messages: ChatMessage[], 
    model: string = "gpt-4o",
    aiMode: string = "chatgpt-only"
  ): Promise<string> {
    return this.generateChatResponse(messages, model, aiMode);
  }

  async generateChatResponse(
    messages: ChatMessage[], 
    model: string = "gpt-4o",
    aiMode: string = "chatgpt-only"
  ): Promise<string> {
    try {
      // Route based on AI mode for beta feature
      if (aiMode === "dual-mode" || aiMode === "ollama-dev") {
        // Determine if this is a development task vs architectural guidance
        const lastMessage = messages[messages.length - 1]?.content || "";
        const isDevelopmentTask = this.isDevelopmentTask(lastMessage);
        
        if ((aiMode === "dual-mode" && isDevelopmentTask) || aiMode === "ollama-dev") {
          try {
            logger.ollama("Processing development task with Llama3");
            return await this.generateOllamaResponse(messages, this.ollamaConfig.model);
          } catch (ollamaError) {
            logger.ollama("Request failed, falling back to ChatGPT", "warn");
            logger.chatgpt("Taking over from Ollama fallback");
            return await this.generateOpenAIResponse(messages, "gpt-4o");
          }
        }
      }

      // Default behavior: OpenAI for architecture, complex analysis
      if (model.startsWith("gpt")) {
        logger.chatgpt(`Processing request with ${model}`);
        return await this.generateOpenAIResponse(messages, model);
      } else if (model.startsWith("gemini")) {
        logger.gemini(`Processing request with ${model}`);
        return await this.generateGeminiResponse(messages, model);
      } else if (model.startsWith("llama") || model.startsWith("codellama")) {
        logger.ollama(`Processing request with ${model}`);
        return await this.generateOllamaResponse(messages, model);
      } else {
        throw new Error(`Unsupported model: ${model}`);
      }
    } catch (error) {
      logger.error("AI Service Error: " + (error as Error).message, "system");
      throw new Error("Failed to generate AI response");
    }
  }

  private isDevelopmentTask(content: string): boolean {
    const devKeywords = [
      'debug', 'fix', 'code', 'function', 'method', 'class', 'variable',
      'implement', 'refactor', 'optimize', 'error', 'bug', 'syntax',
      'test', 'unit test', 'integration', 'console.log', 'print',
      'import', 'export', 'api', 'endpoint', 'database', 'query',
      'component', 'hook', 'state', 'props', 'css', 'style'
    ];
    
    const archKeywords = [
      'architecture', 'design', 'plan', 'strategy', 'approach',
      'framework', 'structure', 'pattern', 'methodology', 'best practice',
      'scalability', 'performance', 'security', 'deployment', 'infrastructure'
    ];

    const lowerContent = content.toLowerCase();
    const devScore = devKeywords.filter(keyword => lowerContent.includes(keyword)).length;
    const archScore = archKeywords.filter(keyword => lowerContent.includes(keyword)).length;

    return devScore > archScore;
  }

  private async generateOpenAIResponse(
    messages: ChatMessage[], 
    model: string
  ): Promise<string> {
    const openaiMessages = messages.map(msg => ({
      role: msg.role as "user" | "assistant",
      content: msg.content
    }));

    const response = await openai.chat.completions.create({
      model,
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 2000
    });

    return response.choices[0].message.content || "I couldn't generate a response.";
  }

  private async generateGeminiResponse(
    messages: ChatMessage[], 
    model: string
  ): Promise<string> {
    const prompt = messages.map(msg => 
      `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
    ).join("\n");

    const response = await gemini.models.generateContent({
      model: model || "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "I couldn't generate a response.";
  }

  private async generateOllamaResponse(
    messages: ChatMessage[],
    model: string
  ): Promise<string> {
    const prompt = messages.map(msg => 
      `${msg.role === "user" ? "Human" : "Assistant"}: ${msg.content}`
    ).join("\n\n");

    const response = await fetch(`${this.ollamaConfig.url}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt + "\n\nAssistant:",
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2000
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || "I couldn't generate a response.";
  }

  async testOllamaConnection(url: string, model: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${url}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }

      const data = await response.json();
      const models = data.models || [];
      const modelExists = models.some((m: any) => m.name === model || m.name.startsWith(model));

      if (!modelExists) {
        return { success: false, error: `Model '${model}' not found. Available: ${models.map((m: any) => m.name).join(', ')}` };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async analyzeScrapedData(data: any[]): Promise<AnalysisResult> {
    try {
      const dataString = JSON.stringify(data.slice(0, 10)); // Limit data size
      
      const prompt = `Analyze this scraped data and provide insights:
${dataString}

Please provide:
1. Key insights about the data patterns
2. Quality metrics and statistics  
3. Actionable recommendations for improvement
4. Any data quality issues

Format your response as JSON with these fields:
- insights: string[]
- metrics: object with key-value pairs
- recommendations: string[]`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        insights: result.insights || [],
        metrics: result.metrics || {},
        recommendations: result.recommendations || [],
        visualizations: []
      };
    } catch (error) {
      console.error("Data analysis error:", error);
      return {
        insights: ["Unable to analyze data at this time"],
        metrics: {},
        recommendations: ["Please check your data format and try again"],
        visualizations: []
      };
    }
  }

  async generateDocumentation(code: string, fileName: string): Promise<string> {
    try {
      const prompt = `Generate comprehensive documentation for this code file (${fileName}):

${code}

Include:
- Function/class descriptions
- Parameter documentation
- Return value descriptions
- Usage examples
- Dependencies and requirements
- Configuration options

Format as markdown.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3
      });

      return response.choices[0].message.content || "Documentation could not be generated.";
    } catch (error) {
      console.error("Documentation generation error:", error);
      return "# Documentation Generation Failed\n\nUnable to generate documentation for this file.";
    }
  }

  async generateCodeExplanation(code: string): Promise<string> {
    try {
      const prompt = `Explain this code clearly and concisely:

${code}

Focus on:
- What the code does
- How it works
- Key algorithms or patterns used
- Potential improvements`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 500
      });

      return response.choices[0].message.content || "Could not explain this code.";
    } catch (error) {
      console.error("Code explanation error:", error);
      return "Unable to explain this code at the moment.";
    }
  }

  async *streamChatResponse(
    messages: ChatMessage[], 
    model: string = "gpt-4o"
  ): AsyncGenerator<string, void, unknown> {
    try {
      const openaiMessages = messages.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      }));

      const stream = await openai.chat.completions.create({
        model,
        messages: openaiMessages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: true
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
      yield "Error: Unable to stream response";
    }
  }

  async refinePrompt(promptText: string, category: string, targetUse: string): Promise<string> {
    try {
      const refinementPrompt = `You are an expert prompt engineer. Please refine and improve this AI prompt:

**Original Prompt:**
${promptText}

**Category:** ${category}
**Target Use:** ${targetUse}

Please improve this prompt by:
1. Making it more specific and actionable
2. Adding clear structure and formatting instructions
3. Including relevant context variables (use {{variableName}} format)
4. Ensuring it produces consistent, high-quality results
5. Optimizing for the specific category and use case

Return only the refined prompt text, ready to use. Include variable placeholders where appropriate.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: refinementPrompt }],
        temperature: 0.3,
        max_tokens: 1000
      });

      return response.choices[0].message.content || promptText;
    } catch (error) {
      console.error("Prompt refinement error:", error);
      return promptText; // Return original if refinement fails
    }
  }

  async generateChatResponseWithContext(
    messages: ChatMessage[], 
    projectId: string,
    model: string = "gpt-4o",
    aiMode: string = "chatgpt-only"
  ): Promise<string> {
    try {
      // Get project data for context
      const project = await storage.getProject(projectId);
      if (!project) {
        return await this.generateChatResponse(messages, model);
      }

      // Check if the user is asking about files or needs file access
      const lastMessage = messages[messages.length - 1];
      const needsFileAccess = this.detectFileAccessNeed(lastMessage.content);
      
      let contextualMessages = [...messages];
      
      if (needsFileAccess) {
        // Add project context to the conversation
        const projectContext = this.buildProjectContext(project);
        
        // Insert context before the last user message
        const systemMessage: ChatMessage = {
          id: `context-${Date.now()}`,
          role: "assistant",
          content: `I have access to your project files. Here's the current project structure and content:\n\n${projectContext}`,
          timestamp: new Date(),
          model
        };
        
        // Insert context message before the last user message
        contextualMessages.splice(-1, 0, systemMessage);
      }

      return await this.generateChatResponse(contextualMessages, model, aiMode);
    } catch (error) {
      console.error("AI Service Context Error:", error);
      // Fallback to regular chat response
      return await this.generateChatResponse(messages, model, aiMode);
    }
  }

  private detectFileAccessNeed(message: string): boolean {
    const fileKeywords = [
      'file', 'code', 'debug', 'error', 'function', 'class', 'variable',
      'analyze', 'review', 'check', 'look at', 'examine', 'read',
      'structure', 'project', 'import', 'export', 'module',
      'bug', 'issue', 'problem', 'fix', 'update', 'modify'
    ];
    
    const lowerMessage = message.toLowerCase();
    return fileKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  private buildProjectContext(project: any): string {
    const files = project.files || {};
    let context = `Project: ${project.name}\n`;
    context += `Description: ${project.description || 'No description'}\n\n`;
    context += `File Structure:\n`;
    
    // Build file tree
    const fileList = Object.keys(files);
    fileList.forEach(filePath => {
      context += `📁 ${filePath}\n`;
    });
    
    context += `\nFile Contents:\n\n`;
    
    // Add file contents (limit to reasonable size)
    fileList.forEach(filePath => {
      const fileData = files[filePath];
      const content = fileData.content || '';
      const language = fileData.language || 'text';
      
      context += `## ${filePath} (${language})\n`;
      context += '```' + language + '\n';
      
      // Limit content size to prevent token overflow
      if (content.length > 2000) {
        context += content.substring(0, 2000) + '\n... (truncated)';
      } else {
        context += content;
      }
      
      context += '\n```\n\n';
    });
    
    return context;
  }

  async analyzeSpecificFile(
    projectId: string, 
    filePath: string, 
    analysisType: 'debug' | 'review' | 'explain' | 'optimize' = 'review'
  ): Promise<string> {
    try {
      const project = await storage.getProject(projectId);
      if (!project || !project.files) {
        throw new Error("Project or files not found");
      }

      const files = project.files as any;
      const fileData = files[filePath];
      if (!fileData) {
        throw new Error(`File ${filePath} not found in project`);
      }

      const content = fileData.content || '';
      const language = fileData.language || 'text';

      let prompt = '';
      switch (analysisType) {
        case 'debug':
          prompt = `Debug this ${language} file and identify potential issues:\n\nFile: ${filePath}\n\n\`\`\`${language}\n${content}\n\`\`\`\n\nProvide:\n1. Potential bugs or errors\n2. Logic issues\n3. Performance problems\n4. Security concerns\n5. Recommended fixes`;
          break;
        case 'review':
          prompt = `Review this ${language} code for quality and best practices:\n\nFile: ${filePath}\n\n\`\`\`${language}\n${content}\n\`\`\`\n\nProvide feedback on:\n1. Code quality and style\n2. Best practices adherence\n3. Performance optimizations\n4. Maintainability\n5. Suggestions for improvement`;
          break;
        case 'explain':
          prompt = `Explain this ${language} code in detail:\n\nFile: ${filePath}\n\n\`\`\`${language}\n${content}\n\`\`\`\n\nProvide:\n1. Overall purpose and functionality\n2. Key components and their roles\n3. Data flow and logic\n4. Dependencies and integrations\n5. Usage examples`;
          break;
        case 'optimize':
          prompt = `Suggest optimizations for this ${language} code:\n\nFile: ${filePath}\n\n\`\`\`${language}\n${content}\n\`\`\`\n\nFocus on:\n1. Performance improvements\n2. Memory usage optimization\n3. Code simplification\n4. Better algorithms or patterns\n5. Refactoring opportunities`;
          break;
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 2000
      });

      return response.choices[0].message.content || "Could not analyze the file.";
    } catch (error) {
      console.error("File analysis error:", error);
      throw new Error(`Failed to analyze file: ${error.message}`);
    }
  }

  async searchProjectFiles(
    projectId: string, 
    query: string
  ): Promise<{ filePath: string; content: string; relevance: number }[]> {
    try {
      const project = await storage.getProject(projectId);
      if (!project || !project.files) {
        return [];
      }

      const files = project.files as any;
      const results: { filePath: string; content: string; relevance: number }[] = [];

      Object.entries(files).forEach(([filePath, fileData]: [string, any]) => {
        const content = fileData.content || '';
        const lowerQuery = query.toLowerCase();
        const lowerContent = content.toLowerCase();
        const lowerPath = filePath.toLowerCase();

        // Calculate relevance score
        let relevance = 0;
        
        // File name matches
        if (lowerPath.includes(lowerQuery)) relevance += 50;
        
        // Content matches
        const contentMatches = (lowerContent.match(new RegExp(lowerQuery, 'g')) || []).length;
        relevance += contentMatches * 10;
        
        // Exact phrase matches
        if (lowerContent.includes(lowerQuery)) relevance += 25;

        if (relevance > 0) {
          results.push({
            filePath,
            content: content.substring(0, 500), // Preview only
            relevance
          });
        }
      });

      // Sort by relevance
      return results.sort((a, b) => b.relevance - a.relevance);
    } catch (error) {
      console.error("File search error:", error);
      return [];
    }
  }
}

export const aiService = new AIService();
