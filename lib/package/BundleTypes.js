const BundleType = {
  APIPROXY: "apiproxy",
  SHAREDFLOW: "sharedflowbundle",
};

const getXPathName = (bundleType) =>
  bundleType === BundleType.SHAREDFLOW ? "SharedFlowBundle" : "APIProxy";

module.exports = {
  BundleType,
  getXPathName,
};
