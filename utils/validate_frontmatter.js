const defaultSchema = require('./frontmatter_schema.json')

/**
 * Validates parsed tutorial / learning-path frontmatter against the accepted
 * values in frontmatter_schema.json.
 *
 * Pure: no I/O, no process.exit. Checks run in a fixed order and the first
 * failure is returned, matching the behaviour of `npm run test:frontmatter`.
 *
 * @param {object|null} data - Parsed frontmatter (see extract_frontmatter_from_tutorial.js).
 * @param {object} [schema] - Accepted values; defaults to frontmatter_schema.json.
 * @returns {{ message: string, invalidData: any, info: string } | null} - The first failure, or null when valid.
 */
function validateFrontmatter(data, schema = defaultSchema) {
  const fail = (message, invalidData, info) => ({ message, invalidData, info })
  const firstNotIn = (values, accepted) => values.find(value => !accepted.includes(value))

  if (!data || typeof data !== 'object') {
    return fail('No frontmatter', null, 'The file must start with a YAML frontmatter block delimited by ---')
  }

  // path
  if (!data.path) {
    return fail('No path ', null, 'The path attribute is required in the frontmatter')
  }

  // sdk_language - must contain 1 or more values from the accepted list, must match case
  if (!data.sdk_language || data.sdk_language.length <= 0) {
    return fail('No sdk_language provided', null, 'The sdk_language attribute is required in the frontmatter')
  }
  if (!Array.isArray(data.sdk_language)) {
    return fail('Invalid sdk_language datatype', typeof data.sdk_language, 'The sdk_language must be a list')
  }
  const badLang = firstNotIn(data.sdk_language, schema.sdk_languages)
  if (badLang !== undefined) {
    return fail('Invalid sdk_language', badLang, `Valid sdk_languages: \n   [${schema.sdk_languages}]`)
  }

  // tags - 1 to 6 values from the accepted list
  if (!data.tags) {
    return fail('No tags', null, 'The tags attribute is required in the frontmatter')
  }
  if (!Array.isArray(data.tags)) {
    return fail('Invalid tags datatype', typeof data.tags, 'The tags must be a list')
  }
  if (data.tags.length <= 0 || data.tags.length > 6) {
    return fail('Invalid tag Count', data.tags.length, 'Post must have between 1 and 6 tags')
  }
  const badTag = firstNotIn(data.tags, schema.tags)
  if (badTag !== undefined) {
    return fail('Invalid tag', badTag, `Valid tags: \n   [${schema.tags}]`)
  }

  // technology - 1 or more values from the accepted list, must match case
  if (!data.technology || data.technology.length <= 0) {
    return fail('No technology Value', null, 'Post must have 1 or more technologies')
  }
  if (!Array.isArray(data.technology)) {
    return fail('Invalid technology datatype', typeof data.technology, 'The technology must be a list')
  }
  const badTech = firstNotIn(data.technology, schema.technologies)
  if (badTech !== undefined) {
    return fail('Invalid technology', badTech, `Valid technologies: \n   [${schema.technologies}]`)
  }

  // content_type - exactly one value from the accepted list, must match case
  if (!data.content_type) {
    return fail('No content_type Value', null, 'The content_type attribute is required in the frontmatter')
  }
  if (typeof data.content_type !== 'string') {
    return fail('Invalid content_type datatype', typeof data.content_type, 'The content_type must be of type string')
  }
  if (!schema.content_types.includes(data.content_type)) {
    return fail('Invalid content_type', data.content_type, `Valid content_types: \n   [${schema.content_types}]`)
  }

  // description - 2 to 4 bullets, each non-empty and at most 200 characters
  if (!data.description) {
    return fail('No description', null, 'The description attribute is required in the frontmatter')
  }
  if (!Array.isArray(data.description)) {
    return fail('Invalid description datatype', typeof data.description, 'The description must be a list of bullet points')
  }
  if (data.description.length <= 1 || data.description.length > 4) {
    return fail('Invalid Bullet Count (description)', data.description.length, 'Post description must have between 2 and 4 bullet points')
  }
  const badBullet = data.description.find(bullet => bullet.length > 200 || bullet.length === 0)
  if (badBullet !== undefined) {
    return fail('Invalid Bullet Length (description)', `Length: ${badBullet.length}; Text: ${badBullet.substring(0, 80)}...`, 'Bullets must be less than 200 characters')
  }

  // title / short_title
  if (!data.title) {
    return fail('No title', null, 'The title attribute is required in the frontmatter')
  }
  if (data.title.length > 100) {
    return fail('Invalid title Length', data.title.length, 'Post title must be at most 100 characters long')
  }
  if (!data.short_title) {
    return fail('No short_title', null, 'The short_title attribute is required in the frontmatter')
  }
  if (data.short_title.length > 72) {
    return fail('Invalid short_title Length', data.short_title.length, 'Post short_title must be at most 72 characters long')
  }

  // learning paths must list their tutorials
  if (data.content_type === 'learn') {
    if (!data.tutorials) {
      return fail('No tutorials', null, 'The tutorials attribute is required in the frontmatter for Learning Paths')
    }
    if (data.tutorials.length < 1) {
      return fail('Invalid tutorials Count', data.tutorials.length, 'Learning Paths must contain at least 1 tutorial')
    }
  }

  return null
}

module.exports = { validateFrontmatter, defaultSchema }
