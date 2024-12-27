let json = "";
let kotlinCode = "";

// File upload handler
document.querySelector(".file-input").addEventListener("change", () => {
    const fileInput = document.querySelector(".file-input");
    if (fileInput.files.length > 0) {
        const jsFile = fileInput.files[0];
        document.querySelector(".file-uploaded").classList.remove("hidden");
        document.querySelector(".file-name").textContent = jsFile.name;
        document.querySelector(".run-btn").classList.remove("hidden");

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                json = e.target.result;
                showPreview(json);
            } catch (error) {
                alert("File is not valid");
            }
        };
        reader.readAsText(jsFile);
    }
});

// Show JSON preview
function showPreview(json) {
    document.querySelector(".preview-container").classList.remove("hidden");
    document.querySelector(".preview").textContent = json;
}

// Generate Kotlin source code
document.querySelector(".run-btn").addEventListener("click", () => {
    if (!json || json === "") return;

    kotlinCode = generateKotlinCode(JSON.parse(json).model);
    document.querySelector(".result").innerHTML = `<pre>${kotlinCode}</pre>`;
    document.querySelector(".result-section").classList.remove("hidden");
});

function generateKotlinCode(model) {
    let code = "";
    model.forEach(cls => {
        if (cls.type === "class") {
            code += `class ${cls.class_name} {\n`;
            cls.attributes.forEach(attr => {
                code += `    var ${attr.attribute_name}: ${convertToKotlinType(attr.data_type)}? = null\n`;
            });
            code += `}\n\n`;
        }
        if (cls.type === "association") {
            code += `// Association: ${cls.name}\n`;
            code += `${cls.class[0].class_name} -> ${cls.class[1].class_name}\n\n`;
        }
    });
    return code;
}

function convertToKotlinType(dataType) {
    switch (dataType.toLowerCase()) {
        case "int": return "Int";
        case "string": return "String";
        case "boolean": return "Boolean";
        case "float": return "Float";
        default: return "Any";
    }
}

// Copy and Download Handlers
document.querySelector(".copy-btn").addEventListener("click", () => {
    if (kotlinCode !== "") {
        navigator.clipboard.writeText(kotlinCode);
        alert("Copied Kotlin code to clipboard");
    }
});

document.querySelector(".download-btn").addEventListener("click", () => {
    if (kotlinCode !== "") {
        const blob = new Blob([kotlinCode], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "result.kt";
        a.click();
        URL.revokeObjectURL(url);
    }
});

// Popup for Info and Help
function showPopup(type) {
    const popup = document.getElementById("popup");
    const title = document.getElementById("popup-title");
    const content = document.getElementById("popup-content");

    if (type === "info") {
        title.textContent = "About the Tool";
        content.textContent = "This tool converts JSON models (xtUML) into Kotlin source code.";
    } else if (type === "help") {
        title.textContent = "How to Use";
        content.innerHTML = `
            <ol>
                <li>Upload your JSON file using the button provided.</li>
                <li>Preview the structure of your JSON file.</li>
                <li>Generate Kotlin code by clicking 'Translate to Kotlin'.</li>
                <li>Copy or download the generated Kotlin code.</li>
            </ol>`;
    }

    popup.classList.remove("hidden");
}

function closePopup() {
    document.getElementById("popup").classList.add("hidden");
}
