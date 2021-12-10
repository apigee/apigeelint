// These are the error messages only for the failed policies.
module.exports = {
  "AM-RedundantHeader.xml" : "redundant Header element. Set/Payload already specifies the content-type.",
  "AM-Missing-ContentType.xml" : "Neither @contentType attribute nor a Header[@name='content-type'] has been defined.",
  "AM-RedundantPayload.xml" : "extraneous Set/Payload element"
};
