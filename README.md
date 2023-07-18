
# Couchbase Tutorials

This repository contains the content for the [Couchbase Developer Tutorials](https://developer.couchbase.com/tutorials/). Files will be pulled from the `main` branch and built on the Developer Portal site **on a weekly basis**. 

This means that **ALL CHANGES TO TUTORIALS IN THE MAIN BRANCH WILL GO LIVE IN PRODUCTION AUTOMATICALY**. Please be sure all content has been reviewed by the appropriate stakeholders prior to merging.




## Contributing

Contributions are more than welcome! Feel free to open a PR that updates an existing tutorial or adds a new tutorial.

### Prerequisites
The following dependencies, while not explicitly required to contribute, will enable you to test your content locally to ensure its formatting is valid.
- Node.js `v16+`
- NPM or Yarn
A good markdown editor/previewer is also highly recommended.

### File Structure
The relevant directories are the following:
```
.
├── learn/
│   └── markdown/
│       └── some-learning-path.md
└── tutorials/
    └── markdown/
        └── some-tutorial.md
```

The `tutorials/` directory contains all markdown files that generate tutorials, while the `learn/` directory contains markdown files that generate learning paths. The Learning Path files define a list of tutorials (the `tutorials:` field in the frontmatter) that are included as part of the learning path, as well as some introductory content for the path.


### Project Setup
Clone the repo
```bash
  git clone https://github.com/couchbase-examples/couchbase-tutorials.git
```

Install dependencies with npm
```bash
  cd couchbase-tutorials
  npm install
```


### First Steps
The easiest approach to creating a new tutorial or learning is to copy an existing one, and update the content. This will ensure all frontmatter fields are included and give you a general idea for the general layout and flow of a tutorial.

If you've never written markdown before, we highly recommend following a [markdown tutorial](https://commonmark.org/help/tutorial/) or having a [cheet sheet](https://commonmark.org/help/) handy. Note that we use a plugin called `gatsby-transformer-remark` to transform markdown content. Under the hood this plugin uses `remark` to process files, which [follows the CommonMark specification](https://github.com/remarkjs/remark#syntax).


### Frontmatter
We define certain metadata attributes using a section in our markdown called `frontmatter`. This section defines certain details including the URL path, title, description, and various filtering data for the given tutorial or learning path. The easiest approach is to copy the structure of another tutorial or learning path.

#### Testing the Frontmatter
To ensure frotnmatter schema is adhered to, we've written some simple tests to enforce the attributes included.

Run `npm run test:frontmatter` to check the frontmatter of **all** tutorials and learning paths.

----

<p align="center" style="margin-top:16px;">
  <img src="https://www.couchbase.com/wp-content/uploads/2022/08/CB-logo-R_B_B.png" />
</p>

