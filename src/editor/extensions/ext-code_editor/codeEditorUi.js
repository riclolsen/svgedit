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
            width: 700px;
            height: 600px;
            background: #252526;
            border: 1px solid #444;
            padding: 0;
            z-index: 6000;
            display: none;
            flex-direction: column;
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            border-radius: 12px;
            overflow: hidden;
            color: #ccc;
        `;

        div.innerHTML = `
            <div style="background: #323233; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #444; cursor: move; user-select: none;" id="code_editor_header">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>
                    <strong style="color: #eee; font-size: 14px;">Source Editor</strong>
                </div>
                <button id="code_editor_close" style="background:none; border:none; font-size: 24px; cursor:pointer; color: #aaa; line-height: 1;">&times;</button>
            </div>
            <div style="flex: 1; padding: 0; display: flex; flex-direction: column; background: #1e1e1e;">
                <textarea id="code_editor_textarea" spellcheck="false" style="flex: 1; width: 100%; font-family: 'Cascadia Code', 'Consolas', 'Monaco', 'Courier New', monospace; font-size: 13px; line-height: 1.6; padding: 20px; border: none; outline: none; background: #1e1e1e; color: #d4d4d4; resize: none;"></textarea>
                <div style="padding: 15px 20px; background: #252526; border-top: 1px solid #444; display: flex; justify-content: space-between; align-items: center;">
                    <span id="code_editor_status" style="font-size: 12px; color: #888;">Editing element</span>
                    <div style="display: flex; gap: 10px;">
                        <button id="code_editor_cancel" style="padding: 8px 20px; border: 1px solid #444; background: #333; color: #eee; border-radius: 6px; cursor: pointer; font-size: 13px; transition: all 0.2s;">Cancel</button>
                        <button id="code_editor_apply" style="padding: 8px 20px; border: none; background: #007acc; color: white; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s;">Apply Changes</button>
                    </div>
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

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.container.style.display === 'flex') {
                this.hide();
            }
        });

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
        const canvas = this.editor.svgCanvas;
        const textarea = this.container.querySelector('#code_editor_textarea');
        textarea.value = canvas.svgToString(this.currentElem, 0);
        this.container.querySelector('#code_editor_status').textContent = `Editing <${this.currentElem.tagName.toLowerCase()}> element`;
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
