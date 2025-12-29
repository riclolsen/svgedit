
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
                    label.style.fontSize = '0.8em';
                    label.style.whiteSpace = 'nowrap';

                    if (field.type === 'checkbox') {
                        row.style.display = 'flex';
                        row.style.alignItems = 'center';
                        row.style.flexDirection = 'row';
                        row.style.gap = '8px';
                        label.style.display = 'inline-block';
                        label.style.margin = '0';
                        label.style.cursor = 'pointer';
                    } else {
                        label.style.display = 'block';
                    }

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
                                if (field.itemType === 'string') {
                                    tempObj[field.itemFields[0].name] = item;
                                } else if (typeof item === 'string' && field.separator) {
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
                                    } else if (ifield.type === 'color') {
                                        iInput = document.createElement('div');
                                        iInput.style.display = 'flex';
                                        iInput.style.gap = '2px';
                                        iInput.style.width = '100%';

                                        const txt = document.createElement('input');
                                        txt.type = 'text';
                                        txt.value = tempObj[ifield.name] || '';
                                        txt.style.flex = '1';
                                        txt.style.minWidth = '0';
                                        txt.style.boxSizing = 'border-box';
                                        // Override global CSS that forces width: 100%
                                        txt.style.setProperty('width', 'auto', 'important');

                                        const pickerWrapper = document.createElement('div');
                                        pickerWrapper.style.position = 'relative';
                                        pickerWrapper.style.width = '24px';
                                        pickerWrapper.style.height = '24px';
                                        pickerWrapper.style.flexShrink = '0';
                                        pickerWrapper.style.display = 'flex';
                                        pickerWrapper.style.alignItems = 'center';
                                        pickerWrapper.style.justifyContent = 'center';

                                        const picker = document.createElement('input');
                                        picker.type = 'color';
                                        picker.style.position = 'absolute';
                                        picker.style.top = '0';
                                        picker.style.left = '0';
                                        picker.style.width = '100%';
                                        picker.style.height = '100%';
                                        picker.style.opacity = '0';
                                        picker.style.cursor = 'pointer';
                                        picker.style.setProperty('padding', '0', 'important');
                                        picker.style.setProperty('width', '100%', 'important');
                                        picker.style.setProperty('border', 'none', 'important');

                                        const paletteIcon = document.createElement('div');
                                        paletteIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.92 0 1.76-.74 1.76-1.67 0-.44-.19-.85-.49-1.16-.3-.3-.48-.72-.48-1.17 0-.93.75-1.68 1.68-1.68h2.06c4.68 0 8.47-3.79 8.47-8.47C25 5.99 19.17 2 12 2z"/></svg>`;
                                        paletteIcon.style.color = '#555';
                                        paletteIcon.style.pointerEvents = 'none';

                                        pickerWrapper.appendChild(paletteIcon);
                                        pickerWrapper.appendChild(picker);

                                        // Try to sync picker with text if it's a valid hex
                                        if (txt.value.match(/^#[0-9A-Fa-f]{6}$/)) {
                                            picker.value = txt.value;
                                        }

                                        picker.oninput = (e) => {
                                            txt.value = e.target.value;
                                            // Trigger change manually
                                            txt.dispatchEvent(new Event('change'));
                                        };

                                        txt.onchange = (e) => {
                                            tempObj[ifield.name] = e.target.value;
                                            // Update picker if valid hex
                                            if (e.target.value.match(/^#[0-9A-Fa-f]{6}$/)) {
                                                picker.value = e.target.value;
                                            }
                                            // Save Logic (duplicated from default input change)
                                            if (field.separator) {
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

                                        iInput.appendChild(txt);
                                        iInput.appendChild(pickerWrapper);

                                        // We need to return the container, but the loop expects 'iInput' to have .value or similar for shared logic?
                                        // Actually the shared logic below 'iInput.placeholder...' assumes simple input.
                                        // We should probably bypass the shared logic for this composite type or adapt it.
                                        // The current code structure appends iInput at the end of loop.
                                        // We will add the placeholder to 'txt' here.
                                        txt.placeholder = ifield.label || '';
                                        txt.title = ifield.label || '';

                                        // The 'onchange' handler below (lines 234+) overwrites onchange. 
                                        // We defined txt.onchange above, but 'iInput' is the DIV. 
                                        // The code below adds 'onchange' to iInput. 
                                        // We must prevent that or ensure it works. 
                                        // The loop continues...
                                        // To avoid the code below breaking or overwriting, we can use a flag or restructure.
                                        // Simpler: Let's assign the text input as 'iInput' for the sake of the shared logic below, 
                                        // but we need to append the picker somehow. 
                                        // ACTUALLY, the logic below (lines 234-248) attaches onchange to iInput.
                                        // If iInput is a div, onchange won't fire/bubble correctly from children unless we handle it.
                                        // Let's rely on our custom logic above and ensure the code below doesn't mess it up.
                                    } else {
                                        iInput = document.createElement('input');
                                        iInput.type = 'text';
                                        iInput.value = tempObj[ifield.name] || '';
                                        iInput.style.width = '100%';
                                        iInput.style.boxSizing = 'border-box';
                                    }

                                    if (ifield.type !== 'color') {
                                        iInput.placeholder = ifield.label || '';
                                        iInput.title = ifield.label || '';
                                        iInput.onchange = (e) => {
                                            tempObj[ifield.name] = e.target.value;

                                            if (field.itemType === 'string') {
                                                items[idx] = e.target.value;
                                            } else if (field.separator) {
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
                                    }
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

                                if (field.itemType === 'string') {
                                    items.push('');
                                } else if (field.separator) {
                                    items.push(field.separator);
                                } else {
                                    const newItem = {};
                                    // Initialize with empty strings
                                    field.itemFields.forEach(f => {
                                        newItem[f.name] = '';
                                        // "Repeat the last value of tag field previously entered"
                                        if (f.name === 'tag' && items.length > 0) {
                                            const lastItem = items[items.length - 1];
                                            let lastTagVal = '';

                                            // Handle string format (separator) vs object format
                                            if (typeof lastItem === 'string') {
                                                // If previous item was string, parse it to find tag
                                                // We can't easily parse generic separator strings without knowing the position of 'tag', 
                                                // but for object-based items (which is what we are pushing now), this block shouldn't be hit often 
                                                // unless we are mixing formats.
                                                // For robustness, let's assume we are mostly dealing with objects in 'anim[field.name]' 
                                                // OR we blindly try to match if we can.
                                            } else {
                                                // Object format
                                                lastTagVal = lastItem.tag || '';
                                            }

                                            if (lastTagVal) newItem[f.name] = lastTagVal;
                                        }
                                    });
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
                    } else if (field.type === 'checkbox') {
                        input = document.createElement('input');
                        input.type = 'checkbox';
                    } else {
                        input = document.createElement('input');
                        input.type = field.type === 'number' ? 'number' : 'text';
                    }

                    if (field.type !== 'list') {
                        if (field.type === 'checkbox') {
                            input.checked = (anim[field.name] ?? field.default) == 1;
                            input.style.cursor = 'pointer';
                            input.onchange = (e) => {
                                anim[field.name] = e.target.checked ? 1 : 0;
                                this.save();
                            };
                        } else {
                            input.value = anim[field.name] ?? field.default ?? '';
                            input.style.width = '100%';
                            input.onchange = (e) => {
                                anim[field.name] = e.target.value;
                                this.save();
                            };
                        }
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
                const tagName = (this.currentElem?.tagName || '').toLowerCase();

                // Filter: Text attribute should only be available for text objects
                if (k === 'text' && tagName !== 'text') {
                    return;
                }

                // Filter: Color and Bar Graph should not be available for group objects
                if (tagName === 'g' && (k === 'color' || k === 'bar')) {
                    return;
                }

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
                const newAttr = typeSelect.value;
                const newAnim = { attr: newAttr };

                // "Repeat the value of the last entered attribute"
                // If there is at least one existing animation, try to carry over values
                if (this.animations.length > 0) {
                    const lastAnim = this.animations[this.animations.length - 1];
                    const def = scadaDefinitions[newAttr];

                    if (def && def.fields) {
                        def.fields.forEach(field => {
                            // If the last animation defines this field, copy it
                            if (lastAnim[field.name] !== undefined) {
                                // Avoid copying incompatible lists across different types (e.g. don't copy Color rules to Script list)
                                // Only copy lists if we are adding the same type of animation, or if we explicitly decide it's safe (which it usually isn't for lists)
                                if (field.type === 'list' && lastAnim.attr !== newAttr) {
                                    return;
                                }

                                let val = lastAnim[field.name];
                                // Deep copy objects/arrays
                                if (typeof val === 'object' && val !== null) {
                                    newAnim[field.name] = JSON.parse(JSON.stringify(val));
                                } else {
                                    newAnim[field.name] = val;
                                }
                            }
                        });
                    }
                }

                this.animations.push(newAnim);
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
