export class CodeEditorUI {
    constructor(editor) {
        this.editor = editor;
        this.container = null;
        this.currentElem = null;
    }

    init() {
        if (this.container) return;
        const div = document.createElement('div');
        div.id = 'code_editor_panel';
        div.style.cssText = `
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 600px;
            height: 500px;
            background: #ffffff;
            border: 1px solid #ccc;
            padding: 0;
            z-index: 6000;
            display: none;
            flex-direction: column;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            border-radius: 8px;
            overflow: hidden;
        `;

        div.innerHTML = `
            <div style="background: #f8f9fa; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ddd; cursor: move;" id="code_editor_header">
                <strong style="color: #333;">Edit SVG Code</strong>
                <button id="code_editor_close" style="background:none; border:none; font-size: 20px; cursor:pointer; color: #888;">&times;</button>
            </div>
            <div style="flex: 1; padding: 15px; display: flex; flex-direction: column;">
                <textarea id="code_editor_textarea" spellcheck="false" style="flex: 1; width: 100%; font-family: 'Consolas', 'Monaco', 'Courier New', monospace; font-size: 14px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; resize: none; background: #fafafa; color: #222;"></textarea>
                <div style="margin-top: 15px; display: flex; justify-content: flex-end; gap: 10px;">
                    <button id="code_editor_cancel" style="padding: 8px 16px; border: 1px solid #ccc; background: #fff; border-radius: 4px; cursor: pointer;">Cancel</button>
                    <button id="code_editor_apply" style="padding: 8px 16px; border: none; background: #007bff; color: white; border-radius: 4px; cursor: pointer;">Apply Changes</button>
                </div>
            </div>
        `;

        document.body.appendChild(div);
        this.container = div;

        const closeBtn = div.querySelector('#code_editor_close');
        const cancelBtn = div.querySelector('#code_editor_cancel');
        const applyBtn = div.querySelector('#code_editor_apply');

        closeBtn.onclick = () => this.hide();
        cancelBtn.onclick = () => this.hide();
        applyBtn.onclick = () => this.apply();

        this.makeDraggable(div, div.querySelector('#code_editor_header'));
    }

    makeDraggable(el, header) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        header.onmousedown = (e) => {
            e = e || window.event;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = () => {
                document.onmouseup = null;
                document.onmousemove = null;
            };
            document.onmousemove = (e) => {
                e = e || window.event;
                e.preventDefault();
                pos1 = pos3 - e.clientX;
                pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;
                el.style.top = (el.offsetTop - pos2) + "px";
                el.style.left = (el.offsetLeft - pos1) + "px";
            };
        };
    }

    show() {
        if (!this.container) this.init();
        this.container.style.display = 'flex';
        this.updateFromSelection();
    }

    hide() {
        if (this.container) this.container.style.display = 'none';
    }

    updateFromSelection() {
        if (!this.container || this.container.style.display === 'none') return;

        const selected = this.editor.svgCanvas.getSelectedElements();
        if (!selected || selected.length !== 1 || !selected[0]) {
            this.currentElem = null;
            this.container.querySelector('#code_editor_textarea').value = 'Please select exactly one element to edit its code.';
            this.container.querySelector('#code_editor_apply').disabled = true;
            return;
        }

        this.currentElem = selected[0];
        const textarea = this.container.querySelector('#code_editor_textarea');
        textarea.value = this.currentElem.outerHTML;
        this.container.querySelector('#code_editor_apply').disabled = false;
    }

    apply() {
        if (!this.currentElem) return;
        const xmlString = this.container.querySelector('#code_editor_textarea').value.trim();

        const canvas = this.editor.svgCanvas;
        const nsAttrs = Object.entries(canvas.NS).map(([name, uri]) => {
            if (name === 'HTML' || name === 'MATH' || name === 'XMLNS' || name === 'SVG') return '';
            return `xmlns:${name.toLowerCase()}="${uri}"`;
        }).join(' ');

        // Ensure we have a valid SVG context for parsing snippets with proper namespaces
        const wrappedXml = `<svg xmlns="${canvas.NS.SVG}" ${nsAttrs}>${xmlString}</svg>`;

        const parser = new DOMParser();
        const doc = parser.parseFromString(wrappedXml, 'image/svg+xml');
        const parserError = doc.querySelector('parsererror');

        if (parserError) {
            alert('Invalid SVG code: ' + parserError.textContent);
            return;
        }

        const newElem = doc.documentElement.firstElementChild;
        if (!newElem) {
            alert('No valid element found in the SVG code.');
            return;
        }
        const { BatchCommand, RemoveElementCommand, InsertElementCommand } = canvas.history;

        // Use the document context from the canvas to avoid namespace issues
        const importedElem = canvas.getDOMDocument().importNode(newElem, true);

        const parent = this.currentElem.parentNode;
        const nextSibling = this.currentElem.nextSibling;

        // Perform the swap in DOM
        parent.insertBefore(importedElem, nextSibling);
        const oldElem = this.currentElem;
        oldElem.remove();

        const batchCmd = new BatchCommand('Edit SVG Code');
        // For RemoveElementCommand, we provide the old parent/sibling
        batchCmd.addSubCommand(new RemoveElementCommand(oldElem, nextSibling, parent));
        // For InsertElementCommand, we must have the element in the DOM so it can find its parent/sibling
        batchCmd.addSubCommand(new InsertElementCommand(importedElem));

        canvas.undoMgr.addCommandToHistory(batchCmd);

        this.currentElem = importedElem;
        canvas.selectOnly([importedElem], true);
        this.updateFromSelection();
        canvas.call('changed', [importedElem]);
    }
}
