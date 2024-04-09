const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const chalk = require('chalk')

// accepted data field values
const sdk_languages = ['nodejs', 'scala', 'python', 'swift', 'csharp', 'objective-c', 'android-java', 'any', 'java', 'kotlin', 'dart', 'golang', 'ruby']

const tags = ['Ottoman', 'Ktor', 'REST API', 'Express', 'Flask', 'TLS', 'Configuration', 'Next.js', 'iOS', 'Xcode', '.NET', 'Xamarin', 'Authentication', 'OpenID', 'Keycloak', 'Android', 'P2P', 'UIKit', 'Installation', 'Spring Boot', 'Spring Data', 'Transactions', 'SQL++ (N1QL)', 'Optimization', 'Community Edition', 'Docker', 'Data Modeling', 'Metadata', 'Best Practices', 'Data Ingestion', 'Kafka', 'Support', 'Customer', 'Prometheus', 'Monitoring', 'Observability', 'Metrics', 'Query Workbench', 'ASP.NET', 'linq', 'DBaaS', 'App Services', 'Flutter', 'Gin Gonic', 'FastAPI', 'Rails']

const technologies = ['connectors', 'kv', 'query', 'capella', 'server', 'index', 'mobile', 'fts', 'sync gateway', 'eventing', 'analytics', 'udf']

const content_types = ['quickstart', 'tutorial', 'learn']


const test = (data, path) => {
  // test path
  if (!data.path) {
    makeResponseFailure(data, path, 'No path ', null, 'The path attribute is required in the frontmatter')
    process.exit(1)
  }

  //testing sdk_language - must contain 1 or more values from the attached list, must match case
  if (data.sdk_language?.length <= 0 || !data.sdk_language) {
    makeResponseFailure(data, path, 'No sdk_language provided', null, 'The sdk_language attribute is required in the frontmatter')
    process.exit(1)
  }
  data.sdk_language?.forEach(lang => {
    if (!sdk_languages.includes(lang)) {
      makeResponseFailure(data, path, 'Invalid sdk_language', lang, `Valid sdk_languages: \n   [${sdk_languages}]`)
      process.exit(1)
    }
  })

  //testing tags contain 1 to 6 tags
  if (!data.tags) {
    makeResponseFailure(data, path, 'No tags', null, 'The tags attribute is required in the frontmatter')
    process.exit(1)
  }
  if (data.tags?.length <= 0 || data.tags?.length > 6) {
    makeResponseFailure(data, path, 'Invalid tag Count', data.tags?.length, 'Post must have between 1 and 6 tags')
    process.exit(1)
  }
  data.tags?.forEach(tag => {
    if (!tags.includes(tag)) {
      makeResponseFailure(data, path, 'Invalid tag', tag, `Valid tags: \n   [${tags}]`)
      process.exit(1)
    }
  })

  //testing technology, can contain 1 or more values from the attached list, must match case
  if (data.technology?.length <= 0 || !data.technology) {
    makeResponseFailure(data, path, 'No technology Value', null, 'Post must have 1 or more technologies')
    process.exit(1)
  }
  data.technology?.forEach(tech => {
    if (!technologies.includes(tech)) {
      makeResponseFailure(data, path, 'Invalid technology', tech, `Valid technologies: \n   [${technologies}]`)
      process.exit(1)
    }
  })

  //testing content_type, can contain only 1 value from the attached list, must match case=
  if (!data.content_type) {
    makeResponseFailure(data, path, 'No content_type Value', null, 'The content_type attribute is required in the frontmatter')
    process.exit(1)
  }
  if (typeof data.content_type !== 'string') {
    makeResponseFailure(data, path, 'Invalid content_type datatype', typeof data.content_type, `The content_type must be of type string`)
    process.exit(1)
  }
  if (!content_types.includes(data.content_type)) {
    makeResponseFailure(data, path, 'Invalid content_type', data.content_type, `Valid content_types: \n   [${content_types}]`)
    process.exit(1)
  }

  //testing description, must contain at least 2 bullets but no more than 4, each bullet should be shorter than 200 characters
  if (!data.description) {
    makeResponseFailure(data, path, 'No description', null, 'The description attribute is required in the frontmatter')
    process.exit(1)
  }
  if (data.description?.length <= 1 || data.description?.length > 4) {
    makeResponseFailure(data, path, 'Invalid Bullet Count (description)', data.description?.length, 'Post description must have between 2 and 4 bullet points')
    process.exit(1)
  }
  data.description?.forEach(bullet => {
    if (bullet.length > 200 || bullet.length === 0) {
      makeResponseFailure(data, path, 'Invalid Bullet Length (description)', `Length: ${bullet.length}; Text: ${bullet.substring(0, 80)}...`, 'Bullets must be less than 200 characters')
      process.exit(1)
    }
  })

  if (!data.title) {
    makeResponseFailure(data, path, 'No title', null, 'The title attribute is required in the frontmatter')
    process.exit(1)
  }
  //testing title length
  if (data.title?.length > 72) {
    makeResponseFailure(data, path, 'Invalid title Length', data.title?.length, 'Post title must be less than 72 characters long')
    process.exit(1)
  }
  if (!data.short_title) {
    makeResponseFailure(data, path, 'No short_title', null, 'The short_title attribute is required in the frontmatter')
    process.exit(1)
  }
  if (data.short_title?.length > 72) {
    makeResponseFailure(data, path, 'Invalid short_title Length', data.title?.length, 'Post short_title must be less than 72 characters long')
    process.exit(1)
  }

  if (data.content_type === 'learn') {
    if (!data.tutorials) {
      makeResponseFailure(data, path, 'No tutorials', null, 'The tutorials attribute is required in the frontmatter for Learning Paths')
      process.exit(1)
    }
    if (data.tutorials.length < 1) {
      makeResponseFailure(data, path, 'Invalid tutorials Count', data.tutorials.length, 'Learning Paths must contain at least 1 tutorial')
      process.exit(1)
    }
  }

}

