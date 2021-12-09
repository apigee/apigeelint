// These are the error messages only for the failed policies.
module.exports = {
  "Cache-Populate-Multiple-children.xml" : "multiple children of ExpirySettings",
  "Cache-Populate-Duplicate-Timeout.xml" : "extraneous TimeoutInSeconds element",
  "Cache-Populate-Empty-Expiry.xml" : "missing child of ExpirySettings",
  "Cache-Populate-No-Expiry.xml" : "found no ExpirySettings element",
  "Cache-Populate-TimeoutInSec.xml" : "TimeoutInSec is deprecated; use TimeoutInSeconds",
  "Cache-Populate-Too-Long.xml" : "value for TimeoutInSeconds is too long",
  "Cache-Populate-Multiple-Expiry.xml": "extraneous ExpirySettings element",
  "Cache-Populate-InvalidExpiryDate.xml": "seems like an invalid date format in ExpiryDate"
};
