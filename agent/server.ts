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
            globalContext,
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
            // Series Manager context
            if (pageContext.activeSeries) parts.push(`Active series: "${pageContext.activeSeries}"`);
            if (pageContext.seriesDescription) parts.push(`Series description: ${pageContext.seriesDescription}`);
            if (pageContext.seriesNiche) parts.push(`Series niche: ${pageContext.seriesNiche}`);
            if (pageContext.seriesScratchpad) parts.push(`Series scratchpad notes: ${pageContext.seriesScratchpad}`);
            if (pageContext.seriesResearch && pageContext.seriesResearch.length > 0) {
                const researchLines = pageContext.seriesResearch
                    .map((r: any) => `  - [${r.type}] "${r.title}": ${r.content}`)
                    .join('\n');
                parts.push(`Series research items (${pageContext.seriesResearch.length} total):\n${researchLines}`);
            }
            if (pageContext.seriesStyleGuide) {
                const sg = pageContext.seriesStyleGuide;
                const sgLines: string[] = [];
                if (sg.artStyle) sgLines.push(`  Art style: ${sg.artStyle}`);
                if (sg.colorPalette) sgLines.push(`  Color palette: ${sg.colorPalette}`);
                if (sg.environmentRules) sgLines.push(`  Environment: ${sg.environmentRules}`);
                if (sg.additionalRules) sgLines.push(`  Additional rules: ${sg.additionalRules}`);
                if (sg.characters && sg.characters.length > 0) {
                    sgLines.push(`  Characters (${sg.characters.length}):`);
                    sg.characters.forEach((c: any) => {
                        sgLines.push(`    - ${c.name}: ${c.visualDescription}`);
                    });
                }
                if (sgLines.length > 0) {
                    parts.push(`Series style guide:\n${sgLines.join('\n')}`);
                }
            }
            if (parts.length > 0) {
                contextPrefix += `[PAGE CONTEXT]\n${parts.join('\n')}\n[/PAGE CONTEXT]\n\n`;
            }
        }

        if (globalContext) {
            contextPrefix += `[GLOBAL CONTEXT (User's Complete Library)]\n`;
            contextPrefix += `Total Series: ${globalContext.totalSeries}\n`;
            contextPrefix += `Total Books: ${globalContext.totalBooks}\n\n`;

            if (globalContext.series && globalContext.series.length > 0) {
                contextPrefix += `Series List:\n`;
                globalContext.series.forEach((s: any) => {
                    contextPrefix += `- "${s.name}" (Niche: ${s.niche || 'None'}). Books: ${s.bookCount}, Research Items: ${s.researchCount}\n`;
                });
                contextPrefix += '\n';
            }

            if (globalContext.books && globalContext.books.length > 0) {
                contextPrefix += `Books List:\n`;
                globalContext.books.forEach((b: any) => {
                    contextPrefix += `- "${b.title}" (Genre: ${b.genre || 'None'}, Status: ${b.status || 'draft'})\n`;
                });
                contextPrefix += '\n';
            }
            contextPrefix += `[/GLOBAL CONTEXT]\n\n`;
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

        // Collect responses and actions with a timeout
        let reply = '';
        const actions: any[] = [];

        const collectEvents = async () => {
            for await (const event of result) {
                // Collect text from any model response events
                if (event.content?.parts) {
                    for (const part of event.content.parts) {
                        if (part.text) {
                            reply += part.text;
                        }
                    }
                }
                // Collect tool call results that produced actions
                if (event.content?.parts) {
                    for (const part of event.content.parts) {
                        if (part.functionResponse) {
                            const toolResult = part.functionResponse.response as any;
                            if (toolResult && toolResult.status === 'success' && toolResult.action) {
                                actions.push(toolResult);
                            }
                        }
                    }
                }
            }
        };

        const timeout = new Promise<void>((_, reject) =>
            setTimeout(() => reject(new Error('Agent response timed out after 25 seconds')), 25000)
        );

        await Promise.race([collectEvents(), timeout]);

        // If reply is empty (model only used tools), generate a short summary response
        if (!reply.trim() && actions.length > 0) {
            reply = `Done! I've executed: ${actions.map((a: any) => a.action).join(', ')}.`;
        } else if (!reply.trim()) {
            reply = 'I processed your request but had no text response. Please try again.';
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
