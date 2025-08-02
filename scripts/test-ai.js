import 'dotenv/config';

async function testAI() {
    try {
        if (process.env.OPENAI_API_KEY) {
            const { default: OpenAI } = await import('openai');
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            
            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: 'Say "OpenAI connection successful"' }],
                max_tokens: 10
            });
            
            console.log('✅ OpenAI connection successful');
            console.log('Response:', response.choices[0].message.content);
        }
        
        if (process.env.GEMINI_API_KEY) {
            const { GoogleGenAI } = await import('@google/genai');
            const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            
            const response = await genAI.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: 'Say "Gemini connection successful"'
            });
            
            console.log('✅ Gemini connection successful');
            console.log('Response:', response.text);
        }
        
        if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
            console.log('⚠️ No AI API keys configured');
        }
        
    } catch (error) {
        console.error('❌ AI service test failed:', error.message);
    }
}

testAI();