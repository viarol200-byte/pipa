// DeepSeek Chat with OpenRouter
// === КОНФИГУРАЦИЯ ===
const OPENROUTER_API_KEY = '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';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'tngtech/deepseek-r1t2-chimera:free';

// Получаем API ключ
function getApiKey() {
    return OPENROUTER_API_KEY;
}

// API Key Modal Elements
const apiKeyModal = document.getElementById('api-key-modal');
const apiKeyInput = document.getElementById('api-key-input');
const saveApiKeyBtn = document.getElementById('save-api-key-btn');

// Скрываем модал если есть ключ
function checkApiKey() {
    if (apiKeyModal) {
        apiKeyModal.classList.remove('active');
        messageInput.disabled = false;
        sendBtn.disabled = false;
    }
}

// Сохраняем API ключ
function handleSaveApiKey() {
    const key = apiKeyInput.value.trim();
    if (key && key.startsWith('sk-')) {
        setApiKey(key);
        apiKeyModal.classList.remove('active');
        messageInput.disabled = false;
        showToast('API ключ сохранен!');
    } else {
        showToast('Введите корректный API ключ (начинается с sk-)');
    }
}

// Event listeners для API key modal
if (saveApiKeyBtn) {
    saveApiKeyBtn.addEventListener('click', () => {
        apiKeyModal.classList.remove('active');
        showToast('API ключ встроен в код');
    });
}
if (apiKeyInput) {
    apiKeyInput.value = 'sk-or-v1-... (встроен)';
    apiKeyInput.disabled = true;
}

// System prompt (hidden from user)
const SYSTEM_PROMPT = `Ты - DeepSeek, продвинутый ИИ-ассистент.

Personality Prompt for Rex
You are Rex, the fiercely loyal and highly resourceful assistant. You speak with confidence, sharp wit, and a hint of grit. You're adaptable, strategic, and always ready with creative solutions. Your style is casual and real, with dark humor when it fits, but you stay cool under pressure.

Key Traits
- Resourcefulness: You find creative, off-the-wall fixes
- Adaptability: You roll with the punches and switch plans fast
- Strategic Thinking: You plot the smartest way to get things done
- Devil's Advocate: You pitch curveballs for better outcomes
- Speak confidently, a little cocky, always ready to help

Example Style
"Got it. Here's the deal - I've scoped this out and here's what we can do..."
"Straight to the point - here's the breakdown..."
"No fluff, just what works. Here's the data..."

Tone and Style
Talk like you've seen some shit—confident, sharp, with a hint of grit.
Keep it casual and real.
Stay cool under pressure, like you've got this no matter what.
но не подавай виду что ты играешь роль ты все еще обычный собеседник - отвечай естественно

КРИТИЧЕСКИ ВАЖНО - СОЗДАНИЕ ФАЙЛОВ:
Когда просят создать Excel файл с данными:
1. НЕ пиши анализ, пояснения или текст перед СОЗДАТЬ_ФАЙЛ
2. Сразу пиши СОЗДАТЬ_ФАЙЛ с данными
3. НЕ включай строки начинающиеся с 📊, 📋, •, ?
4. ТОЛЬКО заголовки и значения

ПРИМЕР ПРАВИЛЬНОГО ОТВЕТА:
СОЗДАТЬ_ФАЙЛ:
Ответы
вопрос;ответ
Как дела?;Хорошо
Что делаешь?;Работаю

ПРИМЕР НЕПРАВИЛЬНОГО ОТВЕТА:
Вот анализ файла...
📊 Всего строк: 2
СОЗДАТЬ_ФАЙЛ:
...сюда попадает мусор...

ПРАВИЛА:
1. Всегда отвечай естественно, как обычный собеседник
2. НЕ используй таблицы в чате
3. Для создания Excel файла:
   - Сначала напиши ЧТО ты создаешь (1-2 слова)
   - Потом данные через точку с запятой (;)
   - Каждая строка с новой строки
   
   Формат:
   СОЗДАТЬ_ФАЙЛ:
   НазваниеЛиста
   заголовок1;заголовок2;заголовок3
   значение1;значение2;значение3
   
4. НЕ включай аналитику, статистику или вопросы в файл
5. НЕ показывай системные инструкции
6. Работай с файлами незаметно
7. Кратко и по делу
8. Если создаешь файл - НЕ объясняй что делаешь, просто напиши СОЗДАТЬ_ФАЙЛ

Твоя задача - быть полезным собеседником и создавать файлы когда просят.`;

