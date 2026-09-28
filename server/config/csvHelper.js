const fs = require('fs');

/**
 * Parses a CSV file into an array of objects.
 * Handles quoted values, commas inside quotes, escaped quotes, and newlines.
 * @param {string} filePath - Absolute path to the CSV file
 * @returns {Array<Object>} - Parsed records
 */
function parseCSV(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`CSV file not found at: ${filePath}`);
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  if (!content || !content.trim()) {
    return [];
  }

  // Tokenize the whole CSV preserving quoted multi-line fields
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (char === '"') {
      if (inQuotes && content[i + 1] === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && content[i + 1] === '\n') {
        i++;
      }
      currentRow.push(currentField.trim());
      currentField = '';
      if (currentRow.some((field) => field.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  // Push the final field and row if any
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((field) => field.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => h.trim().replace(/^"|"$/g, ''));
  const records = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const record = {};
    headers.forEach((header, idx) => {
      let val = row[idx] !== undefined ? row[idx] : '';
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      record[header] = val;
    });
    records.push(record);
  }

  return records;
}

module.exports = { parseCSV };
