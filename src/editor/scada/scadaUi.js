
import { scadaDefinitions } from './scadaDefinitions.js';
import { parseXSAC, serializeXSAC } from './xsacParser.js';

export class ScadaUI {
    constructor(editor) {
        this.editor = editor;
        this.container = null;
        this.currentElem = null;
        this.animations = [];
    }

    init() {
        // Create a floating panel or sidebar
        const div = document.createElement('div');
        div.id = 'scada_panel';
        div.style.cssText = `
        position: absolute;
        right: 10px;
        top: 60px;
        width: 360px;
        background: #f8f8f8;
        border: 1px solid #aaa;
        padding: 12px;
        z-index: 5000;
        display: none;
        max-height: 85vh;
        overflow-y: auto;
        overflow-x: hidden;
        box-shadow: 0 8px 16px rgba(0,0,0,0.15);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        border-radius: 8px;
    `;

        const style = document.createElement('style');
        style.innerHTML = `
            #scada_panel input, #scada_panel select, #scada_panel textarea {
                box-sizing: border-box !important;
                width: 100% !important;
                border: 1px solid #ccc;
                border-radius: 4px;
                padding: 6px;
                font-size: 13px;
            }
            #scada_panel button {
                cursor: pointer;
                border-radius: 4px;
                transition: background 0.2s;
            }
            #scada_panel .scada-row {
                margin-bottom: 12px;
            }
            #scada_panel label {
                margin-bottom: 4px;
                color: #555;
                font-weight: 600;
            }
        `;
        document.head.appendChild(style);

        div.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items: center; margin-bottom:15px; border-bottom:1px solid #ddd; padding-bottom:10px;">
            <div style="display: flex; flex-direction: column;">
                <strong style="font-size: 1.2em; color: #333;">SCADA Animations</strong>
                <small id="scada_element_id" style="color: #888; font-family: 'Consolas', monospace; margin-top: 2px; font-size: 0.85em;"></small>
            </div>
            <button id="scada_close" style="background:none; border:none; cursor:pointer; font-size: 20px; color: #999;">&times;</button>
        </div>
        <div id="scada_content"></div>
    `;

        document.body.appendChild(div);
        this.container = div;

        div.querySelector('#scada_close').onclick = () => this.hide();
    }

    show() {
        if (!this.container) this.init();
        this.container.style.display = 'block';
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
            this.renderEmpty();
            return;
        }

        this.currentElem = selected[0];

        // Try standard getAttribute first, then namespaced
        let label = this.currentElem.getAttribute('inkscape:label');
        if (!label) {
            label = this.currentElem.getAttributeNS('http://www.inkscape.org/namespaces/inkscape', 'label');
        }

        //console.log('SCADA: selected element', this.currentElem);
        //console.log('SCADA: inkscape:label', label);

        this.animations = parseXSAC(label);
        //console.log('SCADA: parsed animations', this.animations);

        this.renderForm();
    }

    renderEmpty() {
        const idSpan = this.container.querySelector('#scada_element_id');
        if (idSpan) idSpan.textContent = '';
        const content = this.container.querySelector('#scada_content');
        content.innerHTML = '<p style="color: #888; text-align: center; margin-top: 20px;">Please select exactly one element.</p>';
    }

    renderForm() {
        const idSpan = this.container.querySelector('#scada_element_id');
        if (idSpan) idSpan.textContent = this.currentElem ? `ID: ${this.currentElem.id}` : '';
        const content = this.container.querySelector('#scada_content');
        content.innerHTML = '';

        // Tabs or list of animations
        // For now, let's just list existing animations and allow adding new ones.

        this.animations.forEach((anim, index) => {
            const wrapper = document.createElement('div');
            wrapper.style.border = '1px solid #ddd';
            wrapper.style.marginBottom = '5px';
            wrapper.style.padding = '5px';
            wrapper.style.backgroundColor = '#fff';

            const title = document.createElement('div');
            title.innerHTML = `<b>${anim.attr.toUpperCase()}</b> <button class="remove-btn" data-index="${index}" style="float:right;color:red;">x</button>`;
            wrapper.appendChild(title);

            const def = scadaDefinitions[anim.attr];
            if (def) {
                def.fields.forEach(field => {
                    const row = document.createElement('div');
                    row.style.marginTop = '4px';
                    const label = document.createElement('label');
                    const labelStr = field.label || (field.name ? field.name.charAt(0).toUpperCase() + field.name.slice(1) : 'Unknown');
                    label.textContent = labelStr + ': ';
                    label.style.display = 'block';
                    label.style.fontSize = '0.8em';

                    let input;
                    if (field.type === 'select') {
                        input = document.createElement('select');
                        field.options.forEach(opt => {
                            const o = document.createElement('option');
                            o.value = opt;
                            o.textContent = opt;
                            input.appendChild(o);
                        });
                    } else if (field.type === 'list') {
                        input = document.createElement('div');
                        input.style.border = '1px solid #eee';
                        input.style.padding = '5px';
                        input.style.marginTop = '5px';

                        const renderItems = () => {
                            input.innerHTML = '';
                            const items = anim[field.name] || [];
                            items.forEach((item, idx) => {
                                const itemRow = document.createElement('div');
                                itemRow.style.display = 'flex';
                                itemRow.style.marginBottom = '4px';
                                itemRow.style.borderBottom = '1px dashed #eee';
                                itemRow.style.paddingBottom = '4px';

                                // Prepare temporary object for editing
                                let tempObj = {};
                                if (typeof item === 'string' && field.separator) {
                                    if (field.separator === '=') {
                                        const eqIdx = item.indexOf('=');
                                        if (eqIdx !== -1) {
                                            tempObj[field.itemFields[0].name] = item.substring(0, eqIdx);
                                            tempObj[field.itemFields[1].name] = item.substring(eqIdx + 1);
                                        } else {
                                            tempObj[field.itemFields[0].name] = item;
                                            tempObj[field.itemFields[1].name] = '';
                                        }
                                    } else {
                                        const parts = item.split(field.separator);
                                        field.itemFields.forEach((f, i) => tempObj[f.name] = parts[i] || '');
                                    }
                                } else {
                                    tempObj = item;
                                }

                                field.itemFields.forEach(ifield => {
                                    const iWrapper = document.createElement('div');
                                    iWrapper.style.marginRight = '5px';
                                    iWrapper.style.flex = '1';
                                    iWrapper.style.minWidth = '0'; // Allow shrinking

                                    let iInput;
                                    if (ifield.type === 'select') {
                                        iInput = document.createElement('select');
                                        iInput.style.width = '100%';
                                        iInput.style.boxSizing = 'border-box';
                                        if (ifield.options) {
                                            ifield.options.forEach(opt => {
                                                const o = document.createElement('option');
                                                o.value = opt;
                                                o.textContent = opt;
                                                iInput.appendChild(o);
                                            });
                                        }
                                        iInput.value = tempObj[ifield.name] || ifield.default || (ifield.options ? ifield.options[0] : '');
                                    } else if (ifield.type === 'textarea') {
                                        iInput = document.createElement('textarea');
                                        iInput.style.width = '100%';
                                        iInput.style.minHeight = '40px';
                                        iInput.style.fontFamily = 'monospace';
                                        iInput.value = tempObj[ifield.name] || '';
                                    } else {
                                        iInput = document.createElement('input');
                                        iInput.type = 'text';
                                        iInput.value = tempObj[ifield.name] || '';
                                        iInput.style.width = '100%';
                                        iInput.style.boxSizing = 'border-box';
                                    }

                                    iInput.placeholder = ifield.label || '';
                                    iInput.title = ifield.label || '';
                                    iInput.onchange = (e) => {
                                        tempObj[ifield.name] = e.target.value;

                                        if (field.separator) {
                                            // Reconstruct string
                                            let str = '';
                                            if (field.separator === '=') {
                                                str = `${tempObj[field.itemFields[0].name]}=${tempObj[field.itemFields[1].name]}`;
                                            } else {
                                                str = field.itemFields.map(f => tempObj[f.name]).join(field.separator);
                                            }
                                            items[idx] = str;
                                        }
                                        this.save();
                                    };
                                    iWrapper.appendChild(iInput);
                                    itemRow.appendChild(iWrapper);
                                });

                                const removeBtn = document.createElement('button');
                                removeBtn.textContent = 'x';
                                removeBtn.style.color = 'red';
                                removeBtn.onclick = () => {
                                    items.splice(idx, 1);
                                    anim[field.name] = items;
                                    this.save();
                                    renderItems();
                                };
                                itemRow.appendChild(removeBtn);
                                input.appendChild(itemRow);
                            });

                            const addBtn = document.createElement('button');
                            addBtn.textContent = '+ Add Rule';
                            addBtn.style.fontSize = '0.8em';
                            addBtn.onclick = () => {
                                if (!anim[field.name]) anim[field.name] = [];

                                if (field.separator) {
                                    items.push(field.separator);
                                } else {
                                    const newItem = {};
                                    // Initialize with empty strings
                                    field.itemFields.forEach(f => newItem[f.name] = '');
                                    anim[field.name].push(newItem);
                                }
                                this.save();
                                renderItems();
                            };
                            input.appendChild(addBtn);
                        };
                        renderItems();
                    } else if (field.type === 'textarea') {
                        input = document.createElement('textarea');
                        input.style.height = '100px';
                        input.style.fontFamily = 'monospace';
                    } else {
                        input = document.createElement('input');
                        input.type = field.type === 'number' ? 'number' : 'text';
                    }

                    if (field.type !== 'list') {
                        input.value = anim[field.name] || field.default || '';
                        input.style.width = '100%';
                        input.onchange = (e) => {
                            anim[field.name] = e.target.value;
                            this.save();
                        };
                    }

                    row.appendChild(label);
                    row.appendChild(input);
                    wrapper.appendChild(row);
                });
            } else {
                wrapper.appendChild(document.createTextNode(`Unknown attribute: ${anim.attr}`));
            }

            content.appendChild(wrapper);
        });

        // Add New Button
        const addWrapper = document.createElement('div');
        addWrapper.style.display = 'flex';
        addWrapper.style.gap = '8px';
        const typeSelect = document.createElement('select');
        typeSelect.style.flex = '1';
        typeSelect.style.minWidth = '0';

        const existingAttrs = new Set(this.animations.map(a => a.attr));
        let hasOptions = false;

        Object.keys(scadaDefinitions).forEach(k => {
            if (!existingAttrs.has(k)) {
                const opt = document.createElement('option');
                opt.value = k;
                opt.textContent = scadaDefinitions[k].label;
                typeSelect.appendChild(opt);
                hasOptions = true;
            }
        });

        const addBtn = document.createElement('button');
        addBtn.textContent = 'Add Animation';
        addBtn.style.whiteSpace = 'nowrap';
        addBtn.style.padding = '8px 12px';
        addBtn.style.background = '#e1f5fe';
        addBtn.style.border = '1px solid #03a9f4';
        addBtn.style.color = '#01579b';
        addBtn.style.fontWeight = '600';

        if (!hasOptions) {
            typeSelect.style.display = 'none';
            addBtn.disabled = true;
            addBtn.textContent = 'Done (All Added)';
            addBtn.style.background = '#eee';
            addBtn.style.border = '1px solid #ccc';
            addBtn.style.color = '#888';
        }

        addBtn.onclick = () => {
            if (typeSelect.value) {
                this.animations.push({ attr: typeSelect.value });
                this.save();
                this.renderForm();
            }
        };

        addWrapper.appendChild(typeSelect);
        addWrapper.appendChild(addBtn);
        content.appendChild(addWrapper);

        // Event listeners for remove
        content.querySelectorAll('.remove-btn').forEach(btn => {
            btn.onclick = (e) => {
                const idx = parseInt(e.target.dataset.index);
                this.animations.splice(idx, 1);
                this.save();
                this.renderForm();
            };
        });
    }

    save() {
        if (!this.currentElem) return;
        const str = serializeXSAC(this.animations);
        this.currentElem.setAttribute('inkscape:label', str);
        // Notify editor of change to allow undo/persist
        // SVG-Edit typically uses 'addToHistory' or setAttribute through its API.
        // However setAttribute on DOM element directly works but might bypass undo stack.
        // Better: this.editor.svgCanvas.changeSelectedAttribute('inkscape:label', str);
        if (typeof this.editor.svgCanvas.changeSelectedAttribute === 'function') {
            this.editor.svgCanvas.changeSelectedAttribute('inkscape:label', str);
        }
    }
}
