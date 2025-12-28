
/**
 * Configuration for SCADA animations.
 * Maps XSAC 'attr' to UI fields and default values.
 */

export const scadaDefinitions = {
    get: {
        label: "Get (Text)",
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
                    { name: "param", type: "text", label: "Color/Style" },
                ]
            }
        ]
    },
    set: {
        label: "Set / Clone",
        fields: [
            { name: "tag", type: "text", label: "Tag", default: "" },
            { name: "src", type: "text", label: "Source Model ID", default: "" }, // for copy_xsac_from
        ]
    },
    // Add other types as needed: bar, rotate, etc.
    bar: {
        label: "Bar Graph",
        fields: [
            { name: "tag", type: "text", label: "Tag" },
            { name: "min", type: "number", label: "Min" },
            { name: "max", type: "number", label: "Max" },
            { name: "direction", type: "select", label: "Direction", options: ["Up", "Down", "Left", "Right"], default: "Up" }
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
    }
};