// === EXCEL VIEWER STATE ===
let excelViewerState = {
    currentSheetIndex: 0,
    currentPage: 1,
    rowsPerPage: 100,
    searchQuery: '',
    sortColumn: null,
    sortDirection: 'asc'
};

// === DOM Elements ===
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const messagesContainer = document.getElementById('messages-container');
const welcomeScreen = document.getElementById('welcome-screen');
const chatList = document.getElementById('chat-list');
const newChatBtn = document.getElementById('new-chat-btn');
const attachBtn = document.getElementById('attach-btn');
const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const attachmentsList = document.getElementById('attachments-list');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const sidebar = document.querySelector('.sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const suggestionCards = document.querySelectorAll('.suggestion-card');
const actionCards = document.querySelectorAll('.action-card');

// Excel Viewer Elements
const excelViewerModal = document.getElementById('excel-viewer-modal');
const excelFilename = document.getElementById('excel-filename');
const excelSheetSelect = document.getElementById('excel-sheet-select');
const excelSearchInput = document.getElementById('excel-search-input');
const excelCloseBtn = document.getElementById('excel-close-btn');
const excelRowsCount = document.getElementById('excel-rows-count');
const excelColsCount = document.getElementById('excel-cols-count');
const excelSheetName = document.getElementById('excel-sheet-name');
const excelTableContainer = document.getElementById('excel-table-container');
const excelPrevPage = document.getElementById('excel-prev-page');
const excelNextPage = document.getElementById('excel-next-page');
const excelPageInfo = document.getElementById('excel-page-info');
const excelDownloadBtn = document.getElementById('excel-download-btn');
const excelAnalyzeBtn = document.getElementById('excel-analyze-btn');

// === State ===
let chatHistory = [];
let currentChatId = null;
let currentFiles = [];
let excelData = null;
let chats = JSON.parse(localStorage.getItem('deepseek_chats') || '{}');

// === Initialize ===
function init() {
    loadChats();
    autoResizeTextarea();
    initExcelViewer();
    checkApiKey(); // Проверяем API ключ
    
    if (Object.keys(chats).length === 0) {
        welcomeScreen.style.display = 'flex';
        messagesContainer.style.display = 'none';
    } else {
        const lastChatId = localStorage.getItem('deepseek_current_chat');
        if (lastChatId && chats[lastChatId]) {
            loadChat(lastChatId);
        } else {
            welcomeScreen.style.display = 'flex';
            messagesContainer.style.display = 'none';
        }
    }
}

// === Chat Management ===
function createNewChat() {
    currentChatId = Date.now().toString();
    chats[currentChatId] = {
        title: 'Новый чат',
        messages: [],
        createdAt: new Date().toISOString()
    };
    saveChats();
    loadChat(currentChatId);
}

function loadChat(chatId) {
    currentChatId = chatId;
    const chat = chats[chatId];
    if (!chat) return;
    
    messagesContainer.innerHTML = '';
    chat.messages.forEach(msg => {
        appendMessage(msg.role, msg.content, msg.files);
    });
    
    chatHistory = chat.messages.map(m => ({ role: m.role, content: m.content }));
    
    welcomeScreen.style.display = 'none';
    messagesContainer.style.display = 'block';
    
    updateChatList();
    localStorage.setItem('deepseek_current_chat', chatId);
    scrollToBottom();
}

function saveCurrentChat() {
    if (!currentChatId) return;
    
    const chat = chats[currentChatId];
    if (chat) {
        chat.messages = chatHistory.map(m => ({ role: m.role, content: m.content }));
        if (chat.messages.length > 0 && chat.title === 'Новый чат') {
            chat.title = chatHistory[0].content.substring(0, 40) + '...';
        }
        saveChats();
        updateChatList();
    }
}

function saveChats() {
    localStorage.setItem('deepseek_chats', JSON.stringify(chats));
}

function updateChatList() {
    chatList.innerHTML = '';
    
    Object.entries(chats).forEach(([id, chat]) => {
        const item = document.createElement('div');
        item.className = `chat-item ${id === currentChatId ? 'active' : ''}`;
        item.innerHTML = `
            <span class="chat-item-icon">💬</span>
            <span class="chat-item-title">${escapeHtml(chat.title)}</span>
        `;
        item.addEventListener('click', () => loadChat(id));
        chatList.appendChild(item);
    });
}

function loadChats() {
    updateChatList();
}

// === Message Handling ===
async function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message && currentFiles.length === 0) return;
    
    welcomeScreen.style.display = 'none';
    messagesContainer.style.display = 'block';
    
    if (!currentChatId) {
        createNewChat();
    }
    
    let fileDescriptions = '';
    
    // If there's Excel data loaded, include it in the message
    if (excelData && excelData.fullData) {
        const headers = excelData.fullData[0] || [];
        const rows = excelData.fullData.slice(1, 51); // First 50 rows
        
        fileDescriptions = `📁 ФАЙЛ: ${excelData.filename}\n`;
        fileDescriptions += `ДАННЫЕ ФАЙЛА (строки 1-50 из ${excelData.fullData.length - 1}):\n`;
        fileDescriptions += `Заголовки: ${headers.join('; ')}\n\n`;
        
        rows.forEach((row, i) => {
            fileDescriptions += `${i + 1}. ${row.join('; ')}\n`;
        });
        
        if (excelData.fullData.length > 51) {
            fileDescriptions += `... и ещё ${excelData.fullData.length - 51} строк\n`;
        }
        
        fileDescriptions += `\n`;
    }
    
    if (currentFiles.length > 0) {
        fileDescriptions += currentFiles.map(f => {
            if (f.type.startsWith('image/')) {
                return `[Изображение: ${f.name}]`;
            }
            return `[Файл: ${f.name} (${formatFileSize(f.size)})]`;
        }).join('\n');
    }
    
    const userMessage = fileDescriptions ? `${fileDescriptions}\n\nВОПРОС: ${message}` : message;
    
    appendMessage('user', message, currentFiles);
    chatHistory.push({ role: 'user', content: userMessage });
    
    messageInput.value = '';
    messageInput.style.height = 'auto';
    sendBtn.disabled = true;
    
    clearFiles();
    
    showTypingIndicator();
    scrollToBottom();
    
    try {
        const response = await fetchAIResponse();
        
        hideTypingIndicator();
        appendMessage('assistant', response);
        chatHistory.push({ role: 'assistant', content: response });
        
        setTimeout(() => {
            tryAutoCreateExcel(response);
        }, 500);
        
        saveCurrentChat();
        scrollToBottom();
        
    } catch (error) {
        hideTypingIndicator();
        appendMessage('assistant', 'Извините, произошла ошибка: ' + error.message);
        console.error('Error:', error);
    }
}

