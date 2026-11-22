const test = require('node:test')
const assert = require('node:assert/strict')
const { validateFrontmatter, defaultSchema } = require('../utils/validate_frontmatter')

const valid = () => ({
  path: '/tutorial-example',
  title: 'Build an Example App with Couchbase',
  short_title: 'Example App',
  description: ['Learn the first thing.', 'Learn the second thing.'],
  content_type: 'tutorial',
  sdk_language: ['python'],
  tags: ['LangChain', 'OpenAI'],
  technology: ['vector search', 'capella'],
})

const messageFor = data => validateFrontmatter(data)?.message

test('accepts well-formed tutorial frontmatter', () => {
  assert.equal(validateFrontmatter(valid()), null)
})

test('reports missing frontmatter instead of throwing', () => {
  assert.equal(messageFor(null), 'No frontmatter')
})

test('rejects values outside the shared schema and names the offender', () => {
  const failure = validateFrontmatter({ ...valid(), tags: ['LangChain', 'Not A Real Tag'] })
  assert.equal(failure.message, 'Invalid tag')
  assert.equal(failure.invalidData, 'Not A Real Tag')
  assert.equal(messageFor({ ...valid(), sdk_language: ['cobol'] }), 'Invalid sdk_language')
  assert.equal(messageFor({ ...valid(), technology: ['Capella'] }), 'Invalid technology')
  assert.equal(messageFor({ ...valid(), content_type: 'blog' }), 'Invalid content_type')
})

test('enforces list sizes', () => {
  assert.equal(messageFor({ ...valid(), tags: Array(7).fill('OpenAI') }), 'Invalid tag Count')
  assert.equal(messageFor({ ...valid(), description: ['only one'] }), 'Invalid Bullet Count (description)')
  assert.equal(messageFor({ ...valid(), description: ['ok', 'x'.repeat(201)] }), 'Invalid Bullet Length (description)')
})

test('reports non-list fields instead of throwing', () => {
  assert.equal(messageFor({ ...valid(), sdk_language: 'python' }), 'Invalid sdk_language datatype')
  assert.equal(messageFor({ ...valid(), tags: 'OpenAI' }), 'Invalid tags datatype')
})

test('short_title length failure reports the short_title length', () => {
  const failure = validateFrontmatter({ ...valid(), short_title: 's'.repeat(73) })
  assert.equal(failure.message, 'Invalid short_title Length')
  assert.equal(failure.invalidData, 73)
})

test('learning paths must list tutorials', () => {
  const learn = { ...valid(), content_type: 'learn' }
  assert.equal(messageFor(learn), 'No tutorials')
  assert.equal(validateFrontmatter({ ...learn, tutorials: ['tutorial-example'] }), null)
})

test('accepts an injected schema so new vocabulary is a data change', () => {
  const schema = { ...defaultSchema, tags: [...defaultSchema.tags, 'Brand New Tag'] }
  assert.equal(validateFrontmatter({ ...valid(), tags: ['Brand New Tag'] }, schema), null)
})

test('schema lists contain no duplicates', () => {
  for (const [name, values] of Object.entries(defaultSchema)) {
    assert.equal(new Set(values).size, values.length, `${name} has duplicate entries`)
  }
})
