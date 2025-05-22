const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Load environment variables

const supabase = require('./db');

const app = express();
const PORT = process.env.PORT || 8080;

// Configure CORS
const corsOptions = {
    origin: 'https://leucine-todo.vercel.app', // Your frontend's domain
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed methods
    credentials: true, // Allow cookies to be sent
    optionsSuccessStatus: 204 // Some legacy browsers (IE11, various SmartTVs) choke on 200
};
app.use(cors(corsOptions)); // Apply CORS with options

app.use(express.json());

// app.use(cors());
// app.use(express.json());

app.get('/', (req, res) => {
    res.send('Todo Summary Assistant Backend is running!');
});

app.get('/api/todos', async (req, res) => {
    console.log('GET /api/todos requested');
    try {
        const { data, error } = await supabase
            .from('todos')
            .select('id, text, description, due_date, priority, status, completed, created_at')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching todos:', error);
            return res.status(500).json({ message: 'Error fetching todos', error: error.message });
        }

        const formattedData = data.map(todo => ({
            id: todo.id,
            title: todo.text,
            description: todo.description,
            dueDate: todo.due_date,
            priority: todo.priority,
            status: todo.status,
            completed: todo.completed,
            createdAt: todo.created_at
        }));

        res.status(200).json(formattedData);
    } catch (err) {
        console.error('Unhandled error fetching todos:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/todos', async (req, res) => {
    const { title, description, dueDate, priority = "Low", status = "To Do", completed = false } = req.body;
    console.log('POST /api/todos requested with body:', req.body);

    if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ message: 'Todo title is required and must be a non-empty string.' });
    }

    try {
        const newTodoData = {
            text: title,
            description: description,
            due_date: dueDate,
            priority: priority,
            status: status,
            completed: completed
        };

        const { data, error } = await supabase
            .from('todos')
            .insert([newTodoData])
            .select();

        if (error) {
            console.error('Error adding todo:', error);
            return res.status(500).json({ message: 'Error adding todo', error: error.message });
        }

        const insertedTodo = data[0];
        const formattedTodo = {
            id: insertedTodo.id,
            title: insertedTodo.text,
            description: insertedTodo.description,
            dueDate: insertedTodo.due_date,
            priority: insertedTodo.priority,
            status: insertedTodo.status,
            completed: insertedTodo.completed,
            createdAt: insertedTodo.created_at
        };

        res.status(201).json(formattedTodo);
    } catch (err) {
        console.error('Unhandled error adding todo:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.put('/api/todos/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, dueDate, priority, status, completed } = req.body;
    console.log(`PUT /api/todos/${id} requested with body:`, req.body);

    if (!id) {
        return res.status(400).json({ message: 'Todo ID is required.' });
    }

    const updateFields = {};
    if (typeof title === 'string' && title.trim() !== '') {
        updateFields.text = title;
    }
    if (description !== undefined) {
        updateFields.description = description;
    }
    if (dueDate !== undefined) {
        updateFields.due_date = dueDate;
    }
    if (priority !== undefined) {
        updateFields.priority = priority;
    }
    if (status !== undefined) {
        updateFields.status = status;
    }
    if (typeof completed === 'boolean') {
        updateFields.completed = completed;
    }

    if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ message: 'No valid fields provided for update.' });
    }

    try {
        const { data, error } = await supabase
            .from('todos')
            .update(updateFields)
            .eq('id', id)
            .select();

        if (error) {
            console.error(`Error updating todo with ID ${id}:`, error);
            return res.status(500).json({ message: 'Error updating todo', error: error.message });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({ message: 'Todo not found or no changes made.' });
        }

        const updatedTodo = data[0];
        const formattedTodo = {
            id: updatedTodo.id,
            title: updatedTodo.text,
            description: updatedTodo.description,
            dueDate: updatedTodo.due_date,
            priority: updatedTodo.priority,
            status: updatedTodo.status,
            completed: updatedTodo.completed,
            createdAt: updatedTodo.created_at
        };
        res.status(200).json(formattedTodo);
    } catch (err) {
        console.error('Unhandled error updating todo:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.delete('/api/todos/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`DELETE /api/todos/${id} requested`);

    if (!id) {
        return res.status(400).json({ message: 'Todo ID is required.' });
    }

    try {
        const { data, error } = await supabase
            .from('todos')
            .delete()
            .eq('id', id)
            .select();

        if (error) {
            console.error(`Error deleting todo with ID ${id}:`, error);
            return res.status(500).json({ message: 'Error deleting todo', error: error.message });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({ message: 'Todo not found.' });
        }

        res.status(204).send();
    } catch (err) {
        console.error('Unhandled error deleting todo:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// --- NEW ENDPOINT: POST /api/summarize ---
app.post('/api/summarize', async (req, res) => {
    console.log('POST /api/summarize requested');
    const LLM_API_KEY = process.env.LLM_API_KEY || ''; // Replace with your LLM API Key
    const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || ''; // Replace with your Slack Webhook URL

    if (!LLM_API_KEY) {
        return res.status(500).json({ message: 'LLM_API_KEY is not configured in environment variables.' });
    }
    if (!SLACK_WEBHOOK_URL) {
        return res.status(500).json({ message: 'SLACK_WEBHOOK_URL is not configured in environment variables.' });
    }

    try {
        // 1. Fetch pending todos from Supabase
        const { data: pendingTodos, error: fetchError } = await supabase
            .from('todos')
            // CORRECTED: Changed 'title' to 'text' as per your Supabase schema
            // Also included 'completed' in the select list for clarity, though not strictly needed for LLM prompt
            .select('text, description, due_date, priority, status, completed')
            .eq('completed', false) // Only fetch pending todos
            .order('due_date', { ascending: true, nullsFirst: false }); // Order by due date

        if (fetchError) {
            console.error('Error fetching pending todos:', fetchError);
            return res.status(500).json({ message: 'Error fetching pending todos', error: fetchError.message });
        }

        if (pendingTodos.length === 0) {
            return res.status(200).json({ message: 'No pending todos to summarize.' });
        }

        // Prepare prompt for LLM
        let prompt = "Summarize the following list of pending to-do items. Focus on key tasks, deadlines, and priorities. Group similar tasks if possible. If a due date is present, mention it. If no due date, state 'no specific deadline'.\n\nTo-Do List:\n";
        pendingTodos.forEach((todo, index) => {
            const dueDateText = todo.due_date ? ` (Due: ${todo.due_date})` : ' (No specific deadline)';
            // CORRECTED: Use todo.text here as it's what was fetched from the DB
            prompt += `${index + 1}. Title: ${todo.text || 'N/A'}\n   Description: ${todo.description || 'N/A'}\n   Priority: ${todo.priority || 'N/A'}\n   Status: ${todo.status || 'N/A'}${dueDateText}\n`;
        });

        // 2. Call LLM API for summarization
        let summary = "Failed to generate summary.";
        try {
            // --- LLM Integration Placeholder (Replace with your actual LLM API call) ---
            // Example using a generic fetch for Gemini 2.0 Flash (as discussed in instructions)
            const llmPayload = {
                contents: [{ role: "user", parts: [{ text: prompt }] }],
            };
            const llmApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${LLM_API_KEY}`;

            const llmResponse = await fetch(llmApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(llmPayload)
            });

            if (!llmResponse.ok) {
                const llmErrorData = await llmResponse.json();
                console.error('LLM API error:', llmErrorData);
                throw new Error(`LLM API failed with status ${llmResponse.status}: ${llmErrorData.error?.message || 'Unknown error'}`);
            }

            const llmResult = await llmResponse.json();
            if (llmResult.candidates && llmResult.candidates.length > 0 &&
                llmResult.candidates[0].content && llmResult.candidates[0].content.parts &&
                llmResult.candidates[0].content.parts.length > 0) {
                summary = llmResult.candidates[0].content.parts[0].text;
            } else {
                throw new Error('LLM response format unexpected or no content found.');
            }
            // --- End LLM Integration Placeholder ---

        } catch (llmErr) {
            console.error('Error generating summary with LLM:', llmErr);
            return res.status(500).json({ message: 'Failed to generate summary with LLM', error: llmErr.message });
        }

        // 3. Send summary to Slack
        try {
            const slackPayload = {
                text: `*To-Do List Summary:*\n\n${summary}`
            };

            const slackResponse = await fetch(SLACK_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(slackPayload)
            });

            if (!slackResponse.ok) {
                const slackErrorText = await slackResponse.text(); // Slack often sends plain text errors
                console.error('Slack API error:', slackErrorText);
                throw new Error(`Slack notification failed with status ${slackResponse.status}: ${slackErrorText}`);
            }

            res.status(200).json({ message: 'Summary generated and sent to Slack successfully!', summary: summary });

        } catch (slackErr) {
            console.error('Error sending summary to Slack:', slackErr);
            return res.status(500).json({ message: 'Failed to send summary to Slack', error: slackErr.message });
        }

    } catch (err) {
        console.error('Unhandled error in /api/summarize:', err);
        res.status(500).json({ message: 'Internal server error during summarization process' });
    }
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Environment variables loaded successfully.');
});