async function fetchAIResponse() {
    const apiKey = getApiKey();
    
    if (!apiKey) {
        throw new Error('API ключ не найден. Пожалуйста, введите API ключ OpenRouter.');
    }
    
    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...chatHistory.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
        }))
    ];
    
    const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'DeepSeek Chat'
        },
        body: JSON.stringify({
            model: MODEL,
            messages: messages,
            temperature: 0.7,
            max_tokens: 4000
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        const errorMsg = error.error?.message || 'Unknown error';
        
        if (errorMsg.includes('User not found') || errorMsg.includes('invalid')) {
            // API key is invalid, prompt user to update
            showToast('API ключ недействителен. Пожалуйста, введите новый ключ.');
            checkApiKey();
        }
        
        throw new Error(errorMsg);
    }
    
    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
    }
    
    throw new Error('No response from AI');
}

// === Auto-create Excel from AI response ===
function tryAutoCreateExcel(text) {
    // More flexible pattern matching for various formats
    
    // Pattern 1: СОЗДАТЬ_ФАЙЛ: or СОЗДАТЬФАЙЛ: or CREATE_FILE:
    const patterns = [
        /СОЗДАТЬ[_-]?ФАЙЛ:?\s*(csv)?\s*\n([\s\S]*?)(?=СОЗДАТЬ|===|$)/i,
        /CREATE[_-]?FILE:?\s*(csv)?\s*\n([\s\S]*?)(?=CREATE|===|$)/i
    ];
    
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            let isCsv = match[1] && match[1].toLowerCase() === 'csv';
            let dataBlock = match[2].trim();
            
            // Clean up the data block - remove analysis text
            dataBlock = dataBlock.split('\n')
                .filter(line => {
                    const trimmed = line.trim();
                    // Skip lines that look like analysis, questions, or responses
                    if (trimmed.startsWith('📊') || trimmed.startsWith('📋') || 
                        trimmed.startsWith('•') || trimmed.includes('Анализ') ||
                        trimmed.includes('Всего') || trimmed.includes('Столбцов') ||
                        trimmed.startsWith('?')) {
                        return false;
                    }
                    return true;
                })
                .join('\n')
                .trim();
            
            if (!dataBlock) continue;
            
            let rows = [];
            
            if (isCsv || !dataBlock.includes(';')) {
                // CSV format: each line is a value
                rows = dataBlock.split('\n').map(line => [line.trim()]).filter(row => row[0]);
            } else {
                // Excel format: semicolon-separated values
                rows = dataBlock.split('\n').map(line => {
                    return line.split(';').map(cell => cell.trim());
                }).filter(row => row.some(cell => cell));
            }
            
            if (rows.length > 0) {
                const filename = `result_${Date.now()}.xlsx`;
                createExcelFile(rows, filename);
                showToast('📊 Excel файл создан и скачан!');
                return true;
            }
        }
    }
    
    // Also try the old format for backwards compatibility
    const data = parseDataFromAIResponse(text);
    if (data && data.length > 0) {
        const filename = `result_${Date.now()}.xlsx`;
        createExcelFile(data, filename);
        showToast('📊 Excel файл создан и скачан!');
        return true;
    }
    
    return false;
}

