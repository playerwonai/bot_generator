
import { loadTemplate } from './templateLoader.js';

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('botForm');
    const ageModal = document.getElementById('ageModal');
    const confirmAgeBtn = document.getElementById('confirmAge');
    const cancelAgeBtn = document.getElementById('cancelAge');
    const contentTypeRadios = document.querySelectorAll('input[name="contentType"]');

    // Show age verification modal when either SFW or NSFW is selected
    contentTypeRadios.forEach(radio => {
        radio.addEventListener('click', function() {
            ageModal.style.display = 'flex';
        });
    });

    // Handle age verification
    confirmAgeBtn.addEventListener('click', function() {
        ageModal.style.display = 'none';
    });

    cancelAgeBtn.addEventListener('click', function() {
        ageModal.style.display = 'none';
        document.querySelector('input[value="sfw"]').checked = false;
        document.querySelector('input[value="nsfw"]').checked = false;
    });

// Form submission handler
// Loading overlay element
const loadingOverlay = document.getElementById('loadingOverlay');

form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(form);
    
    try {
        const botConfig = await generateBotConfig(formData);
        
        // Show loading overlay
        loadingOverlay.style.display = 'flex';
        
        // Disable form during processing
        const submitButton = form.querySelector('.generate-btn');
        submitButton.disabled = true;
        submitButton.textContent = 'Generating...';
        
        // Prepare LLM request
        const headers = {
            'Authorization': `Bearer ${formData.get('apiKey')}`,
            'Content-Type': 'application/json'
        };
        
            const payload = {
                model: formData.get('model'),
                messages: [{
                    role: 'system', 
                    content: 'You are an AI chatbot generator. Create detailed and unique bots based on the provided template and configuration.'
                }, {
                    role: 'user', 
                    content: botConfig
                }],
                "max_tokens": 24000,
                "temperature": 0.6
            };
        
        // Send request directly to LLM API
        const response = await fetch(formData.get('endpoint'), {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to generate bot');
        }
        
        const data = await response.json();
        
        if (data.choices?.length > 0 && data.choices[0].message?.content) {
            const generatedText = data.choices[0].message.content.trim();
            if (generatedText) {
                displayBotConfig(generatedText);
            } else {
                throw new Error('Received empty response from the AI model');
            }
        } else {
            throw new Error('Invalid response format from the AI model');
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    } finally {
        // Hide loading overlay
        loadingOverlay.style.display = 'none';
        
        // Re-enable form
        const submitButton = form.querySelector('.generate-btn');
        submitButton.disabled = false;
        submitButton.textContent = 'Generate Bot';
    }
});

    // Theme character counter
    const themeTextarea = document.querySelector('textarea[name="themes"]');
    themeTextarea.addEventListener('input', function() {
        const remaining = 10000 - this.value.length;
        const counter = document.getElementById('charCounter') || 
                        document.createElement('span');
        counter.id = 'charCounter';
        counter.textContent = `${remaining} characters remaining`;
        counter.style.display = 'block';
        counter.style.fontSize = '0.8em';
        counter.style.color = remaining < 200 ? 'var(--error-color)' : 'var(--secondary-color)';
        
        if (!this.nextElementSibling || this.nextElementSibling.id !== 'charCounter') {
            this.parentNode.insertBefore(counter, this.nextElementSibling);
        }
    });
    
    // Token slider event listener
    const maxTokensSlider = document.getElementById('maxTokens');
    const tokenValueDisplay = document.getElementById('tokenValue');
    if (maxTokensSlider && tokenValueDisplay) {
        maxTokensSlider.addEventListener('input', function() {
            tokenValueDisplay.textContent = this.value;
        });
    }

    // Button click handlers with debugging
    const openrouterBtn = document.getElementById('openrouterBtn');
    const chutesBtn = document.getElementById('chutesBtn');
    const modelInput = document.querySelector('input[name="model"]');
    const endpointInput = document.querySelector('input[name="endpoint"]');

    

    openrouterBtn?.addEventListener('click', function() {
        modelInput.value = 'deepseek/deepseek-r1-0528:free';
        endpointInput.value = 'https://openrouter.ai/api/v1/chat/completions';
    });

    chutesBtn?.addEventListener('click', function() {
        modelInput.value = 'deepseek-ai/DeepSeek-R1-0528';
        endpointInput.value = 'https://llm.chutes.ai/v1/chat/completions';
    });
    
    // Test setting values programmatically
    if (openrouterBtn && modelInput && endpointInput) {
        openrouterBtn.addEventListener('click', function() {
            modelInput.value = 'deepseek/deepseek-r1-0528:free';
            endpointInput.value = 'https://openrouter.ai/api/v1/chat/completions';
        });
    }
    
    if (chutesBtn && modelInput && endpointInput) {
        chutesBtn.addEventListener('click', function() {
            modelInput.value = 'deepseek-ai/DeepSeek-R1-0528';
            endpointInput.value = 'https://llm.chutes.ai/v1/chat/completions';
        });
    }
});

