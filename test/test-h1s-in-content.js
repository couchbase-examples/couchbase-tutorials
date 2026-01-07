const findH1sInContent = require('../utils/titles_in_content/find_h1s_in_content');

/**
 * Validates that a markdown file has exactly one H1 tag that matches 
 * the title specified in its frontmatter, or has no H1 tags.
 * 
 * @param {string} fileContent - The content of the markdown file.
 * @param {object} frontmatter - The frontmatter of the markdown file.
 * @param {string} filePath - The path to the markdown file.
 * @returns {{ valid: boolean, h1s: string[], expectedTitle: string, error?: string }} - Validation result.
 */
function validateH1MatchesFrontmatterTitle(fileContent, frontmatter, filePath) {
    const expectedTitle = frontmatter.title;
    
    const h1s = findH1sInContent(fileContent);
    
    // Valid if no H1 tags are found
    if (h1s.length === 0) {
        return {
            valid: true,
            h1s,
            expectedTitle
        };
    }
    
    // Check if there is exactly one H1 tag
    if (h1s.length > 1) {
        return {
            valid: false,
            h1s,
            expectedTitle,
            error: `Expected 0 or 1 H1 tag, number of H1 tags found: ${h1s.length} in ${filePath}`
        };
    }
    
    // Check if the single H1 tag matches the expected title
    if (h1s[0] !== expectedTitle) {
        return {
            valid: false,
            h1s,
            expectedTitle,
            error: `H1 "${h1s[0]}" does not match frontmatter title "${expectedTitle}" in ${filePath}`
        };
    }
    
    return {
        valid: true,
        h1s,
        expectedTitle
    };
}

module.exports = validateH1MatchesFrontmatterTitle;
