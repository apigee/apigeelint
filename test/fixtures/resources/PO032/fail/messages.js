// These are the error messages only for the failed policies.
module.exports = {
  "AllowHeaders-Misformatted.xml" : "The value in the AllowHeaders element is misformatted.",
  "AllowHeaders-Duplicated.xml" : "extraneous AllowHeaders element",
  "AllowCredentials-Duplicated.xml" : "extraneous AllowCredentials element",
  "AllowOrigin-Origin-ends-with-slash.xml" : "The Origin should not end with a slash.",
  "AllowOrigin-Wildcard.xml" : "using a wildcard for AllowOrigins defeats the purpose of CORS.",
  "AllowMethods-Duplicated.xml": "extraneous AllowMethods element",
  "AllowMethods-Misformatted.xml" : "The value in the AllowMethods element is misformatted.",
  "AllowMethods-missing-value.xml" : "missing value for AllowMethods element.",
  "AllowOrigin-Multiple-with-Wildcard.xml": "do not use a wildcard for AllowOrigins as well as other specific origins.",
  "AllowOrigin-request-header-origin.xml" : "Using {request.header.origin} in AllowOrigins defeats the purpose of CORS.",
  "AllowCredentials-invalid-value.xml" : "invalid value for AllowCredentials element.",
  "AllowCredentials-missing-value.xml" : "missing value for AllowCredentials element.",
  "ExposeHeaders-Dupe.xml" : "extraneous ExposeHeaders element"
};
