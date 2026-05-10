const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');

const API_BASE = 'http://localhost:5001/api/v1';

// Function to add a message to the chat
function addMessage(text, isUser = false, code = null, title = 'AI Snippet') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;

    let content = `<div class="message-content">${text}</div>`;

    if (code) {
        const codeId = 'code-' + Date.now() + Math.floor(Math.random() * 1000);
        content += `
      <div class="message-content code-block-wrapper">
        <pre><code id="${codeId}" class="language-javascript">${code}</code></pre>
        <div class="code-actions">
           <button class="code-action-btn" onclick="copyCode('${codeId}', this)" title="Copy Code">
             <i data-lucide="copy" style="width:14px;height:14px"></i> <span>Copy</span>
           </button>
        </div>
      </div>
      `;
        
        // Track this as the latest code message if it's from the bot
        if (!isUser) {
            lastBotMessageWithCode = {
                element: messageDiv,
                code: code,
                title: title
            };
            // Show save button when code is generated
            const saveBtn = document.getElementById('saveBtn');
            if (saveBtn) {
                saveBtn.style.display = 'flex';
            }
        }
    }

    messageDiv.innerHTML = content;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Highlight code blocks
    if (code) {
        hljs.highlightAll();
    }

    // Refresh icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Function to handle sending a message
