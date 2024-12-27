// Event listeners
document.getElementById('fileInput').addEventListener('change', handleFileSelect, false);
document.getElementById('compileButton').addEventListener('click', function() {
    const jsonInput = document.getElementById('jsonDisplay').textContent;
    let jsonObj;
    try {
        jsonObj = JSON.parse(jsonInput);
    } catch (e) {
        alert('Invalid JSON format');
        return;
    }

    let rubyOutput = jsonToRuby(jsonObj);
    document.getElementById('rubyOutput').textContent = rubyOutput;
});

document.querySelectorAll('.btn button').forEach((button, index) => {
    if (index === 0) {
        button.addEventListener('click', () => downloadText('rubyOutput', 'output.rb'));
    } else if (index === 1) {
        button.addEventListener('click', () => copyToClipboard('rubyOutput'));
    }
});

// File handling functions
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

function downloadText(elementId = 'rubyOutput', filename = 'output.rb') {
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

function copyToClipboard(elementId = 'rubyOutput') {
    const element = document.getElementById(elementId);
    if (!element || !element.textContent.trim()) {
        alert('No content to copy. Please compile the JSON first.');
        return;
    }
    const text = element.textContent;
    navigator.clipboard.writeText(text)
        .then(() => alert('Text copied to clipboard successfully.'))
        .catch(() => alert('Failed to copy text to clipboard.'));
}

// Helper functions
function toSnakeCase(str) {
    return str.split(/(?=[A-Z])/).join('_').toLowerCase();
}

function toCamelCase(str) {
    return str.split('_')
        .map((word, index) => {
            if (index === 0) return word.toLowerCase();
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join('');
}

function toPascalCase(str) {
    return str.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}

function formatStateConstant(stateName) {
    return stateName.toUpperCase().replace(/ /g, '_');
}

// Code generation functions
function generateStateModule(allStates) {
    let stateGroups = {
        student: [],
        teacher: [],
        registration: [],
        test: []
    };

    // Group states by context
    allStates.forEach(state => {
        const stateValue = state.state_value;
        const stateName = formatStateConstant(state.state_name);
        
        if (stateGroups.student.every(s => s.value !== stateValue)) {
            stateGroups.student.push({ name: stateName, value: stateValue });
        }
    });

    let code = "module State\n";
    
    // Student states
    code += "  # Student states\n";
    stateGroups.student.forEach(state => {
        code += `  ${state.name} = "${state.value}"\n`;
    });

    code += "end\n\n";
    return code;
}

function generateClassMethods(states, className) {
    let code = '';
    if (states) {
        states.forEach(state => {
            if (state.state_event) {
                state.state_event.forEach(event => {
                    code += `  def ${event}\n`;
                    const stateRef = `State::${formatStateConstant(state.state_name)}`;
                    code += `    @status = ${stateRef}\n`;
                    code += "  end\n\n";
                });
            }
        });
    }
    return code;
}

function generateClass(entity, isAssociation = false) {
    const className = toPascalCase(entity.class_name);
    let code = `class ${className}\n`;
    
    // Generate attr_accessor
    const uniqueAttributes = [...new Set(entity.attributes.map(attr => attr.attribute_name))];
    code += "  attr_accessor :" + uniqueAttributes.join(', :') + "\n\n";
    
    // Generate initialize method
    code += "  def initialize\n";
    const processedAttributes = new Set();
    
    entity.attributes.forEach(attr => {
        if (processedAttributes.has(attr.attribute_name)) return;
        processedAttributes.add(attr.attribute_name);
        
        let defaultValue;
        switch (attr.data_type) {
            case 'integer':
                defaultValue = '0';
                break;
            case 'real':
                defaultValue = '0.0';
                break;
            case 'string':
                defaultValue = '""';
                break;
            case 'state':
                defaultValue = 'nil';
                break;
            default:
                defaultValue = 'nil';
        }
        code += `    @${attr.attribute_name} = ${defaultValue}\n`;
    });
    code += "  end\n\n";

    // Generate state-related methods
    if (!isAssociation && entity.states) {
        code += generateClassMethods(entity.states, className);
    }

    code += "end\n\n";
    return code;
}

function generateAssociationClass(association) {
    return generateClass(association.model, true);
}

// Main conversion function
function jsonToRuby(jsonObj) {
    let rubyCode = "";
    
    // Collect all states from all classes
    const allStates = jsonObj.model
        .filter(entity => entity.states)
        .flatMap(entity => entity.states);
    
    // Generate State module
    if (allStates.length > 0) {
        rubyCode += generateStateModule(allStates);
    }

    // Generate regular classes
    jsonObj.model.forEach(entity => {
        if (entity.type === 'class') {
            rubyCode += generateClass(entity);
        }
    });

    // Generate association classes
    jsonObj.model
        .filter(entity => entity.type === 'association' && entity.model)
        .forEach(association => {
            rubyCode += generateAssociationClass(association);
        });

    return rubyCode;
}
