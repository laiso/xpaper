export type ProviderType = 'openai' | 'anthropic' | 'gemini' | 'custom';

export async function processWithCloudLLM(
    provider: ProviderType,
    apiKey: string,
    customModelName: string, // User override from settings
    systemPrompt: string,
    userPrompt: string,
    customApiUrl?: string
): Promise<string> {
    if (!apiKey) {
        throw new Error(`API Key for ${provider} is missing. Please configure it in the Options page.`);
    }

    try {
        switch (provider) {
            case 'openai':
                return await callOpenAI(apiKey, customModelName || 'gpt-5-mini', systemPrompt, userPrompt);
            case 'anthropic':
                return await callAnthropic(apiKey, customModelName || 'claude-haiku-4-5', systemPrompt, userPrompt);
            case 'gemini':
                return await callGemini(apiKey, customModelName || 'gemini-3-flash-preview', systemPrompt, userPrompt);
            case 'custom':
                if (!customApiUrl) throw new Error("Custom API URL is missing");
                return await callCustomAPI(customApiUrl, apiKey, customModelName || 'openrouter/auto', systemPrompt, userPrompt);
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }
    } catch (err: any) {
        console.error(`[${provider}] API Error:`, err);
        throw new Error(`${provider} API Request failed: ${err.message || JSON.stringify(err)}`);
    }
}

async function callOpenAI(apiKey: string, modelName: string, systemPrompt: string, userPrompt: string): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: modelName,
            messages: [
                { role: 'developer', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]
        })
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        let errMsg = err.error?.message || `HTTP ${res.status}`;
        if (res.status === 401 || res.status === 403) {
            errMsg += " (Hint: Please verify your API Key is correct in the Options page)";
        }
        throw new Error(errMsg);
    }

    const data = await res.json();
    return data.choices[0].message.content;
}

async function callAnthropic(apiKey: string, modelName: string, systemPrompt: string, userPrompt: string): Promise<string> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: modelName,
            max_tokens: 4096,
            system: systemPrompt,
            messages: [
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
        })
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        let errMsg = err.error?.message || `HTTP ${res.status}`;
        if (res.status === 401 || res.status === 403) {
            errMsg += " (Hint: Please verify your API Key is correct in the Options page)";
        }
        throw new Error(errMsg);
    }

    const data = await res.json();
    return data.content[0].text;
}

async function callGemini(apiKey: string, modelName: string, systemPrompt: string, userPrompt: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
            system_instruction: {
                parts: [{ text: systemPrompt }]
            },
            contents: [
                {
                    role: 'user',
                    parts: [{ text: userPrompt }]
                }
            ],
            generationConfig: {
                temperature: 0.7,
            }
        })
    });

    if (!res.ok) {
        const errText = await res.text().catch(() => '');
        let errMsg = `HTTP ${res.status}`;
        try {
            const errJson = JSON.parse(errText);
            if (errJson.error?.message) {
                errMsg = errJson.error.message;
            }
        } catch (e) {
            errMsg = errText || errMsg;
        }

        if (res.status === 400 || res.status === 401 || res.status === 403) {
            errMsg += " (Hint: Please verify your API Key is correct in the Options page)";
        }
        throw new Error(errMsg);
    }

    const data = await res.json();
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.error("Gemini unexpected response format", data);
        throw new Error("Unexpected response format from Gemini API");
    }
    return data.candidates[0].content.parts[0].text;
}

async function callCustomAPI(apiUrl: string, apiKey: string, modelName: string, systemPrompt: string, userPrompt: string): Promise<string> {
    const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://x.com',
            'X-Title': 'Xpaper Extension'
        },
        body: JSON.stringify({
            model: modelName,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]
        })
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        let errMsg = err.error?.message || `HTTP ${res.status}`;
        if (res.status === 401 || res.status === 403) {
            errMsg += " (Hint: Please verify your API Key is correct in the Options page)";
        }
        throw new Error(errMsg);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "No content returned from custom API";
}
