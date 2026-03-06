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
  "gjwt-no-Algorithm.xml": ["You must specify Algorithm or Algorithms."],
  "gjwt-multiple-Algorithms.xml": [
    "Inappropriate <Algorithms> element; You must specify exactly one of Algorithm or Algorithms.",
  ],
  "gjwt-extra-ExpiresIn.xml": ["extra <ExpiresIn> element."],
  "gjwt-duplicate-PrivateKey.xml": ["extra <PrivateKey> element."],
  "gjwt-duplicate-SecretKey.xml": ["extra <SecretKey> element."],
  "gjwt-HS256-with-PrivateKey.xml": [
    "<PrivateKey> is not allowed here; when the algorithm is HS256, there must be exactly one Key element, named <SecretKey>.",
  ],
  "gjwt-invalid-child-of-PrivateKey.xml": ["element <InvalidChild> is not allowed here."],
};
