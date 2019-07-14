'use strict'

const heading = require('mdast-util-heading-range')
const mapLimit = require('map-limit')
const generator = require('./mdast-generator')

module.exports = function (options) {
  const sections = options.sections
  const modules = options.modules || {}

  // Normalize and validate sections
  for (const section of sections) {
    if (typeof section.title !== 'string' || section.title === '') {
      throw new TypeError('title must be a non-empty string')
    }

    for (const [id, module] of Object.entries(section.modules)) {
      if (modules[id]) {
        throw new Error('duplicate module: ' + id)
      }

      if (!module.url) {
        if (!module.github) {
          throw new TypeError('either "github" or "url" must be set')
        }

        module.url = `https://github.com/${module.github}`
      }

      // Collect links for bookmarks
      modules[id] = module.url
    }
  }

  return function transformer (tree, file, next) {
    mapLimit(sections, 4, generator, (err, results) => {
      if (err) return next(err)

      results.forEach((nodes, index) => {
        // Find current section and replace it with new nodes
        heading(tree, sections[index].title, (start, oldNodes, end) => {
          return [start].concat(nodes).concat([end])
        })
      })

      next()
    })
  }
}
