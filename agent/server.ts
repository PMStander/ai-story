import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createAgent } from './agent.js';
import { InMemorySessionService, Runner } from '@google/adk';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = parseInt(process.env.PORT || '8080', 10);

// Health check
app.get('/', (_req, res) => {
    res.json({ status: 'ok', service: 'ai-story-agent' });
});

// Chat endpoint
app.post('/chat', async (req, res) => {
    try {
        const {
            message,
            pageContext,
            chatHistory,
            apiKey,
        } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        if (!apiKey) {
            return res.status(400).json({ error: 'API key is required' });
        }

        // Build system context from the page the user is on
        let contextPrefix = '';
        if (pageContext) {
            const parts: string[] = [];
            if (pageContext.currentPage) parts.push(`Current page: ${pageContext.currentPage}`);
            if (pageContext.projectTitle) parts.push(`Project: "${pageContext.projectTitle}"`);
            if (pageContext.chapterTitle) parts.push(`Chapter: "${pageContext.chapterTitle}"`);
            if (pageContext.pageContent) parts.push(`Current page content:\n"""${pageContext.pageContent}"""`);
            if (pageContext.sceneDescription) parts.push(`Scene description: ${pageContext.sceneDescription}`);
            if (pageContext.genre) parts.push(`Genre: ${pageContext.genre}`);
            if (pageContext.targetAge) parts.push(`Target age: ${pageContext.targetAge}`);
            if (parts.length > 0) {
                contextPrefix = `[CONTEXT]\n${parts.join('\n')}\n[/CONTEXT]\n\n`;
            }
        }

        // Create agent with user's API key
        const agent = createAgent(apiKey);

        // Create a session service and runner
        const sessionService = new InMemorySessionService();

        // Create a session with the API key in state
        const session = await sessionService.createSession({
            appName: 'ai-story-agent',
            userId: 'user',
            state: { apiKey },
        });

        // Set the GOOGLE_GENAI_API_KEY for the agent's model
        process.env.GOOGLE_GENAI_API_KEY = apiKey;

        const runner = new Runner({
            agent,
            appName: 'ai-story-agent',
            sessionService,
        });

        // Build the full message with context
        const fullMessage = contextPrefix + message;

        // Run the agent
        const result = runner.runAsync({
            userId: 'user',
            sessionId: session.id,
            newMessage: {
                role: 'user',
                parts: [{ text: fullMessage }],
            },
        });

        // Collect responses and actions
        let reply = '';
        const actions: any[] = [];

        for await (const event of result) {
            if (event.content?.parts) {
                for (const part of event.content.parts) {
                    if (part.text) {
                        reply += part.text;
                    }
                    if (part.functionResponse) {
                        const result = part.functionResponse.response as any;
                        if (result && result.status === 'success' && result.action) {
                            actions.push(result);
                        }
                    }
                }
            }
        }

        return res.json({
            reply: reply.trim(),
            actions,
        });
    } catch (err: any) {
        console.error('Chat error:', err);
        return res.status(500).json({
            error: 'Agent processing failed',
            details: err.message,
        });
    }
});

app.listen(PORT, () => {
    console.log(`🤖 AI Story Agent running on port ${PORT}`);
});
