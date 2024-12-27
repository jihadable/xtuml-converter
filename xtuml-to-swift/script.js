// Elements
const importButton = document.getElementById("importButton");
const translateButton = document.getElementById("translateButton");
const copyButton = document.getElementById("copyButton");
const saveButton = document.getElementById("saveButton");
const resetButton = document.getElementById("resetButton");

const xtumlCodeArea = document.getElementById("xtumlCode");
const swiftCodeArea = document.getElementById("swiftCode");

// Variables
let xtumlContent = null;
let swiftContent = "";

// Import File
importButton.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    xtumlContent = JSON.parse(reader.result);
                    xtumlCodeArea.value = JSON.stringify(xtumlContent, null, 2);
                    xtumlCodeArea.disabled = false;

                    // Enable Translate and Reset buttons
                    translateButton.disabled = false;
                    resetButton.disabled = false;
                } catch (error) {
                    alert("Invalid JSON file!");
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
});

// Translate xtUML to Swift
translateButton.addEventListener("click", () => {
    if (!xtumlContent) {
        alert("No valid xtUML content found. Please import a JSON file.");
        return;
    }

    // Translate Classes
    const swiftClasses = xtumlContent.model
        .filter((item) => item.type === "class")
        .map((cls) => {
            const className = cls.class_name;
            const attributes = cls.attributes.map(
                (attr) => `    var ${attr.attribute_name}: ${translateType(attr.data_type)}`
            );

            // Initializer
            const initParams = cls.attributes
                .map((attr) => `${attr.attribute_name}: ${translateType(attr.data_type)}`)
                .join(", ");
            const initBody = cls.attributes
                .map((attr) => `        self.${attr.attribute_name} = ${attr.attribute_name}`)
                .join("\n");

            return `
class ${className} {
${attributes.join("\n")}

    init(${initParams}) {
${initBody}
    }
}`;
        })
        .join("\n\n");

    // Combine all Swift code
    swiftContent = swiftClasses;
    swiftCodeArea.value = swiftContent;
    swiftCodeArea.disabled = false;

    // Enable Copy and Save buttons
    copyButton.disabled = false;
    saveButton.disabled = false;
});

// Copy Swift Code to Clipboard
copyButton.addEventListener("click", () => {
    navigator.clipboard.writeText(swiftContent)
        .then(() => alert("Swift code copied to clipboard!"))
        .catch(() => alert("Failed to copy code."));
});

// Save Swift Code to File
saveButton.addEventListener("click", () => {
    const blob = new Blob([swiftContent], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "converted.swift";
    link.click();
});

// Reset App
resetButton.addEventListener("click", () => {
    xtumlContent = null;
    swiftContent = "";
    xtumlCodeArea.value = "";
    swiftCodeArea.value = "";

    xtumlCodeArea.disabled = true;
    swiftCodeArea.disabled = true;

    translateButton.disabled = true;
    copyButton.disabled = true;
    saveButton.disabled = true;
    resetButton.disabled = true;
});

// Helper function to translate data types
function translateType(dataType) {
    switch (dataType) {
        case "string":
            return "String";
        case "integer":
            return "Int";
        case "real":
            return "Double";
        case "id":
            return "UUID";
        case "state":
            return "String"; // States can be enums if needed
        default:
            return "Any";
    }
}
