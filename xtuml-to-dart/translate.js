function translateToDart(model) {
  let output = '';

  if (model.type === 'subsystem') {
    output += `// Subsystem: ${model.sub_name}\n`;

    model.model.forEach((item) => {
      if (item.type === 'class') {
        output += `class ${item.class_name} {\n`;

        // Tambahkan atribut
        item.attributes.forEach((attr) => {
          output += `  ${mapDataType(attr.data_type)} ${attr.attribute_name};\n`;
        });

        output += `\n  ${item.class_name}();\n`;

        // Tambahkan state
        if (item.states) {
          item.states.forEach((state) => {
            output += `\n  // State: ${state.state_name} (${state.state_value})\n`;
            output += `  String ${state.state_name};\n`;
          });
        }

        // Tambahkan event untuk setiap state
        if (item.states) {
          item.states.forEach((state) => {
            if (state.state_event) {
              state.state_event.forEach((event) => {
                output += `  // Event: ${event} for state: ${state.state_name}\n`;
                output += `  void ${event}() {\n    // Event handling logic\n  }\n`;
              });
            }
          });
        }

        output += `}\n\n`;
      }

      // Handle Association
      else if (item.type === 'association') {
        output += `// Association: ${item.name}\n`;
        
        item.class.forEach((associationClass) => {
          output += `class ${associationClass.class_name} {\n`;

          // Atribut untuk kelas asosiasi
          if (item.model && item.model.attributes) {
            item.model.attributes.forEach((attr) => {
              output += `  ${mapDataType(attr.data_type)} ${attr.attribute_name};\n`;
            });
          }

          output += `}\n\n`;
        });
      }
    });
  }

  return output;
}

function mapDataType(dataType) {
  switch (dataType) {
    case 'id':
      return 'String';
    case 'string':
      return 'String';
    case 'integer':
      return 'int';
    case 'real':
      return 'double';
    case 'state':
      return 'String';
    case 'inst_event':
      return 'dynamic'; // Event
    case 'referential_attribute':
      return 'String'; // For ID references
    case 'naming_attribute':
      return 'String'; // Naming attributes
    default:
      return 'dynamic';
  }
}
