// Handle file upload and display file content
document.getElementById('upload').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        document.getElementById('file-content').textContent = e.target.result;
      };
      reader.readAsText(file);
    }
  });
  
  // Handle translation of JSON to Dart
  document.getElementById('translate').addEventListener('click', function() {
    const fileContent = document.getElementById('file-content').textContent;
    if (!fileContent || fileContent === 'No file uploaded yet.') {
      alert('Please upload a valid xtUML model file first!');
      return;
    }
  
    try {
      const model = JSON.parse(fileContent);
      const translatedCode = translateToDart(model); // Assuming you have this function
      document.getElementById('output').textContent = translatedCode;
    } catch (error) {
      alert('Failed to parse the uploaded file. Please ensure it is valid JSON.');
    }
  });
  
  // Handle copying of Dart code
  document.getElementById('copy-button').addEventListener('click', function() {
    const dartCode = document.getElementById('output').textContent;
    if (!dartCode) {
      alert('No Dart code to copy!');
      return;
    }
  
    const tempTextArea = document.createElement('textarea');
    tempTextArea.value = dartCode;
    document.body.appendChild(tempTextArea);
    tempTextArea.select();
    document.execCommand('copy');
    document.body.removeChild(tempTextArea);
  
    alert('Dart code copied to clipboard!');
  });
  
  // Show alert for Info (i)
  document.getElementById('info').addEventListener('click', function() {
    alert('Info (i): This tool translates xtUML models into Dart code. It generates attributes, states, and associations in Dart.');
  });
  
  // Show alert for How (?)
  document.getElementById('how').addEventListener('click', function() {
    alert('How (?):\n1. Upload a JSON file containing an xtUML model.\n2. Click "Translate to Dart" to generate the Dart code.\n3. Copy or download the generated Dart code.');
  });
  