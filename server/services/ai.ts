import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, AnalysisResult } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || ""
});

const gemini = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || ""
});

export class AIService {
  async generateChatResponse(
    messages: ChatMessage[], 
    model: string = "gpt-4o"
  ): Promise<string> {
    try {
      if (model.startsWith("gpt")) {
        return await this.generateOpenAIResponse(messages, model);
      } else if (model.startsWith("gemini")) {
        return await this.generateGeminiResponse(messages, model);
      } else {
        throw new Error(`Unsupported model: ${model}`);
      }
    } catch (error) {
      console.error("AI Service Error:", error);
      throw new Error("Failed to generate AI response");
    }
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
}

export const aiService = new AIService();
