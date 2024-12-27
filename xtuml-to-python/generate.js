class XTUMLToPythonParser {
    constructor() {
        this.data = {}; // Organisasi Data - Terpusat
    }

    // Fungsi utama untuk mem-parsing JSON ke Python xtUML
    parse(jsonInput) {
        try {
            const xtUMLData = JSON.parse(jsonInput);

            if (!this.validateJSON(xtUMLData)) {
                console.error("Invalid JSON input. Parsing aborted.");
                return null;
            }

            if (!xtUMLData.classes && !xtUMLData.relationships && xtUMLData.type !== "subsystem") {
                console.warn(
                    "JSON tidak memiliki 'classes', 'relationships', atau 'type: subsystem'. Tidak ada output yang dihasilkan."
                );
                return null;
            }

            return this.generatePythonFiles(xtUMLData);
        } catch (error) {
            console.error("Error parsing JSON:", error.message);
            return null;
        }
    }

    // Validasi JSON input untuk memastikan format sesuai
    validateJSON(data) {
        try {
            console.log("Validating JSON structure:", data);

            if (!data.classes && !data.relationships && data.type !== "subsystem") {
                throw new Error("JSON harus memiliki 'classes', 'relationships', atau 'type: subsystem'.");
            }

            if (Array.isArray(data.classes)) {
                this.validateClasses(data.classes);
            } else {
                console.warn("Tidak ada 'classes'. Menyediakan array kosong sebagai default.");
                data.classes = [];
            }

            if (Array.isArray(data.relationships)) {
                this.validateRelationships(data.relationships);
            } else {
                console.warn("Tidak ada 'relationships'. Menyediakan array kosong sebagai default.");
                data.relationships = [];
            }

            if (data.type === "subsystem" && Array.isArray(data.model)) {
                this.validateSubsystem(data.model);
            } else if (data.type === "subsystem") {
                console.warn("Tidak ada 'model' pada subsystem. Menyediakan array kosong sebagai default.");
                data.model = [];
            }

            console.log("JSON validation passed.");
            return true;
        } catch (error) {
            console.error("JSON validation error:", error.message);
            return false;
        }
    }

    validateClasses(classes) {
        classes.forEach((cls, index) => {
            cls.name = cls.class_name || cls.name || `DefaultClassName_${index}`;
            cls.attributes = Array.isArray(cls.attributes) ? cls.attributes : [];
            cls.methods = Array.isArray(cls.methods) ? cls.methods : [];
            cls.states = Array.isArray(cls.states) ? cls.states : [];
    
            if (cls.states.length > 0) {
                this.validateStates(cls.states);
            }
        });
    }
    
    validateStates(states) {
        states.forEach((state, index) => {
            state.state_name = state.state_name || `State_${index}`;
            state.state_event = Array.isArray(state.state_event) ? state.state_event : [];
            state.transitions = Array.isArray(state.transitions) ? state.transitions : [];
        });
    }    

    validateRelationships(relationships) {
        console.log("Validating 'relationships'...");
        relationships.forEach((rel, index) => {
            rel.type = rel.type || "association";
            rel.from = rel.from || `UnknownSource_${index}`;
            rel.to = rel.to || `UnknownTarget_${index}`;
            rel.multiplicity = rel.multiplicity || "1";

            console.warn(`Relasi pada indeks ${index} tidak lengkap. Memberikan nilai default.`);
        });
    }

    validateSubsystem(models) {
        console.log("Validating 'subsystem'...");
        models.forEach((item, index) => {
            if (!item.type) {
                throw new Error(`Elemen pada indeks ${index} di 'model' tidak valid. Harus memiliki 'type'.`);
            }

            switch (item.type) {
                case "class":
                    item.name = item.class_name || item.name || `DefaultClassName_${index}`;
                    item.attributes = Array.isArray(item.attributes) ? item.attributes : [];
                    item.methods = Array.isArray(item.methods) ? item.methods : [];
                    break;

                case "association":
                    item.from = item.from || `UnknownSource_${index}`;
                    item.to = item.to || `UnknownTarget_${index}`;
                    item.multiplicity = item.multiplicity || "1..*";
                    break;

                default:
                    console.warn(`Unknown model type '${item.type}' pada indeks ${index}.`);
            }
        });
    }

    generatePythonFiles(xtUMLData) {
        let combinedOutput = "";
        if (Array.isArray(xtUMLData.enums)) {
            xtUMLData.enums.forEach((enumDef) => {
                combinedOutput += this.generateEnumCode(enumDef) + "\n";
            });
        }
        if (Array.isArray(xtUMLData.classes)) {
            xtUMLData.classes.forEach((cls) => {
                combinedOutput += this.generateClassCode(cls) + "\n";
            });
        }

        if (Array.isArray(xtUMLData.relationships)) {
            combinedOutput += this.generateRelationshipsCode(xtUMLData.relationships) + "\n";
        }

        if (xtUMLData.type === "subsystem" && Array.isArray(xtUMLData.model)) {
            combinedOutput += this.generateSubsystemCode(xtUMLData.model) + "\n";
        }

        return this.optimizePythonCode(combinedOutput);
    }

    generateClassCode(classDefinition) {
        const className = classDefinition.name || "UndefinedClass";
        const parentClass = classDefinition.parent || "object";
        let classCode = `class ${className}(${parentClass}):\n`;
    
        // Inisialisasi atribut state
        const initialState = classDefinition.states?.[0]?.state_value || null;
        const hasState = initialState !== null;
    
        // Konstruktor
        classCode += `\n    def __init__(self, ${classDefinition.attributes
            .map((attr) => {
                if (typeof attr === "string") {
                    return `${attr}: str = None`;
                } else if (typeof attr === "object" && attr.attribute_name && attr.data_type) {
                    const pythonType = this.mapDataType(attr.data_type);
                    return `${attr.attribute_name}: Optional[${pythonType}] = None`;
                }
                return null;
            })
            .filter((attr) => attr !== null)
            .join(", ")}):\n`;
    
        classDefinition.attributes.forEach((attr) => {
            if (typeof attr === "string") {
                classCode += `        self.${attr} = ${attr}  # Set attribute ${attr}\n`;
            } else if (typeof attr === "object" && attr.attribute_name) {
                classCode += `        self.${attr.attribute_name} = ${attr.attribute_name}  # Set attribute ${attr.attribute_name}\n`;
            }
        });
    
        // Tambahkan atribut state jika ada
        if (hasState) {
            classCode += `        self.state = "${initialState}"  # Initial state\n`;
        }
    
        // State Transitions
        if (classDefinition.states) {
            classCode += `\n    # State Transitions\n`;
            classDefinition.states.forEach((state) => {
                state.state_event.forEach((event, index) => {
                    classCode += `    def ${event}(self):\n`;
                    const transition = state.transitions?.[index] || {};
                    classCode += `        if self.state == "${state.state_value}":\n`;
                    classCode += `            self.state = "${transition.target_state || state.state_value}"\n`;
                    classCode += `            # Logic for transition ${state.state_name} -> ${transition.target_state || state.state_name}\n\n`;
                });
            });
        }
    
        // Metode (jika ada)
        if (classDefinition.methods) {
            classCode += "\n";
            classDefinition.methods.forEach((method) => {
                classCode += `    def ${method}(self):\n        pass\n\n`;
            });
        }
    
        return classCode;
    }    
    generateEnumCode(enumDefinition) {
        const enumName = enumDefinition.name;
        const values = enumDefinition.values;
    
        let enumCode = `from enum import Enum\n\nclass ${enumName}(Enum):\n`;
        values.forEach((value) => {
            enumCode += `    ${value.toUpperCase()} = "${value}"\n`;
        });
    
        return enumCode;
    } 
    generateNestedClass(nestedClassName, attributes) {
        let nestedClassCode = `class ${nestedClassName}:\n\n    def __init__(self, ${attributes
            .map((attr) => `${attr.attribute_name}: Optional[${this.mapDataType(attr.data_type)}] = None`)
            .join(", ")}):\n`;
    
        attributes.forEach((attr) => {
            nestedClassCode += `        self.${attr.attribute_name} = ${attr.attribute_name}\n`;
        });
    
        this.generatedClasses.push(nestedClassCode); // Store nested class code for later use
    }
    generateRelationshipsCode(relationships) {
        let relationshipCode = `# Relationships\n`;
        relationships.forEach((rel) => {
            relationshipCode += `# ${rel.type}: ${rel.from} -> ${rel.to} [${rel.multiplicity}]\n`;
        });
    
        relationships.forEach((rel) => {
            const relClassName = `${rel.from}_${rel.to}_Relationship`;
            relationshipCode += `class ${relClassName}:\n`;
            relationshipCode += `    def __init__(self, source, target):\n`;
            relationshipCode += `        self.source = source\n`;
            relationshipCode += `        self.target = target\n`;
            relationshipCode += `\n`;
        });
    
        return relationshipCode;
    }
    

    generateSubsystemCode(models) {
        return models
            .map((model) => {
                if (model.type === "class") {
                    return this.generateClassCode(model);
                } else if (model.type === "association") {
                    return this.generateAssociationCode(model);
                }
                return `# Unknown model type: ${model.type}`;
            })
            .join("\n");
    }

    generateAssociationCode(associationDefinition) {
        let associationCode = `# Association: ${associationDefinition.name || "UnnamedAssociation"}\n`;

        // Jika asosiasi memiliki model berupa association_class
        if (associationDefinition.model && associationDefinition.model.type === "association_class") {
            associationCode += `class ${associationDefinition.model.class_name}:\n`;

            // Konstruktor dengan komentar inline
            associationCode += `\n    def __init__(self, **kwargs):\n`;
            (associationDefinition.model.attributes || []).forEach((attribute) => {
                const pythonType = this.mapDataType(attribute.data_type);
                associationCode += `        self.${attribute.attribute_name}: ${pythonType} = kwargs.get('${attribute.attribute_name}', None)\n`;
            });
        } else {
            // Jika bukan association_class
            associationCode += `    # General Association Information:\n`;
            associationCode += `    # - Source: ${associationDefinition.from || "UnknownSource"}\n`;
            associationCode += `    # - Target: ${associationDefinition.to || "UnknownTarget"}\n`;
            associationCode += `    # - Multiplicity: ${associationDefinition.multiplicity || "1..1"}\n`;
        }

        return associationCode.trim();
    }

    mapDataType(dataType) {
        if (!dataType || typeof dataType !== "string") {
            console.warn("Data type undefined or invalid, defaulting to 'Optional'.", dataType);
            return "Optional";
        }
        const typeMapping = {
            string: "str",
            integer: "int",
            float: "float",
            boolean: "bool",
            datetime: "datetime.datetime",
            id: "str",
            state: "str",
            real: "float",
            list: "List",
            object: "dict",
            tuple: "Tuple",
            enum: "Enum",
            union: "Union"
        };
        if (dataType.startsWith("list<")) {
            const innerType = dataType.match(/list<(.+)>/)[1];
            return `List[${this.mapDataType(innerType)}]`;
        }
        if (dataType.startsWith("tuple<")) {
            const innerTypes = dataType.match(/tuple<(.+)>/)[1].split(",");
            return `Tuple[${innerTypes.map((t) => this.mapDataType(t.trim())).join(", ")}]`;
        }
        return typeMapping[dataType.toLowerCase()] || "Optional";
    }
        optimizePythonCode(code) {
        return code.trim();
    }
}

if (typeof module !== "undefined") {
    module.exports = XTUMLToPythonParser;
}