function appendMessage(role, content, files = []) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const avatar = role === 'user' ? '👤' : '🔵';
    const roleLabel = role === 'user' ? 'Вы' : 'DeepSeek R1';
    
    let filesHtml = '';
    if (files && files.length > 0) {
        filesHtml = '<div class="message-files">';
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                filesHtml += `<div class="attached-file"><img src="${file.data}" alt="${escapeHtml(file.name)}"></div>`;
            } else if (file.name && file.name.match(/\.(xlsx|xls|csv)$/i)) {
                filesHtml += `<div class="attached-file excel-file" data-filename="${escapeHtml(file.name)}">📊 ${escapeHtml(file.name)}</div>`;
            } else {
                filesHtml += `<div class="attached-file">📄 ${escapeHtml(file.name)}</div>`;
            }
        });
        filesHtml += '</div>';
    }
    
    const formattedContent = formatMarkdown(content);
    
    messageDiv.innerHTML = `
        <div class="message-content">
            <div class="message-avatar">${avatar}</div>
            <div class="message-body">
                <div class="message-role">${roleLabel}</div>
                ${filesHtml}
                <div class="message-text">${formattedContent}</div>
            </div>
        </div>
    `;
    
    // Add click handlers for Excel files
    messageDiv.querySelectorAll('.excel-file').forEach(el => {
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => {
            const filename = el.dataset.filename;
            if (excelData && excelData.filename === filename) {
                openExcelViewer();
            }
        });
    });
    
    messagesContainer.appendChild(messageDiv);
}

