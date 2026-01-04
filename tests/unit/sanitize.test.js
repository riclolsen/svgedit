import { NS } from '../../packages/svgcanvas/core/namespaces.js'
import * as sanitize from '../../packages/svgcanvas/core/sanitize.js'

describe('sanitize', function () {
  const svg = document.createElementNS(NS.SVG, 'svg')

  it('Test sanitizeSvg() strips ws from style attr', function () {
    const rect = document.createElementNS(NS.SVG, 'rect')
    rect.setAttribute('style', 'stroke: blue ;\t\tstroke-width :\t\t40;')
    // sanitizeSvg() requires the node to have a parent and a document.
    svg.append(rect)
    sanitize.sanitizeSvg(rect)

    assert.equal(rect.getAttribute('stroke'), 'blue')
    assert.equal(rect.getAttribute('stroke-width'), '40')
  })

  it('Test sanitizeSvg() does not remove <namedview>', function () {
    const namedview = document.createElementNS(NS.SVG, 'namedview')
    namedview.setAttribute('id', 'base')
    namedview.setAttribute('pagecolor', '#ffffff')
    svg.append(namedview)
    sanitize.sanitizeSvg(namedview)

    assert.ok(svg.querySelector('namedview'))
    assert.equal(namedview.getAttribute('id'), 'base')
    assert.equal(namedview.getAttribute('pagecolor'), '#ffffff')
  })
})
