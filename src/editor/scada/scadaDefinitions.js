
/**
 * Configuration for SCADA animations.
 * Maps XSAC 'attr' to UI fields and default values.
 */

export const scadaDefinitions = {
    get: {
        label: "Get",
        fields: [
            { name: "tag", type: "text", label: "Tag", default: "" },
            { name: "align", type: "select", label: "Align", options: ["Left", "Center", "Right"], default: "Left" },
            { name: "type", type: "select", label: "Type", options: ["Data", "Good", "Bad"], default: "Data" }, // 'type' usage inferred from example
            // format is often embedded in the text content itself for 'get' (printf) or 'boolean' conventions
        ]
    },
    color: {
        label: "Color",
        fields: [
            // List is special, handled by a sub-editor
            {
                name: "list", type: "list", label: "Rules", default: [], itemFields: [
                    { name: "tag", type: "text", label: "Tag" },
                    { name: "data", type: "text", label: "Limit" },
                    { name: "param", type: "color", label: "Color Name/Code" },
                ]
            }
        ]
    },
    set: {
        label: "Set",
        fields: [
            { name: "tag", type: "text", label: "Tag", default: "" },
            { name: "src", type: "text", label: "Source", default: "" },
            { name: "prompt", type: "text", label: "Prompt", default: "" },
            { name: "type", type: "select", label: "Type", options: ["Data", "Variable"], default: "Data" },
            { name: "align", type: "select", label: "Align", options: ["Left", "Center", "Right"], default: "Right" }
        ]
    },
    // Add other types as needed: bar, rotate, etc.
    bar: {
        label: "Bar",
        fields: [
            { name: "tag", type: "text", label: "Tag" },
            { name: "min", type: "number", label: "Min" },
            { name: "max", type: "number", label: "Max" },
        ]
    },
    opacity: {
        label: "Opacity",
        fields: [
            { name: "tag", type: "text", label: "Tag", default: "" },
            { name: "min", type: "number", label: "Min", default: 0 },
            { name: "max", type: "number", label: "Max", default: 1 }
        ]
    },
    popup: {
        label: "Popup",
        fields: [
            { name: "src", type: "text", label: "Source" },
            { name: "width", type: "number", label: "Width" },
            { name: "height", type: "number", label: "Height" },
            { name: "x", type: "number", label: "X" },
            { name: "y", type: "number", label: "Y" }
        ]
    },
    clone: {
        label: "Clone",
        fields: [
            {
                name: "map",
                type: "list",
                label: "Variables",
                separator: "=",
                itemFields: [
                    { name: "var", label: "Variable", type: "text" },
                    { name: "val", label: "Value", type: "text" }
                ]
            }
        ]
    },
    script: {
        label: "Script",
        fields: [
            {
                name: "list", type: "list", label: "Scripts", default: [], format: "map", keyField: "evt", itemFields: [
                    { name: "evt", type: "select", label: "Event", options: ["mousedown", "mouseup", "mouseover", "mouseout", "mousemove", "keydown", "vega", "vega-json", "vega-lite", "exec_once", "exec_on_update"], default: "mousedown" },
                    { name: "param", type: "textarea", label: "Script Content" }
                ]
            }
        ]
    },
    rotate: {
        label: "Rotate",
        fields: [
            { name: "tag", type: "text", label: "Tag", default: "" },
            { name: "min", type: "number", label: "Min", default: 0 },
            { name: "max", type: "number", label: "Max", default: 100 }
        ]
    },
    tooltips: {
        label: "Tooltips",
        fields: [
            {
                name: "param",
                type: "list",
                label: "Lines",
                default: [],
                itemType: "string",
                itemFields: [{ name: "line", label: "Line", type: "text" }]
            },
            { name: "size", type: "number", label: "Font Size", default: 12 },
            { name: "style", type: "text", label: "Style", default: "" }
        ]
    },
    slider: {
        label: "Slider",
        fields: [
            { name: "tag", type: "text", label: "Tag", default: "" },
            { name: "min", type: "number", label: "Min", default: 0 },
            { name: "max", type: "number", label: "Max", default: 100 },
            { name: "readonly", type: "checkbox", label: "Read Only", default: 1 }
        ]
    },
    zoom: {
        label: "Zoom",
        fields: [
            { name: "tag", type: "text", label: "Tag", default: "" },
            { name: "align", type: "select", label: "Align", options: ["Left", "Center", "Right"], default: "Center" }
        ]
    },
    text: {
        label: "Text",
        fields: [
            { name: "tag", type: "text", label: "Tag", default: "" },
            {
                name: "map",
                type: "list",
                label: "Map Entries",
                separator: "=",
                itemFields: [
                    { name: "value", label: "Value", type: "text" },
                    { name: "text", label: "Text", type: "text" }
                ]
            }
        ]
    },
    open: {
        label: "Open",
        fields: [
            { name: "src", type: "text", label: "Source", default: "" },
            {
                name: "istag",
                type: "select",
                label: "Source Type",
                options: [
                    { label: "URL", value: 0 },
                    { label: "TAG", value: 1 }
                ],
                default: 0
            },
            {
                name: "type",
                type: "select",
                label: "Target",
                options: [
                    { label: "Current Window", value: "_self" },
                    { label: "New Window", value: "_blank" },
                    { label: "Shared Window", value: "_shared" }
                ],
                default: "_self"
            },
            { name: "width", type: "number", label: "Width", default: 500 },
            { name: "height", type: "number", label: "Height", default: 400 },
            { name: "x", type: "number", label: "X", default: 100 },
            { name: "y", type: "number", label: "Y", default: 100 }
        ]
    }
};
