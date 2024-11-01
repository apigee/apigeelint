// These are the error messages only for the failed policies.
module.exports = {
  "KVM-empty-MapName-apigeex.xml":
    "The MapName element must specify a @ref attribute, or a text value",

  "KVM-MapName-apigee.xml": [
    "inappropriate MapName element for apigee profile",
    "missing mapIdentifier attribute"
  ],

  "KVM-neither-MapName-nor-mapIdentifier-apigeex.xml":
    "Specify the map name via either the mapIdentifier attribute, or the MapName element",

  "KVM-both-MapName-and-mapIdentifier-apigeex.xml":
    "use mapIdentifier attribute or MapName element, not both",

  "KVM-both-MapName-and-mapIdentifier-apigee.xml":
    "inappropriate MapName element for apigee profile",

  "KVM-missing-mapIdentifier-apigee.xml":
    "missing mapIdentifier attribute"
};
