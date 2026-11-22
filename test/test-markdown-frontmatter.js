const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const { extractFrontmatterFromContent } = require('../utils/extract_frontmatter_from_tutorial')
const { validateFrontmatter } = require('../utils/validate_frontmatter')
const validateH1MatchesFrontmatterTitle = require('./test-h1s-in-content')

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


let h1Failures = []

mdFiles.forEach((e) => {
  try {
    const fileContent = fs.readFileSync(e, { encoding: 'utf-8' })    
    const frontmatter = extractFrontmatterFromContent(fileContent)
    
    // test frontmatter (accepted values live in utils/frontmatter_schema.json)
    const failure = validateFrontmatter(frontmatter)
    if (failure) {
      makeResponseFailure(frontmatter || {}, e, failure.message, failure.invalidData, failure.info)
      process.exit(1)
    }
    
    // test h1 matches frontmatter title
    const h1Result = validateH1MatchesFrontmatterTitle(fileContent, frontmatter, e)
    if (!h1Result.valid) {
      h1Failures.push({ frontmatter, path: e, error: h1Result.error })
    }
  } catch (err) {
    throw err
  }
})

// Print all H1 failures at the end
if (h1Failures.length > 0) {
  console.log(chalk.red(`\n=== H1 Title Mismatches (${h1Failures.length} files) ===\n`))
  h1Failures.forEach((failure) => {
    makeResponseFailure(failure.frontmatter, failure.path, failure.error, null, null)
  })
  process.exit(1)
}

console.log(chalk.green('Test Completed:') + ' ' + chalk.bgGreen(' SUCCESS ') + '\n')
