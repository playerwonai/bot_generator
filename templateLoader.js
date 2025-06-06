
// Template Loader Module
const templateCache = {};

// Map bot type names to template file names (ensuring consistent lowercase)
const templateMappings = {
    'character': 'char',
    'scenario': 'scenario'
};

export async function loadTemplate(templateName) {
    // Normalize template name to lowercase
    const normalizedTemplateName = templateName.toLowerCase();
    
    // Map the template name to the actual file name
    const fileName = templateMappings[normalizedTemplateName] || normalizedTemplateName;
    
    if (templateCache[fileName]) {
        return templateCache[fileName];
    }

    try {
        // Use lowercase file name for consistent case handling
        const url = `template/${fileName}.txt`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load template: ${templateName} (mapped to ${fileName}) - Status: ${response.status}`);
        }
        const content = await response.text();
        templateCache[fileName] = content;
        return content;
    } catch (error) {
        throw error;
    }
}

export function getTemplate(templateName) {
    const fileName = templateMappings[templateName] || templateName;
    if (!templateCache[fileName]) {
        throw new Error(`Template not loaded: ${templateName} (mapped to ${fileName})`);
    }
    return templateCache[fileName];
}