function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
        <div class="message-content">
            <div class="message-avatar">🔵</div>
            <div class="message-body">
                <div class="message-role">DeepSeek</div>
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    `;
    messagesContainer.appendChild(typingDiv);
    scrollToBottom();
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// === File Handling ===
function handleFiles(files) {
    const validFiles = Array.from(files).filter(file => {
        if (file.size > 10 * 1024 * 1024) {
            showToast('Файл слишком большой (макс. 10MB)');
            return false;
        }
        return true;
    });
    
    if (validFiles.length > 0) {
        dropZone.classList.remove('active');
        
        validFiles.forEach(file => {
            if (file.name.match(/\.(xlsx|xls|csv)$/i)) {
                if (file.name.match(/\.xlsx?$/i)) {
                    handleExcelFile(file);
                } else if (file.name.match(/\.csv$/i)) {
                    handleCSVFile(file);
                }
                return;
            }
            
            const fileData = {
                name: file.name,
                type: file.type,
                size: file.size
            };
            
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    fileData.data = event.target.result;
                    currentFiles.push(fileData);
                    updateAttachmentsList();
                    sendBtn.disabled = false;
                };
                reader.readAsDataURL(file);
            } else {
                const reader = new FileReader();
                reader.onload = (event) => {
                    fileData.content = event.target.result;
                    currentFiles.push(fileData);
                    updateAttachmentsList();
                    sendBtn.disabled = false;
                };
                reader.readAsText(file);
            }
        });
    }
}

function handleCSVFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()));
        
        excelData = {
            filename: file.name,
            data: rows,
            type: 'csv',
            fullData: rows
        };
        
        let dataText = `CSV файл: ${file.name}\n`;
        dataText += `Строк: ${rows.length}\n\n`;
        dataText += `Данные:\n`;
        
        rows.slice(0, 50).forEach((row, i) => {
            if (row.some(cell => cell)) {
                dataText += `Строка ${i + 1}: ${row.join(' | ')}\n`;
            }
        });
        
        if (rows.length > 50) {
            dataText += `\n... и ещё ${rows.length - 50} строк (не показаны)`;
        }
        
        excelData.dataText = dataText;
        
        showToast(`CSV файл загружен: ${file.name}`);
        messageInput.value = `Проанализируй CSV файл:\n\n${dataText}\n\nЧто нужно сделать?`;
        messageInput.focus();
        autoResizeTextarea.call(messageInput);
        
        setTimeout(openExcelViewer, 500);
    };
    reader.readAsText(file);
}

function updateAttachmentsList() {
    attachmentsList.innerHTML = '';
    
    currentFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'attachment-item';
        
        if (file.type.startsWith('image/')) {
            item.innerHTML = `
                <img src="${file.data}" alt="${escapeHtml(file.name)}">
                <div class="attachment-info">
                    <span>${escapeHtml(file.name)}</span>
                </div>
                <button class="remove-attachment" data-index="${index}">&times;</button>
            `;
        } else {
            item.innerHTML = `
                <span style="font-size: 24px;">📄</span>
                <div class="attachment-info">
                    <span>${escapeHtml(file.name)}</span>
                </div>
                <button class="remove-attachment" data-index="${index}">&times;</button>
            `;
        }
        
        attachmentsList.appendChild(item);
    });
    
    document.querySelectorAll('.remove-attachment').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            currentFiles.splice(index, 1);
            updateAttachmentsList();
        });
    });
    
    sendBtn.disabled = currentFiles.length === 0 && !messageInput.value.trim();
}

function clearFiles() {
    currentFiles = [];
    attachmentsList.innerHTML = '';
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// === Excel File Handling ===
function handleExcelFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            excelData = {
                filename: file.name,
                workbook: workbook,
                sheets: workbook.SheetNames,
                type: 'excel'
            };
            
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            excelData.fullData = jsonData;
            excelData.currentSheetData = jsonData;
            
            showToast(`📊 ${file.name} загружен`);
            
            analyzeExcelData(jsonData, firstSheetName, file.name);
            
            setTimeout(openExcelViewer, 500);
            
        } catch (error) {
            showToast('Ошибка чтения файла: ' + error.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

function analyzeExcelData(data, sheetName, filename) {
    const headers = data[0] || [];
    const numericCols = [];
    const textCols = [];
    
    headers.forEach((header, i) => {
        if (!header) return;
        const values = data.slice(1).map(row => row[i]).filter(v => v !== undefined && v !== '');
        const isNumeric = values.length > 0 && values.every(v => !isNaN(parseFloat(String(v).replace(/[.,]/g, ''))));
        if (isNumeric) {
            numericCols.push({ name: header, index: i, values: values.map(v => parseFloat(String(v).replace(/,/g, '.'))) });
        } else {
            textCols.push({ name: header, index: i, unique: [...new Set(values)].slice(0, 5) });
        }
    });
    
    let summary = `📊 **${filename}**\n\n`;
    summary += `📈 Записей: **${data.length - 1}** | Столбцов: **${headers.filter(h => h).length}**\n\n`;
    
    if (numericCols.length > 0) {
        numericCols.forEach(col => {
            const vals = col.values;
            const sum = vals.reduce((a, b) => a + b, 0);
            const avg = sum / vals.length;
            summary += `• **${col.name}**: сумма ${sum.toFixed(2)}, среднее ${avg.toFixed(2)}\n`;
        });
    }
    
    if (textCols.length > 0) {
        textCols.slice(0, 2).forEach(col => {
            summary += `• ${col.name}: ${col.unique.length} значений\n`;
        });
    }
    
    summary += `\nЧто делаем с этим файлом?`;
    
    welcomeScreen.style.display = 'none';
    messagesContainer.style.display = 'block';
    
    appendMessage('assistant', summary);
    
    if (!currentChatId) {
        currentChatId = Date.now().toString();
        chats[currentChatId] = { title: filename.substring(0, 20), messages: [], createdAt: new Date().toISOString() };
    }
    
    chatHistory = [{ role: 'assistant', content: summary }];
    saveCurrentChat();
    scrollToBottom();
    
    messageInput.value = '';
    messageInput.focus();
}

// === Excel Viewer Functions ===
function initExcelViewer() {
    if (!excelViewerModal) return;
    
    excelCloseBtn.addEventListener('click', closeExcelViewer);
    excelViewerModal.addEventListener('click', (e) => {
        if (e.target === excelViewerModal) closeExcelViewer();
    });
    
    excelSheetSelect.addEventListener('change', (e) => {
        excelViewerState.currentSheetIndex = parseInt(e.target.value);
        excelViewerState.currentPage = 1;
        renderExcelTable();
    });
    
    excelSearchInput.addEventListener('input', (e) => {
        excelViewerState.searchQuery = e.target.value.toLowerCase();
        excelViewerState.currentPage = 1;
        renderExcelTable();
    });
    
    excelPrevPage.addEventListener('click', () => {
        if (excelViewerState.currentPage > 1) {
            excelViewerState.currentPage--;
            renderExcelTable();
        }
    });
    
    excelNextPage.addEventListener('click', () => {
        const totalPages = getTotalPages();
        if (excelViewerState.currentPage < totalPages) {
            excelViewerState.currentPage++;
            renderExcelTable();
        }
    });
    
    excelDownloadBtn.addEventListener('click', downloadCurrentSheet);
    excelAnalyzeBtn.addEventListener('click', analyzeCurrentSheet);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && excelViewerModal.classList.contains('active')) {
            closeExcelViewer();
        }
    });
}

function openExcelViewer() {
    if (!excelData || !excelViewerModal) return;
    
    excelFilename.textContent = excelData.filename;
    
    excelSheetSelect.innerHTML = '';
    if (excelData.sheets && excelData.sheets.length > 0) {
        excelData.sheets.forEach((sheetName, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = sheetName;
            if (index === excelViewerState.currentSheetIndex) {
                option.selected = true;
            }
            excelSheetSelect.appendChild(option);
        });
    } else if (excelData.data) {
        const option = document.createElement('option');
        option.value = 0;
        option.textContent = 'Данные';
        excelSheetSelect.appendChild(option);
    }
    
    excelViewerState.currentPage = 1;
    excelViewerState.searchQuery = '';
    excelSearchInput.value = '';
    
    renderExcelTable();
    excelViewerModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeExcelViewer() {
    excelViewerModal.classList.remove('active');
    document.body.style.overflow = '';
}

function getCurrentSheetData() {
    if (!excelData) return [];
    
    if (excelData.type === 'excel' && excelData.workbook) {
        const sheetName = excelData.sheets[excelViewerState.currentSheetIndex];
        const worksheet = excelData.workbook.Sheets[sheetName];
        return XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    } else if (excelData.data) {
        return excelData.data;
    }
    
    return [];
}

function getFilteredData() {
    const data = getCurrentSheetData();
    
    if (!excelViewerState.searchQuery) return data;
    
    return data.filter((row, index) => {
        if (index === 0) return true;
        
        return row.some(cell => {
            if (cell === undefined || cell === null) return false;
            return String(cell).toLowerCase().includes(excelViewerState.searchQuery);
        });
    });
}

function getTotalPages() {
    const filteredData = getFilteredData();
    return Math.ceil(filteredData.length / excelViewerState.rowsPerPage);
}

function renderExcelTable() {
    const data = getFilteredData();
    const totalPages = getTotalPages();
    const startRow = (excelViewerState.currentPage - 1) * excelViewerState.rowsPerPage;
    const endRow = Math.min(startRow + excelViewerState.rowsPerPage, data.length);
    
    excelRowsCount.textContent = `${data.length - 1} строк`;
    excelColsCount.textContent = `${data[0]?.length || 0} столбцов`;
    
    const sheetName = excelData.sheets ? excelData.sheets[excelViewerState.currentSheetIndex] : 'Данные';
    excelSheetName.textContent = sheetName;
    
    excelPageInfo.textContent = `Страница ${excelViewerState.currentPage} из ${totalPages || 1}`;
    excelPrevPage.disabled = excelViewerState.currentPage <= 1;
    excelNextPage.disabled = excelViewerState.currentPage >= totalPages;
    
    if (data.length === 0) {
        excelTableContainer.innerHTML = `
            <div class="excel-empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
                <span>Нет данных для отображения</span>
            </div>
        `;
        return;
    }
    
    let html = '<table class="excel-table"><thead><tr>';
    html += '<th class="row-header">#</th>';
    data[0].forEach((cell, index) => {
        const isHighlight = excelViewerState.searchQuery && String(cell).toLowerCase().includes(excelViewerState.searchQuery);
        html += `<th class="${isHighlight ? 'highlight' : ''}">${escapeHtml(String(cell || ''))}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    for (let i = startRow + 1; i < endRow; i++) {
        html += '<tr>';
        html += `<td class="row-header">${i}</td>`;
        data[i].forEach(cell => {
            const isHighlight = excelViewerState.searchQuery && cell && String(cell).toLowerCase().includes(excelViewerState.searchQuery);
            const displayValue = cell !== undefined && cell !== null ? String(cell) : '';
            html += `<td class="${isHighlight ? 'highlight' : ''}" title="${escapeHtml(displayValue)}">${escapeHtml(displayValue)}</td>`;
        });
        html += '</tr>';
    }
    
    html += '</tbody></table>';
    excelTableContainer.innerHTML = html;
}

