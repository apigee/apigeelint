// These are the error messages only for the failed policies.
module.exports = {
  "t1-two-SSLInfos-with-URL.xml":
    "TargetEndpoint HTTPTargetConnection has more than one SSLInfo",

  "t2-missing-SSLInfo-with-URL.xml":
    "TargetEndpoint HTTPTargetConnection is missing SSLInfo configuration",

  "t3-one-SSLInfo-with-insecure-url.xml":
    "SSLInfo should not be used with an insecure http url",

  "t4-two-SSLInfos-with-LoadBalancer.xml":
    "TargetEndpoint HTTPTargetConnection has more than one SSLInfo",
};
