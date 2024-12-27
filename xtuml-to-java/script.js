// scripts.js

// Fungsi untuk membaca file JSON
function readFileJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result);
        resolve(json);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => {
      reject(new Error("Gagal membaca file"));
    };
    reader.readAsText(file);
  });
}

function translateJSONToJava(json) {
  const javaCode = [];
  const classes = json.model;

  classes.forEach((classItem) => {
    if (classItem.type === "class") {
      const className = classItem.class_name;
      const attributes = classItem.attributes || [];
      const states = classItem.states || [];
      const attributeSet = new Set(); // Untuk melacak atribut
      const methodSet = new Set(); // Untuk melacak metode

      javaCode.push(`public class ${capitalize(className)} {`);
      javaCode.push("  // Atribut");

      attributes.forEach((attribute) => {
        const attributeName = attribute.attribute_name;
        let dataType = attribute.data_type;

        // Ubah tipe data
        dataType = mapDataType(dataType);

        if (attributeName && !attributeSet.has(attributeName)) {
          attributeSet.add(attributeName);

          javaCode.push(`  private ${dataType} ${attributeName};`);
          const methodName = capitalize(attributeName);

          // Setter
          if (!methodSet.has(`set${methodName}`)) {
            methodSet.add(`set${methodName}`);
            javaCode.push(`  public void set${methodName}(${dataType} ${attributeName}) {`);
            javaCode.push(`    this.${attributeName} = ${attributeName};`);
            javaCode.push("  }");
          }

          // Getter
          if (!methodSet.has(`get${methodName}`)) {
            methodSet.add(`get${methodName}`);
            javaCode.push(`  public ${dataType} get${methodName}() {`);
            javaCode.push(`    return this.${attributeName};`);
            javaCode.push("  }");
          }

          javaCode.push(""); // Spasi antar metode
        }
      });

      javaCode.push("  // Konstruktor");
      javaCode.push(`  public ${capitalize(className)}() {`);
      javaCode.push("  }");
      javaCode.push("");

      if (states.length > 0) {
        javaCode.push("  // State");
        states.forEach((state) => {
          const stateName = state.state_name;
          if (stateName) {
            const cleanStateName = cleanJavaName(stateName);
            if (!methodSet.has(`setState${cleanStateName}`)) {
              methodSet.add(`setState${cleanStateName}`);
              javaCode.push(`  public void setState${cleanStateName}() {`);
              javaCode.push("    // Implementasi kode di sini");
              javaCode.push("  }");
              javaCode.push("");
            }
          }
        });
      }

      javaCode.push("}");
      javaCode.push(""); // Spasi antar kelas
    }
  });

  return javaCode.join("\n");
}

function mapDataType(dataType) {
  const typeMapping = {
    id: "int",
    state: "String",
    inst_ref: "Object",
    inst_ref_set: "Object",
    "inst_ref_<timer>": "Object",
    string: "String",
    integer: "int",
    real: "double",
  };
  return typeMapping[dataType] || "Object";
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function cleanJavaName(name) {
  // Hapus spasi dan karakter tidak valid, lalu buat PascalCase
  return name
    .replace(/[^a-zA-Z0-9]/g, " ") // Ganti karakter tidak valid dengan spasi
    .split(" ") // Pisah berdasarkan spasi
    .map(capitalize) // Ubah setiap kata menjadi kapital
    .join(""); // Gabungkan kembali tanpa spasi
}

// Event listener untuk input file
document.getElementById("fileInput").addEventListener("change", () => {
  const fileInput = document.getElementById("fileInput");
  const jsonInput = document.getElementById("jsonInput");

  if (fileInput.files.length > 0) {
    readFileJSON(fileInput.files[0])
      .then((json) => {
        jsonInput.value = JSON.stringify(json, null, 2);
      })
      .catch((error) => {
        console.error(error);
      });
  }
});

// Event listener untuk tombol translate
document.getElementById("translateButton").addEventListener("click", () => {
  const jsonInput = document.getElementById("jsonInput");
  const javaOutput = document.getElementById("javaOutput");

  try {
    const json = JSON.parse(jsonInput.value);
    const javaCode = translateJSONToJava(json);
    javaOutput.value = javaCode;
  } catch (error) {
    console.error(error);
  }
});

// Event listener untuk tombol salin
document.getElementById("copyButton").addEventListener("click", () => {
  const javaOutput = document.getElementById("javaOutput");
  navigator.clipboard.writeText(javaOutput.value);
  alert("Berhasil disalin!");
});

// Event listener untuk tombol download
document.getElementById("downloadButton").addEventListener("click", () => {
  const fileInput = document.getElementById("fileInput");
  const javaOutput = document.getElementById("javaOutput");

  let fileName;
  if (fileInput.files.length > 0) {
    fileName = fileInput.files[0].name.replace(".json", ".java");
  } else {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();
    fileName = `generated_java_${year}${month}${day}${hour}${minute}${second}.java`;
  }

  const blob = new Blob([javaOutput.value], { type: "text/java" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
});