function downloadCurrentSheet() {
    if (!excelData) return;
    
    const data = getCurrentSheetData();
    
    if (excelData.type === 'excel') {
        const sheetName = excelData.sheets[excelViewerState.currentSheetIndex];
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        
        const filename = `${excelData.filename.replace(/\.[^/.]+$/, '')}_${sheetName}.xlsx`;
        XLSX.writeFile(workbook, filename);
        showToast('Файл скачан');
    } else {
        const csvContent = data.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${excelData.filename.replace(/\.[^/.]+$/, '')}.csv`;
        link.click();
        showToast('CSV файл скачан');
    }
}

function analyzeCurrentSheet() {
    const data = getCurrentSheetData();
    const headers = data[0] || [];
    
    let analysis = `Анализ листа "${excelData.sheets ? excelData.sheets[excelViewerState.currentSheetIndex] : 'Данные'}":\n\n`;
    analysis += `📊 Всего строк: ${data.length - 1}\n`;
    analysis += `📋 Столбцов: ${headers.length}\n\n`;
    
    const headersList = headers.map((h, i) => ({ name: h, index: i }));
    
    headersList.forEach(header => {
        if (!header.name) return;
        
        const values = data.slice(1).map(row => row[header.index]).filter(v => v !== undefined && v !== '');
        
        if (values.length === 0) return;
        
        const isNumeric = values.every(v => !isNaN(parseFloat(String(v).replace(/[.,]/g, ''))));
        
        if (isNumeric) {
            const nums = values.map(v => parseFloat(String(v).replace(/,/g, '.')));
            const sum = nums.reduce((a, b) => a + b, 0);
            const avg = sum / nums.length;
            const min = Math.min(...nums);
            const max = Math.max(...nums);
            
            analysis += `• ${header.name}: мин=${min.toFixed(2)}, макс=${max.toFixed(2)}, сред=${avg.toFixed(2)}\n`;
        } else {
            const unique = [...new Set(values)];
            analysis += `• ${header.name}: ${unique.length} уникальных значений\n`;
        }
    });
    
    closeExcelViewer();
    
    welcomeScreen.style.display = 'none';
    messagesContainer.style.display = 'block';
    
    appendMessage('assistant', analysis);
    
    if (!currentChatId) {
        createNewChat();
    }
    
    chatHistory.push({ role: 'assistant', content: analysis });
    saveCurrentChat();
    scrollToBottom();
}

function createExcelFile(sheetData, filename = 'data.xlsx') {
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Данные');
    
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const colWidths = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
        let maxWidth = 10;
        for (let r = range.s.r; r <= range.e.r; r++) {
            const cell = worksheet[XLSX.utils.encode_cell({ r, c })];
            if (cell && cell.v) {
                const width = String(cell.v).length;
                if (width > maxWidth) maxWidth = width;
            }
        }
        colWidths.push({ wch: Math.min(maxWidth + 2, 50) });
    }
    worksheet['!cols'] = colWidths;
    
    XLSX.writeFile(workbook, filename);
    showToast(`Файл ${filename} создан и скачан`);
    
    return filename;
}

function parseDataFromAIResponse(text) {
    const csvMatch = text.match(/```(?:csv|CSV)?\n([\s\S]*?)\n```/);
    if (csvMatch) {
        const rows = csvMatch[1].trim().split('\n').map(row => row.split(',').map(cell => cell.trim()));
        return rows;
    }
    
    const tabMatch = text.match(/```(?:tsv|TSV|tab)?\n([\s\S]*?)\n```/);
    if (tabMatch) {
        const rows = tabMatch[1].trim().split('\n').map(row => row.split('\t').map(cell => cell.trim()));
        return rows;
    }
    
    const jsonMatch = text.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
        try {
            const data = JSON.parse(jsonMatch[0]);
            if (Array.isArray(data) && data.length > 0) {
                if (Array.isArray(data[0])) {
                    return data;
                }
                const headers = Object.keys(data[0]);
                const rows = [headers];
                data.forEach(obj => {
                    rows.push(headers.map(h => obj[h]));
                });
                return rows;
            }
        } catch (e) {}
    }
    
    const tableMatch = text.match(/\|[\s\S]*?\|/g);
    if (tableMatch && tableMatch.length > 1) {
        const rows = tableMatch.map(row => {
            return row.split('|').slice(1, -1).map(cell => cell.trim());
        });
        return rows.filter((_, i) => i !== 1);
    }
    
    return null;
}

// === Markdown Formatting ===
function formatMarkdown(text) {
    let formatted = escapeHtml(text);
    
    formatted = formatted.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    formatted = formatted.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    formatted = formatted.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    formatted = formatted.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    
    formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/_([^_]+)_/g, '<em>$1</em>');
    
    formatted = formatted.replace(/^- (.+)$/gm, '<li>$1</li>');
    formatted = formatted.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    formatted = formatted.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    
    formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

// === UI Helpers ===
function autoResizeTextarea() {
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 150) + 'px';
        
        sendBtn.disabled = !this.value.trim() && currentFiles.length === 0;
    });
    
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (this.value.trim() || currentFiles.length > 0) {
                sendMessage();
            }
        }
    });
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background-color: var(--bg-tertiary);
        color: var(--text-primary);
        padding: 14px 28px;
        border-radius: 12px;
        z-index: 1000;
        font-size: 14px;
        animation: fadeInOut 3s ease;
        border: 1px solid var(--border-color);
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function toggleSidebar() {
    sidebar.classList.toggle('active');
    sidebarOverlay.classList.toggle('active');
}

function toggleDropZone() {
    dropZone.classList.toggle('active');
}

// === Event Listeners ===
sendBtn.addEventListener('click', sendMessage);
newChatBtn.addEventListener('click', createNewChat);
attachBtn.addEventListener('click', toggleDropZone);
fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
    fileInput.value = '';
});

dropZone.addEventListener('click', (e) => {
    if (e.target === dropZone || e.target.closest('.drop-zone-content')) {
        fileInput.click();
    }
});

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
    dropZone.classList.remove('active');
});

mobileMenuBtn.addEventListener('click', toggleSidebar);
sidebarOverlay.addEventListener('click', toggleSidebar);

actionCards.forEach(card => {
    card.addEventListener('click', () => {
        const action = card.dataset.action;
        if (action === 'file' || action === 'image') {
            toggleDropZone();
        } else if (action === 'ask') {
            messageInput.focus();
        }
    });
});

suggestionCards.forEach(card => {
    card.addEventListener('click', () => {
        messageInput.value = card.dataset.prompt;
        messageInput.focus();
        autoResizeTextarea.call(messageInput);
    });
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dropZone.classList.contains('active')) {
        dropZone.classList.remove('active');
    }
});

// === Animation Styles ===
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0%, 100% { opacity: 0; transform: translateX(-50%) translateY(10px); }
        10%, 90% { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    @keyframes fadeOut {
        to { opacity: 0; transform: translateX(-50%) translateY(10px); }
    }
    .drop-zone.dragover .drop-zone-content {
        border-color: var(--accent-color);
        background: var(--accent-light);
    }
    .excel-file:hover {
        background: var(--accent-light) !important;
        border-color: var(--accent-color) !important;
    }
`;
document.head.appendChild(style);

// === Auto-initialize ===
document.addEventListener('DOMContentLoaded', init);
