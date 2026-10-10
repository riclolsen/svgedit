import { describe, it, expect, vi } from 'vitest'
import SvgCanvas from '../../packages/svgcanvas/svgcanvas.js'
import { NS } from '../../packages/svgcanvas/core/namespaces.js'
import { parseXSAC, serializeXSAC } from '../../src/editor/scada/xsacParser.js'
import { ScadaUI } from '../../src/editor/scada/scadaUi.js'

describe('SCADA/XSAC integration', () => {
  const animations = [
    { attr: 'get', tag: 'PUMP.STATUS', format: '%s' },
    { attr: 'color', list: [{ tag: 'PUMP.STATUS', data: '1', param: '#00ff00' }] },
    { attr: 'script', script: 'if (value) { setText("running"); }' }
  ]

  it('round trips multiple animations, nested values, and script text', () => {
    expect(parseXSAC(serializeXSAC(animations))).toEqual(animations)
    expect(parseXSAC('')).toEqual([])
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      expect(parseXSAC('Pump label')).toEqual([])
    } finally {
      warning.mockRestore()
    }
  })

  it('loads, edits, and saves XSAC with Inkscape layers and namedview intact', () => {
    document.body.innerHTML = '<div id="svg_editor"><div id="workarea"><div id="svgcanvas"></div></div></div>'
    const canvas = new SvgCanvas(document.getElementById('svgcanvas'), {
      dimensions: [640, 480],
      initFill: { color: 'FF0000', opacity: 1 },
      initStroke: { width: 1, color: '000000', opacity: 1 }
    })
    const source = new DOMParser().parseFromString(`<svg xmlns="${NS.SVG}" xmlns:inkscape="${NS.INKSCAPE}" xmlns:sodipodi="${NS.SODIPODI}" xmlns:xlink="${NS.XLINK}" width="640" height="480">
      <sodipodi:namedview id="view" inkscape:zoom="2"/>
      <g id="layer" inkscape:groupmode="layer" inkscape:label="Process">
        <rect id="pump" x="1.123456" y="10" width="20" height="20"/>
        <text id="value" xml:space="preserve">A<tspan> B </tspan>C</text>
        <image id="image" xlink:href="data:image/png;base64,AA==" width="1" height="1"/>
      </g>
    </svg>`, 'image/svg+xml')
    source.getElementById('pump').setAttributeNS(NS.INKSCAPE, 'inkscape:label', serializeXSAC(animations))
    expect(canvas.setSvgString(new XMLSerializer().serializeToString(source))).toBe(true)
    expect(canvas.getCurrentDrawing().getCurrentLayerName()).toBe('Process')
    const pump = canvas.getSvgContent().querySelector('#pump')
    canvas.selectOnly([pump], true)
    const ui = new ScadaUI({ svgCanvas: canvas })
    ui.show()
    expect(ui.animations).toEqual(animations)
    ui.animations[0].tag = 'PUMP.NEW_STATUS'
    ui.save()
    canvas.getCurrentDrawing().setCurrentLayerName('Renamed')
    const saved = new DOMParser().parseFromString(canvas.svgCanvasToString(), 'image/svg+xml')
    expect(saved.querySelector('parsererror')).toBeNull()
    expect(parseXSAC(saved.getElementById('pump').getAttributeNS(NS.INKSCAPE, 'label'))).toEqual(ui.animations)
    expect(saved.getElementById('pump').getAttribute('x')).toBe('1.123456')
    expect(saved.getElementById('layer').getAttributeNS(NS.INKSCAPE, 'label')).toBe('Renamed')
    expect(saved.getElementById('view').getAttributeNS(NS.INKSCAPE, 'zoom')).toBe('2')
    expect(saved.getElementById('image').getAttributeNS(NS.XLINK, 'href')).toBe('data:image/png;base64,AA==')
    expect(saved.getElementById('value').textContent).toBe('A B C')
  })
})
