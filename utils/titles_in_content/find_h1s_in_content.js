const { marked } = require('marked');
const cheerio = require('cheerio');
const { removeFrontmatter } = require('../extract_frontmatter_from_tutorial');

/**
 * Finds all h1 tag titles from markdown content string.
 * 
 * @param {string} content - The markdown content.
 * @returns {string[]} - Array of h1 tag titles found.
 */
function findH1sInContent(content) {
    // Remove frontmatter first (marked doesn't handle YAML frontmatter)
    const markdownContent = removeFrontmatter(content);
    
    // Convert to HTML - this handles code blocks, comments, etc. correctly
    const html = marked.parse(markdownContent);
    
    // Find H1s in the rendered HTML
    const $ = cheerio.load(html);
    const results = [];
    
    $('h1').each((_, element) => {
        const text = $(element).text().trim();
        if (text) {
            results.push(text);
        }
    });
    
    return results;
}

module.exports = findH1sInContent;
