// These are the error messages only for the failed policies.
module.exports = {
  "gjwt-IssuedAt.xml": ["element <IssuedAt> is not allowed here."],
  "gjwt-HS256-no-Key.xml": [
    "The policy must include a <SecretKey> when the algorithm is HS256.",
  ],
  "gjwt-RS256-no-Key.xml": [
    "The policy must include a <PrivateKey> when the algorithm is RS256.",
  ],
  "gjwt-RS256-both-PrivateKey-and-SecretKey.xml": [
    "<SecretKey> is not allowed here; when the algorithm is RS256, there must be exactly one Key element, named <PrivateKey>.",
  ],
  "gjwt-RS256-with-SecretKey-no-PrivateKey.xml": [
    "The policy must include a <PrivateKey> when the algorithm is RS256.",
    "<SecretKey> is not allowed here; when the algorithm is RS256, there must be exactly one Key element, named <PrivateKey>.",
  ],
  "gjwt-bad-alg.xml": ["Unrecognized algorithm: AS256."],
};
