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
                buttonTemplate.innerHTML = `
          <se-button id="tool_code_editor" title="Edit SVG Code" src="code_editor.svg"></se-button>
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
