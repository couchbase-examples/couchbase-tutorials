const yaml = require('js-yaml');

/**
 * Extracts frontmatter from markdown content string (not file).
 * 
 * @param {string} content - The raw markdown content.
 * @returns {object|null} - The parsed frontmatter, or null if not found.
 */
function extractFrontmatterFromContent(content) {
    // Try LF line breaks first
    let match = content.match(/^---\n([^]*?)\n---/);
    
    // Try CRLF line breaks if LF didn't match
    if (!match) {
        match = content.match(/^---\r\n([^]*?)\r\n---/);
    }
    
    if (!match) {
        return null;
    }
    
    return yaml.load(match[1]);
}

/**
 * Removes YAML frontmatter from markdown content.
 * 
 * @param {string} content - The raw markdown content.
 * @returns {string} - Content without frontmatter.
 */
function removeFrontmatter(content) {
    const frontmatterRegex = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;
    return content.replace(frontmatterRegex, '');
}

module.exports.extractFrontmatterFromContent = extractFrontmatterFromContent;
module.exports.removeFrontmatter = removeFrontmatter;
