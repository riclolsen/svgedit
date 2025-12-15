
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
        width: 300px;
        background: #f0f0f0;
        border: 1px solid #999;
        padding: 10px;
        z-index: 5000;
        display: none;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        font-family: sans-serif;
    `;

        div.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid #ccc; padding-bottom:5px;">
            <strong>SCADA Animations</strong>
            <button id="scada_close" style="background:none;border:none;cursor:pointer;">X</button>
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

        console.log('SCADA: selected element', this.currentElem);
        console.log('SCADA: inkscape:label', label);

        this.animations = parseXSAC(label);
        console.log('SCADA: parsed animations', this.animations);

        this.renderForm();
    }

    renderEmpty() {
        const content = this.container.querySelector('#scada_content');
        content.innerHTML = '<p>Please select exactly one element.</p>';
    }

    renderForm() {
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
                    label.textContent = field.label + ': ';
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

                                field.itemFields.forEach(ifield => {
                                    const iWrapper = document.createElement('div');
                                    iWrapper.style.marginRight = '5px';
                                    iWrapper.style.flex = '1';

                                    const iInput = document.createElement('input');
                                    iInput.type = 'text';
                                    iInput.value = item[ifield.name] || '';
                                    iInput.placeholder = ifield.label;
                                    iInput.style.width = '100%';
                                    iInput.title = ifield.label;
                                    iInput.onchange = (e) => {
                                        item[ifield.name] = e.target.value;
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
                                const newItem = {};
                                // Initialize with empty strings
                                field.itemFields.forEach(f => newItem[f.name] = '');
                                anim[field.name].push(newItem);
                                this.save();
                                renderItems();
                            };
                            input.appendChild(addBtn);
                        };
                        renderItems();
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
        addWrapper.style.marginTop = '10px';
        const typeSelect = document.createElement('select');
        Object.keys(scadaDefinitions).forEach(k => {
            const opt = document.createElement('option');
            opt.value = k;
            opt.textContent = scadaDefinitions[k].label;
            typeSelect.appendChild(opt);
        });
        const addBtn = document.createElement('button');
        addBtn.textContent = 'Add Animation';
        addBtn.onclick = () => {
            this.animations.push({ attr: typeSelect.value });
            this.save();
            this.renderForm();
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
