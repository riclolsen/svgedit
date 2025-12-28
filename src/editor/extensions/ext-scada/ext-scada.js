
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
                const iconData = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9InNjYWRhR3JhZCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzBEOTQ4ODtzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMxNEI4QTY7c3RvcC1vcGFjaXR5OjEiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiByeD0iNiIgZmlsbD0idXJsKCNzY2FkYUdyYWQpIi8+PHJlY3QgeD0iNSIgeT0iNyIgd2lkdGg9IjE0IiBoZWlnaHQ9IjEwIiByeD0iMS41IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjEuOCIvPjxwYXRoIGQ9Ik03IDEySDlMMTAuNSA5TDEzLjUgMTVMMTUgMTJIMTciIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48Y2lyY2xlIGN4PSIxNiIgY3k9IjEwIiByPSIxIiBmaWxsPSIjNEFERTgwIj48YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJvcGFjaXR5IiB2YWx1ZXM9IjE7MC40OzEiIGR1cj0iMnMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIiAvPjwvY2lyY2xlPjxwYXRoIGQ9Ik0xMiAxN1YxOU0xMCAyMEgxNCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg==';
                buttonTemplate.innerHTML = `
        <se-button id="tool_scada" title="SCADA Animations" src="${iconData}"></se-button>
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
