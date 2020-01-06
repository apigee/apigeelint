/**
 * @fileoverview pdf style formatter.
 * @author Eduardo Andrade
 */
"use strict";

const path = require('path');
const fonts = {
  Roboto: {
    normal: path.join(__dirname, 'fonts/roboto.regular.ttf'),
    bold: path.join(__dirname, 'fonts/roboto.bold.ttf'),
    italics: path.join(__dirname, 'fonts/roboto.italic.ttf'),
    bolditalics: path.join(__dirname, 'fonts/roboto.bold-italic.ttf')
  }
};

var PdfPrinter = require('pdfmake'),
  printer = new PdfPrinter(fonts),
  fs = require('fs'),
  pluralize = require("pluralize");

//------------------------------------------------------------------------------
// Helper Functions
//------------------------------------------------------------------------------

/**
 * Returns a canonical error level string based upon the error message passed in.
 * @param {Object} message Individual error message provided by eslint
 * @returns {string} Error level string
 */
function getMessageType(message) {
  if (message.fatal || message.severity === 2) {
      return "Error";
  }
  return "Warning";
}


//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

module.exports = function(results) {

  let output = "",
    errorCount = 0,
    warningCount = 0;

  var dd = {
    content: [],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      subheader: {
        fontSize: 16,
        bold: true,
        margin: [0, 10, 0, 5]
      },
      tableExample: {
        margin: [0, 5, 0, 15]
      },
      tableHeader: {
        bold: true,
        fontSize: 13,
        color: 'black'
      }
    },
    defaultStyle: {
      // alignment: 'justify'
    }
  };

  results.forEach(result => {
    const messages = result.messages;
    errorCount += result.errorCount;
    warningCount += result.warningCount;

    if (messages.length > 0) {
      var tempContent = { table: { body: [] } };
      dd.content.push({text: result.filePath});
      tempContent.table.body.push(["Line", "Column", "Type", "Message", "Rule ID"]);
      messages.forEach(message => {
        tempContent.table.body.push([message.line || 0, message.column || 0, getMessageType(message), message.message, message.ruleId || ""]);
      });
      dd.content.push(tempContent);
    }
    
  });

  var tempContent = { table: { body: [] } };
  dd.content.push({text: "Summary"});
  tempContent.table.body.push([pluralize("Error", errorCount, true)]);
  tempContent.table.body.push([pluralize("Warning", warningCount, true)]);
  dd.content.push(tempContent);

  var pdfDoc = printer.createPdfKitDocument(dd);
  var fileName = geReportFilePath();
  pdfDoc.pipe(fs.createWriteStream(fileName));
  pdfDoc.end();
  
  output = pluralize("Error", errorCount, true) + " / " + pluralize("Warning", warningCount, true) + " - Report exported as a pdf file: " + fileName;
  return output;
};

function geReportFilePath() {
  var fileName = "apigeelint-report.pdf"; //default file name
  try {
    var reportPath = process.argv[process.argv.length - 1];
    if (reportPath && reportPath.endsWith(".pdf")) {
      var reportDir = path.dirname(reportPath);
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }
      fileName = reportPath
    }
  } catch(err) {
    console.error(err)
  }
  return fileName;
}
