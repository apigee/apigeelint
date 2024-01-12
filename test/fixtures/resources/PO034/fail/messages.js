// These are the error messages only for the failed policies.
module.exports = {
  "Remove-HeaderParams.xml": ["element <HeaderParams> is not allowed here."],
  "No-Actions.xml": [
    "This policy does nothing. there is no action element {Set, Copy, Remove, Add, AssignVariable}."
  ],
  "Set-Conditions.xml": ["element <Conditions> is not allowed here."],
  "Set-StrayElement.xml": ["element <StrayElement> is not allowed here."],
  "Copy-Remove.xml": ["element <Remove> is not allowed here."],
  "Add-No-Child.xml": ["there should be at least one child of <Add>."],
  "Set-No-Child.xml": ["there should be at least one child of <Set>."],
  "Set-FormParams-No-Text.xml": ["missing text value for element <FormParam>."],
  "Set-Verb-Empty.xml": ["missing text value for element <Verb>."],
  "Set-Verb-with-Child.xml": [
    "element <Something> is not allowed here.",
    "extraneous data in element <Verb>."
  ],
  "Set-Path-with-Child.xml": [
    "element <StrayElement> is not allowed here.",
    "extraneous data in element <Path>."
  ],
  "Set-Header-with-ref-attr.xml": [
    "incorrect attribute (ref) on element <Header>."
  ],
  "Set-Payload-No-Text.xml": ["missing text value for element <Payload>."],
  "toplevel-Stray.xml": ["element <Header> is not allowed here."],
  "Set-Headers-No-Child.xml": ["no <Header> under element <Headers>."],
  "Set-Headers-Junk-Child.xml": [
    "incorrect element <Junk> under element <Headers>."
  ],
  "Add-Verb.xml": ["element <Verb> is not allowed here."],
  "Multiple-Add.xml": ["extra <Add> element."],
  "Set-Header-no-name-attr.xml": [
    "missing name attribute on element <Header>."
  ],
  "Remove-Header-with-Text.xml": [
    "there should be no text or child elements under element <Header>."
  ],
  "Remove-Header-ref-attr.xml": [
    "incorrect attribute (ref) on element <Header>."
  ],
  "Remove-Header-missing-name-attr.xml": [
    "missing name attribute on element <Header>."
  ],
  "Remove-Payload-with-attr.xml": [
    "incorrect attribute (name) on element <Payload>."
  ],
  "Copy-with-multiple-attrs.xml": [
    "incorrect attribute (extraneous) on element <Copy>."
  ]
};