async function handleSend() {
    const prompt = chatInput.value.trim();
    if (!prompt) return;

    // Add user message
    addMessage(prompt, true);
    chatInput.value = '';

    // Show "typing" indicator
    const typingId = 'typing-' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.id = typingId;
    typingDiv.className = 'message bot';
    typingDiv.innerHTML = '<div class="message-content">Searching Stack Overflow... <span class="spinner-small"></span></div>';
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const response = await fetch(`${API_BASE}/agent/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });

        const data = await response.json();

        // Remove typing indicator
        document.getElementById(typingId).remove();

        if (data.success) {
            if (data.type === 'code') {
                addMessage(`I generated a code snippet:**${data.title}**`, false, data.content, data.title);
            } else {
                addMessage(data.content, false);
            }
        } else {
            addMessage('Sorry, I encountered an error while searching for code.', false);
        }
    } catch (error) {
        document.getElementById(typingId).remove();
        addMessage('Connection error. Please make sure the backend is running.', false);
        console.error('Error:', error);
    }
}

// Function to save snippet (Integration with the main app)
async function saveSnippet(title, content) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please login on the Home page first to save snippets.');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/snippets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title: title.split('\n')[0].substring(0, 50) || 'AI Generated Snippet',
                content: content,
                tags: 'ai-generated, gemini'
            })
        });

        const data = await res.json();
        if (data.success) {
            alert('Snippet saved successfully!');
        } else {
            alert('Error saving snippet: ' + data.message);
        }
    } catch (error) {
        alert('Failed to save snippet.');
    }
}

// Listeners
sendBtn.addEventListener('click', handleSend);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
});

// Setup Auth on Agent page too (minimal)
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    if (token && user) {
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('userProfile').style.display = 'flex';
        document.getElementById('userName').textContent = user.name;
    }
}

document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
});

document.getElementById('loginBtn')?.addEventListener('click', () => {
    window.location.href = 'index.html?login=true';
});

checkAuth();

// Toast notification function
function showToast(message, isError = false) {
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'error' : ''}`;
    toast.innerHTML = `<i data-lucide="${isError ? 'x-circle' : 'check-circle'}" style="width:20px;height:20px"></i> ${message}`;
    document.body.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Auto-save functionality for floating button
let lastBotMessageWithCode = null;

// Track the last bot message that contains code
function trackLastCodeMessage() {
    const messages = document.querySelectorAll('.message.bot');
    for (let i = messages.length - 1; i >= 0; i--) {
        const codeBlock = messages[i].querySelector('code');
        if (codeBlock) {
            lastBotMessageWithCode = {
                element: messages[i],
                code: codeBlock.textContent,
                title: extractTitleFromMessage(messages[i])
            };
            break;
        }
    }
}

// Extract title from message content
function extractTitleFromMessage(messageElement) {
    const content = messageElement.querySelector('.message-content').textContent;
    const lines = content.split('\n');
    
    // Look for patterns like "I generated a code snippet:**Title**"
    for (const line of lines) {
        const match = line.match(/\*\*([^*]+)\*\*/);
        if (match) {
            return match[1].trim();
        }
    }
    
    // Fallback: use first line or generate from content
    const firstLine = lines[0].trim();
    if (firstLine && firstLine.length > 0 && firstLine.length < 50) {
        return firstLine;
    }
    
    return 'AI Generated Snippet';
}

// Generate automatic tags based on code content
function generateAutoTags(code) {
    const tags = ['ai-generated'];
    
    // Detect language
    if (code.includes('function') || code.includes('const') || code.includes('let') || code.includes('var')) {
        tags.push('javascript');
    } else if (code.includes('def ') || code.includes('import ') || code.includes('print(')) {
        tags.push('python');
    } else if (code.includes('public class') || code.includes('import java')) {
        tags.push('java');
    } else if (code.includes('#include') || code.includes('std::')) {
        tags.push('cpp');
    } else if (code.includes('function ') || code.includes('=>') || code.includes('async')) {
        tags.push('typescript');
    }
    
    // Detect common patterns
    if (code.includes('debounce')) tags.push('debounce');
    if (code.includes('throttle')) tags.push('throttle');
    if (code.includes('sort')) tags.push('sorting');
    if (code.includes('fetch') || code.includes('axios')) tags.push('api');
    if (code.includes('useState') || code.includes('useEffect')) tags.push('react');
    if (code.includes('addEventListener')) tags.push('event');
    if (code.includes('Promise') || code.includes('async')) tags.push('async');
    
    return tags.join(', ');
}

// Auto-save last snippet
async function autoSaveLastSnippet() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please login on the Home page first to save snippets.');
        return;
    }

    trackLastCodeMessage();
    
    if (!lastBotMessageWithCode) {
        alert('No code snippet found to save. Please generate some code first.');
        return;
    }

    const btn = document.getElementById('saveBtn');
    const originalIcon = btn.innerHTML;
    
    // Show loading state
    btn.innerHTML = '<i data-lucide="loader-2" style="width:20px;height:20px; animation: spin 1s linear infinite;"></i>';
    lucide.createIcons();

    try {
        const autoTags = generateAutoTags(lastBotMessageWithCode.code);
        const title = lastBotMessageWithCode.title || 'AI Generated Snippet';
        
        console.log('Saving snippet:', { title, content: lastBotMessageWithCode.code, tags: autoTags });
        
        const res = await fetch(`${API_BASE}/snippets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title: title.substring(0, 50),
                content: lastBotMessageWithCode.code,
                tags: autoTags
            })
        });

        console.log('Response status:', res.status);
        
        const data = await res.json();
        console.log('Response data:', data);
        
        if (res.ok) {
            // Show success state
            btn.classList.add('saved');
            btn.innerHTML = '<i data-lucide="check" style="width:20px;height:20px"></i>';
            lucide.createIcons();
            
            // Show toast notification
            showToast('Snippet saved successfully!');
            
            setTimeout(() => {
                btn.classList.remove('saved');
                btn.innerHTML = originalIcon;
                lucide.createIcons();
            }, 2000);
        } else {
            console.error('Save failed:', { status: res.status, data });
            btn.innerHTML = originalIcon;
            lucide.createIcons();
            showToast('Failed to save snippet', true);
        }
    } catch (error) {
        console.error('Network error:', error);
        btn.innerHTML = originalIcon;
        lucide.createIcons();
    }
}

// Add event listener for save button
document.getElementById('saveBtn')?.addEventListener('click', autoSaveLastSnippet);

// Function to copy code to clipboard
function copyCode(elementId, btn) {
    const codeEl = document.getElementById(elementId);
    if (!codeEl) return;

    // Copy text
    navigator.clipboard.writeText(codeEl.innerText).then(() => {
        // Visual feedback
        const originalHtml = btn.innerHTML;
        btn.classList.add('success');
        btn.innerHTML = '<i data-lucide="check" style="width:14px;height:14px"></i> <span>Copied!</span>';
        lucide.createIcons();

        setTimeout(() => {
            btn.classList.remove('success');
            btn.innerHTML = originalHtml;
            lucide.createIcons();
        }, 2000);
    });
}
