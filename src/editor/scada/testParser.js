
import { parseXSAC, serializeXSAC } from './xsacParser.js';

const test = () => {
    // Case 1: Single object
    const input1 = '{"attr":"color","list":[]}';
    const res1 = parseXSAC(input1);
    console.log("Test 1 (Single):", res1.length === 1 && res1[0].attr === "color" ? "PASS" : "FAIL", res1);

    // Case 2: Multiple objects
    const input2 = '{"attr":"color"}, {"attr":"get"}';
    const res2 = parseXSAC(input2);
    console.log("Test 2 (Multiple):", res2.length === 2 && res2[1].attr === "get" ? "PASS" : "FAIL", res2);

    // Case 3: Serialize
    const output = serializeXSAC(res2);
    // Note: serialization might remove spaces, so strictly equal might fail if spacing differs.
    // JSON.stringify usually doesn't add spaces.
    console.log("Test 3 (Serialize):", output.includes('"attr":"color"') && output.includes('"attr":"get"') && output.includes(',') ? "PASS" : "FAIL", output);

    // Case 4: KNH2 Example
    const input4 = '{"attr":"color","list":[{"data":"-99999","param":"-cor-11|","tag":"%n"},{"data":"200","param":"-cor-23|","tag":"%n"}]}, {"align":"Right","attr":"get","tag":"%n","type":"Good"}';
    const res4 = parseXSAC(input4);
    console.log("Test 4 (Complex):", res4.length === 2 ? "PASS" : "FAIL", res4);
};

test();
