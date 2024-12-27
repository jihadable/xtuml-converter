document.querySelector(".how-to").addEventListener("click", () => {
    alert(`1. Upload json file\n2. Press the "Translate to Javascript button"\n3. The resulting code in Javascript will appear on the screen.`)
})

document.querySelector(".info").addEventListener("click", () => {
    alert("This software is used to translate xtUML into code in Javascript language.")
})

const fileInput = document.querySelector(".file-input input")
let json = ""
let code = ""

fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
        const jsFile = fileInput.files[0]

        document.querySelector(".file-uploaded").innerHTML = `📄${jsFile.name}`
        document.querySelector(".file-input label").style.display = "none"
        document.querySelector(".run-btn").style.display = "flex"

        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                json = e.target.result
                showPreview(json)
            } catch (error) {
                alert("File js tidak valid")
            }
        }

        reader.readAsText(jsFile)
    }
})

function showPreview(json){
    document.querySelector(".preview-container").style.display = "flex"
    document.querySelector(".preview").innerHTML = `<pre>${json}</pre>`
}

const runBtn = document.querySelector(".run-btn")
const result = document.querySelector(".result")

runBtn.addEventListener("click", () => {
    if (json == "") return

    code = generateSourceCode(JSON.parse(json).model)

    result.innerHTML = `<pre>${code}</pre>`
    document.querySelector(".result-section").style.display = "flex"
})

function generateSourceCode(model) {
    let code = ""

    model.forEach(cls => {
        // class
        if (cls.type == "class"){
            code += `// class\n`
            code += `class ${cls.class_name} {\n`
            code += `  constructor(${cls.attributes.map(attr => attr.attribute_name).join(', ')}) {\n`
    
            cls.attributes.forEach(attr => {
                code += `    this.${attr.attribute_name} = ${attr.attribute_name}\n`
            })
    
            code += `  }\n\n`
    
            if (cls.states){
                cls.states.forEach(state => {
                    state.state_event.forEach(event => {
                        code += `  ${event}() {\n`
                        code += `    this.status = "${state.state_value}"\n`
                        code += `  }\n\n`
                    })
                })
            }
    
            code += `}\n\n`
        }
        // association
        else if (cls.type == "association"){
            if (cls.model){
                cls = cls.model

                code += `// association class\n`
                code += `class ${cls.class_name} {\n`
                code += `  constructor(${cls.attributes.map(attr => attr.attribute_name).join(', ')}) {\n`
        
                cls.attributes.forEach(attr => {
                    code += `    this.${attr.attribute_name} = ${attr.attribute_name}\n`
                })
        
                code += `  }\n\n`
        
                if (cls.states){
                    cls.states.forEach(state => {
                        state.state_event.forEach(event => {
                            code += `  ${event}() {\n`
                            code += `    this.status = "${state.state_value}"\n`
                            code += `  }\n\n`
                        })
                    })
                }
        
                code += `}\n\n`
            }
        }
    })

    return code
}

// copy sourcecode
const copyBtn = document.querySelector(".copy-btn")

copyBtn.addEventListener("click", () => {
    if (code != ""){
        navigator.clipboard.writeText(code)
    
        alert("Copied source code")
    }
})

// download js file
const downloadBtn = document.querySelector(".download-btn")

downloadBtn.addEventListener("click", () => {
    if (code != ""){
        const blob = new Blob([code], { type: "text/javascript" })
    
        const url = URL.createObjectURL(blob)
    
        const a = document.createElement("a")
        a.href = url
        a.download = "result.js"
    
        a.click()
    
        URL.revokeObjectURL(url)
    }
})