const makeResponseFailure = (data, path, errorMessage, invalidData, infoMessage) => {
  console.error(chalk.underline(chalk.bold(chalk.red('TEST FAILURE'))))
  console.error(`Entry: \n   Path: ${chalk.underline(path)}\n   Title: ${chalk.underline(data.title)}`)
  console.error(chalk.yellow(`${errorMessage}${invalidData !== null ? `: \n   ${chalk.bgRed(' ' + invalidData + ' ')}` : ''}`))
  if (infoMessage !== null) {
    console.log(`Note: \n   ${chalk.blue(infoMessage)}`)
  }
  console.log('\n')
}

// go through every file specified directory

const getAllFiles = function(dirPath, arrayOfFiles) {
  files = fs.readdirSync(dirPath)

  arrayOfFiles = arrayOfFiles || []

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
    } else {
      if (path.extname(file).toLowerCase() === '.md')
        arrayOfFiles.push(path.join(dirPath, file))
    }
  })

  return arrayOfFiles
}

let mdFiles = []

mdFiles = getAllFiles('./tutorial/markdown', mdFiles)
mdFiles = getAllFiles('./learn/markdown', mdFiles)


// parse data
function ParseMarkdown(path) {

  try {

    let data = fs.readFileSync(path, { encoding: 'utf-8' })
    extractedContent = data.match(/---\n([^]*?)\n---/) // for LF line break

    if (!extractedContent)
      extractedContent = data.match(/---\r\n([^]*?)\r\n---/) //for CRLF line break

    if (!extractedContent)
      throw `md file at: ${path} doesn't have data in the specified format`

    const formattedData = yaml.load(extractedContent[1])

    test(formattedData, path)

  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('File not found : ', err)
    } else {
      throw err
    }

    process.exit(1)
  }

}

mdFiles.forEach((e) => {
  ParseMarkdown(e)
})

console.log(chalk.green('Test Completed:') + ' ' + chalk.bgGreen('SUCCESS') + '\n')
