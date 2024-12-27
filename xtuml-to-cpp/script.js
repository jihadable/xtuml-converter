document.querySelector(".info").addEventListener("click", () => {
    alert("This program is built to assist software developers and system designers in converting xtUML (Executable UML) models written in JSON format into valid C++ code.\nIt simplifies the process of transitioning from model-based designs to actual implementations, ensuring consistency and efficiency.")
})

document.querySelector(".help").addEventListener("click", () => {
    alert('1. Click the "Choose File" button to select a JSON file from your computer.\n2. Click the "Translate" button to generate the corresponding C++ code.\n3. The JSON content will appear on the left, and the generated C++ code will appear on the right.')
})

function handleFile() {
    const fileInput = document.getElementById('fileInput');
    const jsonInput = document.getElementById('jsonInput');
    const cppOutput = document.getElementById('cppOutput');

    const file = fileInput.files[0];
    if (!file) {
        alert("Please upload a JSON file first.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const jsonData = JSON.parse(event.target.result);
            jsonInput.value = JSON.stringify(jsonData, null, 4);
            const cppCode = generateCppCode(jsonData);
            cppOutput.value = cppCode;
        } catch (error) {
            alert("Error parsing JSON file: " + error.message);
        }
    };
    reader.readAsText(file);
}

// Function to convert JSON data to C++ code
function generateCppCode(jsonData) {
    let cppCode = '';

    if (jsonData.type === 'subsystem') {
        cppCode += `// Subsystem: ${jsonData.sub_name}\n\n`;

        jsonData.model.forEach((model) => {
            if (model.type === 'class') {
                cppCode += `class ${model.class_name} {\npublic:\n`;
                model.attributes.forEach((attr) => {
                    cppCode += `    ${attr.data_type} ${attr.attribute_name};\n`;
                });

                if (model.states) {
                    cppCode += "\n    // States\n    enum class State {\n";
                    model.states.forEach((state) => {
                        cppCode += `        ${state.state_value}, // ${state.state_name}\n`;
                    });
                    cppCode += "    };\n";

                    model.states.forEach((state) => {
                        state.state_event.forEach((event) => {
                            cppCode += `    void ${event}(); // Event for state: ${state.state_name}\n`;
                        });
                    });
                }

                cppCode += "};\n\n";
            }
        });
    } else {
        cppCode = "// Invalid JSON format for xtUML subsystem.";
    }

    return cppCode;
}