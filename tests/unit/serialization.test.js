/* eslint-disable max-len, no-console */
import SvgCanvas from '../../packages/svgcanvas/svgcanvas.js'

describe('Serialization Module', function () {
  let svgCanvas

  beforeEach(() => {
    document.body.textContent = ''
    const svgEditor = document.createElement('div')
    svgEditor.id = 'svg_editor'
    const svgcanvas = document.createElement('div')
    svgcanvas.style.visibility = 'hidden'
    svgcanvas.id = 'svgcanvas'
    const workarea = document.createElement('div')
    workarea.id = 'workarea'
    workarea.append(svgcanvas)
    svgEditor.append(workarea)
    document.body.append(svgEditor)

    svgCanvas = new SvgCanvas(
      document.getElementById('svgcanvas'), {
        canvas_expansion: 3,
        dimensions: [640, 480],
        initFill: {
          color: 'FF0000',
          opacity: 1
        },
        initStroke: {
          width: 5,
          color: '000000',
          opacity: 1
        }
      }
    )
  })

  const runSerializationTest = (initialSvg, testName) => {
    svgCanvas.setSvgString(initialSvg)
    const output = svgCanvas.svgCanvasToString()
    console.log(`--- ${testName} Output ---`)
    console.log(output)
    console.log(`--- End ${testName} ---`)
    return output
  }

  it('preserves marker definitions, presentation and inherited references across repeated saves', () => {
    const initialSvg = `<svg width="640" height="480" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrow" markerWidth="10" markerHeight="8" markerUnits="userSpaceOnUse"
          refX="9" refY="4" orient="auto-start-reverse" viewBox="0 0 10 8"
          fill="#f00" stroke="#00f" stroke-width="2" overflow="visible">
          <path d="M0 0 L10 4 L0 8 Z"/>
        </marker>
        <marker id="unused" markerWidth="5" markerHeight="5" orient="auto">
          <svg id="marker-content" width="5" height="5"><circle cx="2" cy="2" r="2"/></svg>
        </marker>
      </defs>
      <g id="arrows" style="marker-start: url(#arrow); marker-mid: url(#arrow); marker-end: url(#arrow)">
        <path id="marked-path" d="M20 20 L100 20 L150 80" stroke="#000" fill="none"/>
      </g>
      <line id="marked-line" x1="20" y1="100" x2="150" y2="100" marker-end="url(#arrow)"/>
      <polyline id="marked-polyline" points="20,150 100,150 150,200" style="marker: url(#arrow)"/>
    </svg>`
    expect(svgCanvas.setSvgString(initialSvg)).toBe(true)

    for (let i = 0; i < 3; i++) {
      const output = svgCanvas.svgCanvasToString()
      const doc = new DOMParser().parseFromString(output, 'image/svg+xml')
      const arrow = doc.getElementById('arrow')
      expect(doc.querySelectorAll('marker')).toHaveLength(2)
      expect(doc.getElementById('unused').querySelector('#marker-content circle')).toBeTruthy()
      for (const [attr, value] of Object.entries({
        markerWidth: '10',
        markerHeight: '8',
        markerUnits: 'userSpaceOnUse',
        refX: '9',
        refY: '4',
        orient: 'auto-start-reverse',
        viewBox: '0 0 10 8',
        fill: '#f00',
        stroke: '#00f',
        'stroke-width': '2',
        overflow: 'visible'
      })) {
        expect(arrow.getAttribute(attr)).toBe(value)
      }
      expect(arrow.querySelector('path')).toBeTruthy()
      for (const attr of ['marker-start', 'marker-mid', 'marker-end']) {
        expect(doc.getElementById('arrows').getAttribute(attr)).toBe('url(#arrow)')
      }
      expect(doc.getElementById('marked-line').getAttribute('marker-end')).toBe('url(#arrow)')
      expect(doc.getElementById('marked-polyline').getAttribute('marker')).toBe('url(#arrow)')
      expect(svgCanvas.getSvgContent().querySelectorAll('marker')).toHaveLength(2)
      expect(svgCanvas.setSvgString(output)).toBe(true)
    }
  })

  it('should not insert whitespace in user provided complex example', function () {
    const initialSvg = '<svg width="640" height="480" xmlns="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd">' +
            '<g>' +
            '<text fill="#6a43e5" font-family="\'Microsoft Sans Serif\'" font-style="normal" font-weight="normal" id="text6572" letter-spacing="0px" text-anchor="end" word-spacing="0px" x="210" xml:space="preserve" y="-357.63782">' +
            '<tspan font-size="22px" id="tspan6574" sodipodi:role="line" x="210" y="-357.63782">d^%5.1f</tspan>' +
            '</text>' +
            '</g>' +
            '</svg>'

    const output = runSerializationTest(initialSvg, 'UserComplex')

    const textMatch = output.match(/<text[^>]*>([\s\S]*?)<\/text>/)
    assert.ok(textMatch, 'Text tag not found')
    const content = textMatch[1]

    // Use a more visual failure message
    if (content.includes('\n')) {
      console.error('FAILED: Content contains newline:\n' + JSON.stringify(content))
    }

    assert.ok(!content.includes('\n'), 'Content contains newlines')
    assert.ok(!content.includes('  '), 'Content contains indentation/double spaces')

    // Check that it's compact: <text...><tspan...>d^%5.1f</tspan></text>
    // Note: we can't assume order of attributes but we can check the boundary
    const textTagWithClosingBracket = output.match(/<text[^>]*>/)[0]
    const startIndex = output.indexOf(textTagWithClosingBracket) + textTagWithClosingBracket.length
    const nextChars = output.substring(startIndex, startIndex + 7)
    assert.equal(nextChars.startsWith('<tspan'), true, `Expected <tspan immediately after <text...>, got ${JSON.stringify(nextChars)}`)
  })

  it('should handle nested tspans correctly', function () {
    const initialSvg = '<svg width="640" height="480" xmlns="http://www.w3.org/2000/svg">' +
            '<text id="t2">A<tspan>B<tspan>C</tspan></tspan>D</text>' +
            '</svg>'

    const output = runSerializationTest(initialSvg, 'NestedTspan')
    const nestedTextMatch = output.match(/<text id="t2">([\s\S]*?)<\/text>/)[1]
    assert.ok(!nestedTextMatch.includes('\n'), 'Nested text contains newlines')
    assert.ok(!nestedTextMatch.includes('  '), 'Nested text contains double spaces')
  })
})
