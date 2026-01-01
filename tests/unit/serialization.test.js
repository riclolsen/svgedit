/* eslint-disable max-len, no-console */
import SvgCanvas from '../../packages/svgcanvas'

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
