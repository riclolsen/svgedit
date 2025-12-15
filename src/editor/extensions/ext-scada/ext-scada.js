
/**
 * @file ext-scada.js
 *
 * @license MIT
 *
 */

import { ScadaUI } from '../../scada/scadaUi.js';

const name = 'scada';

export default {
    name,
    async init({ importLocale }) {
        const svgEditor = this;
        const { svgCanvas } = svgEditor;
        const { $id, $click } = svgCanvas;

        const ui = new ScadaUI(svgEditor);

        return {
            name: 'SCADA',
            callback() {
                // Add the button
                const buttonTemplate = document.createElement('template');
                buttonTemplate.innerHTML = `
        <se-button id="tool_scada" title="SCADA Animations" src="scada_icon.svg"></se-button>
        `;
                // 'tools_left' is the left toolbar. 'tools_top' is top.
                const parent = document.getElementById('tools_left') || document.getElementById('tools_top');
                if (parent) {
                    parent.append(buttonTemplate.content.cloneNode(true));
                    const btn = document.getElementById('tool_scada');
                    if (btn) {
                        // If se-button is a custom element it might need special handling, but click usually works
                        btn.addEventListener('click', () => {
                            ui.show();
                        });
                    }
                }
            },

            selectedChanged(opts) {
                if (ui) {
                    ui.updateFromSelection();
                }
            }
        };
    }
};
