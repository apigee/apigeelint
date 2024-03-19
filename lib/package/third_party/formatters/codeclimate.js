/**
 * @fileoverview CodeClimate Reporter
 * @author ipierre1
 */
"use strict";
const crypto = require('crypto');

/**
 * Returns the severity of warning or error
 * @param {Object} message message object to examine
 * @returns {string} severity level
 * @private
 */
function getMessageType(message) {
    if (message.fatal || message.severity === 2) {
        return "major";
    } else if (message.severity === 1) {
        return "minor";
    } else {
        return "info";
    }
}

/**
 * Generates a fingerprint for the issue based on its properties
 * @param {Object} issue issue object
 * @returns {string} fingerprint
 * @private
 */
function generateFingerprint(issue) {
    const data = `${issue.check_name}-${issue.location.path}-${issue.location.lines.begin}`;
    return crypto.createHash('md5').update(data).digest('hex');
}

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

module.exports = function(results) {

    let output = [];

    results.forEach(result => {

        const messages = result.messages;

        messages.forEach(message => {
            const type = getMessageType(message);

            const issue = {
                "type": "issue",
                "check_name": message.ruleId || "unknown_rule",
                "description": message.message || "",
                "categories": ["lint"],
                "location": {
                    "path": result.filePath,
                    "lines": {
                        "begin": message.line || 0
                    }
                },
                "fingerprint": generateFingerprint({
                    "check_name": message.ruleId || "unknown_rule",
                    "location": {
                        "path": result.filePath,
                        "lines": {
                            "begin": message.line || 0
                        }
                    }
                }),
                "severity": type
            };

            output.push(issue);
        });

    });

    return JSON.stringify(output, null, 2);
};