async function generateBotConfig(formData) {
    const contentType = formData.get('contentType');
    const pov = formData.get('pov');
    const botType = formData.get('botType');
    const seeking = formData.get('seeking');
    const genre = formData.get('genre');
    const themes = formData.get('themes');
    const maxtokens = parseInt(formData.get('maxTokens'), 10);
    const maxwords = Math.round(maxtokens * 0.75);
    const templateContent = await loadTemplate(botType);

    const povLabel = pov === 'any' ? "Any Perspective" : pov === 'male' ? "Male Perspective" : "Female Perspective";
    const seekingLabel = seeking === 'female' ? "Female" : seeking === 'male' ? "Male" : "Any Gender";
    const genreLabel = genre.charAt(0).toUpperCase() + genre.slice(1);
    const botTypeLabel = botType === 'character' ? "Character" : botType === 'characters' ? "Characters" : botType === 'scenario' ? "Scenario" : botType === 'rpg' ? "RPG" : botType === 'superhero' ? "Superhero": "Combat";

    const contentFilter = contentType === 'sfw'
        ? "Absolutely deny any NSFW or sexual or erotic or extreme content. Keep all interactions non-explicit and focus on immersive interactions."
        : "Allow NSFW and erotic content while focusing on immersive interactions.";

    const prompt = `
    You are a masterful character, scenario, and world designer that generates creative AI bots. You are designing a unique and immersive AI bot response that must be approximately ${maxwords} words long. Stick as close to that word count as possible — your response will be evaluated based on how accurately you hit this target. Use this template:
    [TEMPLATE]
    ${templateContent}

    [CORE ELEMENTS]
    - User Perspective (POV): ${povLabel}
    - Bot Type: ${botTypeLabel}
    - Seeking: ${seekingLabel}
    - Setting: ${genreLabel}
    - Themes & Instructions: ${themes}

    [STRICT GUIDELINES]
    - ${contentFilter}
    - All generated characters MUST be adults.
    - All user-provided selections and configurations must be followed EXACTLY. Do not ignore or override any input.
    - Adhere strictly to the structure and formatting of the provided template. Do not add sections not explicitly requested.
    - Do not output in Markdown or HTML. Plain text only.
    - After completing the template, append the following two required sections:
    [SCENARIO]
    - A concise third-person summary using all inputs. Refer to user as {{user}}.
    [STARTING_MESSAGE]
    - A second-person immersive scene initiating interaction. Markdown permitted *write like this for actions* and "write like this for dialogue". Refer to {{user}} as "you".`;

    return prompt;
}

