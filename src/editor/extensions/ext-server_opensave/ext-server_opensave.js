
const name = 'server_opensave';

const loadExtensionTranslation = async function (svgEditor) {
    let translationModule;
    const lang = svgEditor.configObj.pref('lang');
    try {
        translationModule = await import(/* @vite-ignore */ `./locale/${lang}.js`);
    } catch (_error) {
        console.warn(`Missing translation (${lang}) for ${name} - using 'en'`);
        try {
            translationModule = await import(/* @vite-ignore */ './locale/en.js');
        } catch (e) {
            // Fallback for no locale dir yet
            translationModule = { default: { name: "Server I/O", open: "Open from Server", save: "Save to Server" } };
        }
    }
    svgEditor.i18next.addResourceBundle(lang, 'translation', translationModule.default, true, true);
};

export default {
    name,
    async init(_S) {
        const svgEditor = this;
        const { svgCanvas } = svgEditor;
        const { $id, $click } = svgCanvas;

        // Default endpoints
        const serverUrl = svgEditor.configObj.pref('server_url') || '';
        const listPath = svgEditor.configObj.pref('server_list_path') || '/list';
        const openPath = svgEditor.configObj.pref('server_open_path') || '/open';
        const savePath = svgEditor.configObj.pref('server_save_path') || '/save';

        let currentFilename = '';

        const showMessage = (msg, isError = false) => {
            const status = document.createElement('div');
            status.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${isError ? '#ef4444' : '#10b981'};
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            font-family: sans-serif;
            transition: opacity 0.5s;
        `;
            status.textContent = msg;
            document.body.appendChild(status);
            setTimeout(() => {
                status.style.opacity = '0';
                setTimeout(() => status.remove(), 500);
            }, 3000);
        };

        const clickServerOpen = async () => {
            try {
                const res = await fetch(`${serverUrl}${listPath}`);
                if (!res.ok) throw new Error('Failed to fetch file list');
                const files = await res.json();
                showFileListDialog(files);
            } catch (err) {
                console.error(err);
                showMessage(`Error fetching file list: ${err.message}`, true);
            }
        };

        const showFileListDialog = (files) => {
            const dialog = document.createElement('div');
            dialog.style.cssText = `
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex; align-items: center; justify-content: center;
            z-index: 10000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;

            const content = document.createElement('div');
            content.style.cssText = `
            background: white;
            width: 400px;
            max-height: 80vh;
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            overflow: hidden;
        `;

            content.innerHTML = `
            <div style="padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; background: #f9fafb;">
                <h3 style="margin: 0; color: #111827;">Open from Server</h3>
                <button id="close_list" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #9ca3af;">&times;</button>
            </div>
            <div id="file_list_container" style="flex: 1; overflow-y: auto; padding: 10px;">
                ${files.length === 0 ? '<p style="text-align: center; color: #6b7280;">No files found on server.</p>' : ''}
            </div>
        `;

            const listContainer = content.querySelector('#file_list_container');
            files.forEach(file => {
                const item = document.createElement('div');
                item.style.cssText = `
                padding: 12px 16px;
                cursor: pointer;
                border-radius: 8px;
                transition: background 0.2s;
                color: #374151;
                margin-bottom: 4px;
            `;
                item.textContent = file;
                item.onmouseover = () => item.style.background = '#f3f4f6';
                item.onmouseout = () => item.style.background = 'transparent';
                item.onclick = () => {
                    loadServerFile(file);
                    dialog.remove();
                };
                listContainer.appendChild(item);
            });

            dialog.appendChild(content);
            document.body.appendChild(dialog);

            content.querySelector('#close_list').onclick = () => dialog.remove();
            dialog.onclick = (e) => { if (e.target === dialog) dialog.remove(); };
        };

        const loadServerFile = async (filename) => {
            try {
                const res = await fetch(`${serverUrl}${openPath}?file=${encodeURIComponent(filename)}`);
                if (!res.ok) throw new Error('Failed to load file');
                const svgContent = await res.text();
                await svgEditor.loadSvgString(svgContent);
                svgEditor.updateCanvas();
                currentFilename = filename;
                svgEditor.topPanel.updateTitle(filename);
                showMessage(`Loaded ${filename}`);
            } catch (err) {
                console.error(err);
                showMessage(`Error loading file: ${err.message}`, true);
            }
        };

        const clickServerSave = async () => {
            if (!currentFilename) {
                const name = prompt("Enter filename to save:", "document.svg");
                if (!name) return;
                currentFilename = name;
            }

            try {
                const svg = '<?xml version="1.0"?>\n' + svgCanvas.svgCanvasToString();
                const formData = new FormData();
                formData.append('file', currentFilename);
                formData.append('content', svg);

                const res = await fetch(`${serverUrl}${savePath}`, {
                    method: 'POST',
                    body: formData
                });

                if (!res.ok) throw new Error('Failed to save file');

                svgEditor.topPanel.updateTitle(currentFilename);
                showMessage(`Saved ${currentFilename}`);
            } catch (err) {
                console.error(err);
                showMessage(`Error saving file: ${err.message}`, true);
            }
        };

        return {
            name: 'Server I/O',
            callback() {
                // Add to main menu
                const openBtnTemplate = '<se-menu-item id="tool_server_open" label="Open from Server" src="open.svg"></se-menu-item>';
                const saveBtnTemplate = '<se-menu-item id="tool_server_save" label="Save to Server" src="saveImg.svg"></se-menu-item>';

                // Get main button group
                const mainBtn = $id('main_button');
                if (mainBtn) {
                    svgCanvas.insertChildAtIndex(mainBtn, openBtnTemplate, 5);
                    svgCanvas.insertChildAtIndex(mainBtn, saveBtnTemplate, 6);

                    $click($id('tool_server_open'), clickServerOpen);
                    $click($id('tool_server_save'), clickServerSave);
                }
            }
        };
    }
};
