
var runningTokenCount = 0;

function sendMessage() {
    var apiKey = document.getElementById('api-key').value;
    var model = document.getElementById('model-select').value;
    var prompt = document.getElementById('message-input').value;
    var chatContainer = document.getElementById('chat-container');
    
    var userMessage = document.createElement('div');
    userMessage.classList.add('user-message');
    userMessage.textContent = prompt;
    chatContainer.appendChild(userMessage);
    
    document.getElementById('message-input').value = '';
    
    getGPTResponse(prompt, model, apiKey);
    
    return false; 
}

function getGPTResponse(prompt, model, apiKey) {
    var loadingMessage = formatChatMessage(".");
    var dots = "";
    var chatHistoryContainer = document.getElementById('chat-container');
    chatHistoryContainer.appendChild(loadingMessage);
    chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;
    var dotInterval = setInterval(function () {
        if (dots.length >= 5) {
            dots = ".";
        } else {
            dots += ".";
        }
        loadingMessage.textContent = "<writing>" + dots + "<writing>";
    }, 500);

    fetch("/gpt-response", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            prompt: prompt,
            model: model,
            apiKey: apiKey
        })
    })
    .then(function(response) {
        clearInterval(dotInterval);
        if (!response.ok) {
            throw new Error("HTTP error " + response.status);
        }

        return response.text().then(function(text) {
            console.log('Raw response:', text);
            return JSON.parse(text);
        });
    })
    .then(function(data) {
        var result = data.result.replace(/^[\w\s]+:\s*/, "");
        runningTokenCount += data.total_tokens;
        document.getElementById("token-count").textContent = runningTokenCount;

        chatHistoryContainer.replaceChild(formatChatMessage(result), loadingMessage);
        chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;
        if (chatHistoryContainer.scrollHeight > chatHistoryContainer.offsetHeight) {
            chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight - chatHistoryContainer.offsetHeight;
        }
    })
    .catch(function(error) {
        clearInterval(dotInterval); 
        alert("An error occurred while processing your request : " + error.message);
    });
}

function formatChatMessage(message) {
    var messageContainer = document.createElement("div");
    messageContainer.classList.add("chat-message");

    var formattedMessage = message
        .replace(/\n/g, "<br>")
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/(?:(?:https?|ftp):\/\/[^\s]+)|(?:www\.[^\s]+)/g, function (url) {
            return '<a href="' + url + '" target="_blank">' + url + "</a>";
        });

    messageContainer.innerHTML = formattedMessage;

    return messageContainer;
}