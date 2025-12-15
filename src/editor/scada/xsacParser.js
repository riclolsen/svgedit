/**
 * Parser for XSAC markup stored in inkscape:label attributes.
 * The format is typically a comma-separated list of JSON objects:
 * e.g. {"attr":"color",...}, {"attr":"get",...}
 */

export const parseXSAC = (label) => {
  if (!label || !label.trim()) {
    return [];
  }

  try {
    // Try wrapping in brackets to handle multiple comma-separated objects
    // This handles both single object "{...}" and multiple "{...},{...}"
    const wrapped = `[${label}]`;
    console.log('SCADA: wrapping label', wrapped);
    return JSON.parse(wrapped);
  } catch (e) {
    console.warn("SCADA: Failed to parse XSAC label via JSON wrapper:", e);

    // Fallback: Try regex if the JSON might be malformed or non-standard
    // This is a naive regex and might need improvement for nested objects/arrays containing '},{'
    // But for standard XSAC it might suffice if the above fails.
    // Ideally the JSON approach should work 99% of the time.
    return [];
  }
};

export const serializeXSAC = (animations) => {
  if (!animations || !Array.isArray(animations) || animations.length === 0) {
    return "";
  }
  // Serialize each object and join with comma
  return animations.map(anim => JSON.stringify(anim)).join(",");
};
