/**
 * Tools for clear.
 * @module clear
 * @license MIT
 * @copyright 2011 Jeff Schiller
 */
import { NS } from './namespaces.js'

let svgCanvas = null

/**
* @function module:clear.init
* @param {module:clear.SvgCanvas#init} clearContext
* @returns {void}
*/
export const init = (canvas) => {
  svgCanvas = canvas
}

export const clearSvgContentElementInit = () => {
  const curConfig = svgCanvas.getCurConfig()
  const { dimensions } = curConfig
  const el = svgCanvas.getSvgContent()
  // empty
  while (el.firstChild) { el.removeChild(el.firstChild) }

  // Reset any stale attributes from the previous document.
  for (const attr of Array.from(el.attributes)) {
    if (attr.namespaceURI) {
      el.removeAttributeNS(attr.namespaceURI, attr.localName)
    } else {
      el.removeAttribute(attr.name)
    }
  }

  const pel = svgCanvas.getSvgRoot()
  el.setAttribute('id', 'svgcontent')
  el.setAttribute('width', dimensions[0])
  el.setAttribute('height', dimensions[1])
  el.setAttribute('x', dimensions[0])
  el.setAttribute('y', dimensions[1])
  el.setAttribute('overflow', curConfig.show_outside_canvas ? 'visible' : 'hidden')
  el.setAttribute('xmlns', NS.SVG)
  el.setAttributeNS(NS.XMLNS, 'xmlns:se', NS.SE)
  el.setAttributeNS(NS.XMLNS, 'xmlns:xlink', NS.XLINK)
  el.setAttributeNS(NS.XMLNS, 'xmlns:inkscape', NS.INKSCAPE)
  el.setAttributeNS(NS.XMLNS, 'xmlns:sodipodi', NS.SODIPODI)
  if (el.parentNode !== pel) {
    pel.appendChild(el)
  }

  // TODO: make this string optional and set by the client
  const comment = svgCanvas.getDOMDocument().createComment(' Created with SVG-edit - https://github.com/SVG-Edit/svgedit')
  el.append(comment)
}