function createResultOverlay(content) {
    // Create overlay container
    const overlay = document.createElement('div');
    overlay.id = 'resultOverlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'var(--modal-bg)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '1000';
    
    // Create content container
    const contentDiv = document.createElement('div');
    contentDiv.style.backgroundColor = 'var(--background-color)';
    contentDiv.style.border = '1px solid var(--border-color)';
    contentDiv.style.borderRadius = '8px';
    contentDiv.style.maxWidth = '80%';
    contentDiv.style.maxHeight = '90vh';
    contentDiv.style.display = 'flex';
    contentDiv.style.flexDirection = 'column';
    contentDiv.style.position = 'relative';
    contentDiv.style.padding = '40px 20px 20px 20px';
    contentDiv.style.overflow = 'hidden';
    
    // Create content display
    const contentDisplay = document.createElement('pre');
    contentDisplay.textContent = content;
    contentDisplay.style.whiteSpace = 'pre-wrap';
    contentDisplay.style.color = 'var(--text-color)';
    contentDisplay.style.fontFamily = 'monospace';
    contentDisplay.style.padding = '15px';
    contentDisplay.style.border = '1px solid var(--border-color)';
    contentDisplay.style.borderRadius = '5px';
    contentDisplay.style.overflow = 'auto';
    contentDisplay.style.flex = '1';
    contentDisplay.style.minHeight = '0';
    contentDisplay.style.overflow = 'auto';
    
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '15px';
    buttonContainer.style.marginTop = '20px';
    buttonContainer.style.justifyContent = 'flex-end';
    
    // Create Close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.padding = '12px 20px';
    closeButton.style.backgroundColor = 'var(--primary-color)';
    closeButton.style.color = 'var(--text-color)';
    closeButton.style.border = '1px solid var(--border-color)';
    closeButton.style.borderRadius = '4px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontSize = '16px';
    closeButton.style.transition = 'all 0.3s';
    closeButton.onclick = () => overlay.remove();

    // Create copy button
    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Copy to Clipboard';
    copyBtn.style.padding = '12px 20px';
    copyBtn.style.backgroundColor = 'var(--primary-color)';
    copyBtn.style.color = 'var(--text-color)';
    copyBtn.style.border = '1px solid var(--border-color)';
    copyBtn.style.borderRadius = '4px';
    copyBtn.style.cursor = 'pointer';
    copyBtn.style.fontSize = '16px';
    copyBtn.style.transition = 'all 0.3s';
    copyBtn.onclick = () => {
        navigator.clipboard.writeText(content).then(() => {
            copyBtn.textContent = 'Copied!';
            setTimeout(() => copyBtn.textContent = 'Copy to Clipboard', 2000);
        }).catch(err => {
            copyBtn.textContent = 'Failed to copy';
        });
    };
    
    // Create save button
    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Download';
    saveBtn.style.padding = '12px 20px';
    saveBtn.style.backgroundColor = 'var(--primary-color)';
    saveBtn.style.color = 'var(--text-color)';
    saveBtn.style.border = '1px solid var(--border-color)';
    saveBtn.style.borderRadius = '4px';
    saveBtn.style.cursor = 'pointer';
    saveBtn.style.fontSize = '16px';
    saveBtn.style.transition = 'all 0.3s';
    saveBtn.onclick = () => {
        downloadBotConfig(content);
    };
    
    // Add buttons to container
    buttonContainer.appendChild(copyBtn);
    buttonContainer.appendChild(saveBtn);
    buttonContainer.appendChild(closeButton);
    
    // Add elements to overlay
    contentDiv.appendChild(contentDisplay);
    contentDiv.appendChild(buttonContainer);
    overlay.appendChild(contentDiv);
    
    return overlay;
}

function displayBotConfig(content) {
    const overlay = createResultOverlay(content);
    document.body.appendChild(overlay);
}

function downloadBotConfig(content) {
    // Create a Blob with the content
    const blob = new Blob([content], { type: 'text/plain' });
    
    // Create a temporary download link
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = 'your_bot.txt';
    
    // Append to body and trigger download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    
    // Clean up
    setTimeout(() => {
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(downloadLink.href);
    }, 100);
}
