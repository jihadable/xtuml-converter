document.getElementById('fileInput').addEventListener('change', handleFileSelect, false);
document.getElementById('compileButton').addEventListener('click', function() {
    const jsonInput = document.getElementById('jsonDisplay').textContent;
    let jsonObj;
    try {
        jsonObj = JSON.parse(jsonInput);
    } catch (e) {
        alert('JSON tidak valid');
        return;
    }

    let cOutput = jsonToC(jsonObj);
    document.getElementById('cOutput').textContent = cOutput;
});

document.querySelectorAll('.btn button').forEach((button, index) => {
    if (index === 0) {
        button.addEventListener('click', () => downloadText('cOutput', 'output.c'));
    } else if (index === 1) {
        button.addEventListener('click', () => copyToClipboard('cOutput'));
    }
});

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const jsonInput = e.target.result;
            document.getElementById('jsonDisplay').textContent = jsonInput;
        };
        reader.readAsText(file);
    }
}

function downloadText(elementId = 'cOutput', filename = 'output.c') {
    const element = document.getElementById(elementId);
    if (!element || !element.textContent.trim()) {
        alert('No content to download. Please compile the JSON first.');
        return;
    }
    const text = element.textContent;
    const blob = new Blob([text], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}

function copyToClipboard(elementId = 'cOutput') {
    const element = document.getElementById(elementId);
    if (!element || !element.textContent.trim()) {
        alert('No content to copy. Please compile the JSON first.');
        return;
    }
    const text = element.textContent;
    navigator.clipboard.writeText(text).then(() => {
        alert('Text copied to clipboard successfully.');
    }).catch(() => {
        alert('Failed to copy text to clipboard.');
    });
}

function jsonToC(jsonObj) {
    let cCode = "#include <stdio.h>\n#include <string.h>\n\n";
    
    // Adding State enum at the beginning
    cCode += "// Enum for State\n";
    cCode += "typedef enum {\n";
    cCode += "    ACTIVE,\n";
    cCode += "    INACTIVE\n";
    cCode += "} State;\n\n";

    function generateEnum(enumName, values) {
        cCode += `// Enum for ${enumName}\n`;
        cCode += `typedef enum {\n`;
        values.forEach((value, index) => {
            cCode += `    ${value.toUpperCase()}${index < values.length - 1 ? ',' : ''}\n`;
        });
        cCode += `} ${enumName};\n\n`;
    }

    function generateStruct(structName, fields) {
        cCode += `// Struct for ${structName}\n`;
        cCode += `typedef struct {\n`;
        fields.forEach(field => {
            if (field.type === "char") {
                cCode += `    char ${field.name}[50];\n`;
            } else {
                cCode += `    ${field.type} ${field.name};\n`;
            }
        });
        cCode += `} ${structName};\n\n`;
    }

    function generateInitializer(structName, fields) {
        cCode += `// Example initializer for ${structName}\n`;
        cCode += `void init_${structName}(${structName} *obj) {\n`;
        fields.forEach(field => {
            if (field.type.includes("char")) {
                cCode += `    strcpy(obj->${field.name}, "default");\n`;
            } else if (field.type === "int") {
                cCode += `    obj->${field.name} = 0;\n`;
            } else if (field.type === "float") {
                cCode += `    obj->${field.name} = 0.0;\n`;
            } else if (field.type === "State") {
                cCode += `    obj->${field.name} = ACTIVE;\n`;
            } else {
                cCode += `    obj->${field.name} = NULL;\n`;
            }
        });
        cCode += `}\n\n`;
    }

    if (jsonObj.states) {
        generateEnum('State', jsonObj.states.map(state => state.state_name));
    }

    if (jsonObj.model) {
        jsonObj.model.forEach(entity => {
            if (entity.type === 'class') {
                const fields = entity.attributes.map(attr => {
                    let type;
                    switch (attr.data_type) {
                        case 'integer':
                            type = 'int';
                            break;
                        case 'real':
                            type = 'float';
                            break;
                        case 'string':
                            type = 'char';
                            break;
                        case 'boolean':
                            type = 'int'; // boolean: 0 = false, 1 = true
                            break;
                        case 'state':
                            type = 'State';
                            break;
                        default:
                            type = 'void*';
                            break;
                    }
                    return { type, name: attr.attribute_name };
                });

                // Filter out redundant fields
                const filteredFields = fields.filter(field => field.name !== 'nama_fasilitas' && field.name !== 'nama_peminatan');

                generateStruct(entity.class_name, filteredFields);
                generateInitializer(entity.class_name, filteredFields);
            }
        });
    }

    cCode += `int main() {\n`;
    if (jsonObj.model) {
        jsonObj.model.forEach(entity => {
            if (entity.type === 'class') {
                cCode += `    ${entity.class_name} ${entity.class_name.toLowerCase()};\n`;
                cCode += `    init_${entity.class_name}(&${entity.class_name.toLowerCase()});\n`;
            }
        });
    }
    cCode += `    printf("Structs initialized successfully.\\n");\n`;
    cCode += `    return 0;\n`;
    cCode += `}\n`;

    return cCode;
}
