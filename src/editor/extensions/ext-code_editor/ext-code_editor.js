import { CodeEditorUI } from './codeEditorUi.js';

const name = 'code_editor';

export default {
    name,
    async init() {
        const svgEditor = this;
        const { svgCanvas } = svgEditor;
        const { $id, $click } = svgCanvas;

        const ui = new CodeEditorUI(svgEditor);

        return {
            name: 'Code Editor',
            callback() {
                // Add the button to the left toolbar
                const buttonTemplate = document.createElement('template');
                const iconData = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQxIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojNEY0NkU1O3N0b3Atb3BhY2l0eToxIiAvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6IzNCODJGNjtzdG9wLW9wYWNpdHk6MSIgLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHJ4PSI2IiBmaWxsPSJ1cmwoI2dyYWQxKSIvPjxwYXRoIGQ9Ik0xNiAxNS41TDE5LjUgMTJMMTYgOC41IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik04IDguNUw0LjUgMTJMODAxNS41IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik0xMyA3TDExIDE3IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==';
                buttonTemplate.innerHTML = `
          <se-button id="tool_code_editor" title="Edit SVG Code" src="${iconData}"></se-button>
        `;

                // Try to find a good spot in the left toolbar
                const parent = $id('tools_left');
                if (parent) {
                    parent.append(buttonTemplate.content.cloneNode(true));
                    $click($id('tool_code_editor'), () => {
                        ui.show();
                    });
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
