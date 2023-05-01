const express = require('express');
const router = express.Router();
const https = require('https');

const TOKEN_LIMIT = 2096;
var messages = [];

router.get('/', (req, res, next) => {
	return res.render('index');
});

router.post('/gpt-response', async (req, res) => {
    try {
        var prompt = req.body.prompt;
        var apiKey = req.body.apiKey;
        var model = req.body.model;

        messages.push({
            role: 'user',
            content: prompt
        });

        messages = trimMessagesToTokenLimit(messages, TOKEN_LIMIT);

        var data = JSON.stringify({
            model: model,
            messages: messages,
        });

        var options = {
            hostname: 'api.openai.com',
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            }
        };

        const hreq = https.request(options, (hres) => {
            let data = '';

            hres.on('data', (chunk) => {
                data += chunk;
            });

            hres.on('end', () => {
                var json = JSON.parse(data);

                if (json.hasOwnProperty('error')) {
                    console.error(json.error.message);
                    res.status(500).send(json.error.message);
                } else {
                    var result = json.choices[0].message.content;
                    messages.push({role: "assistant", content: result});
                    res.json({result: result, total_tokens: json.usage.total_tokens});
                }
            });
        });

        hreq.on('error', (err) => {
            console.error(err);
            res.status(500).send(err);
        });
        hreq.write(data);
        hreq.end();
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while processing your request.');
    }

});

function calculateTokens(text) {
    return Array.from(text).length;
}

function trimMessagesToTokenLimit(messages, limit) {
    var tokens = 0;
    var trimmedMessages = [];

    for (var i = messages.length - 1; i >= 0; i--) {
        tokens += calculateTokens(messages[i].content);
        if (tokens > limit) break;
        trimmedMessages.unshift(messages[i]);
    }

    return trimmedMessages;
}

module.exports = router;