const BundleType = {
    APIPROXY: "apiproxy",
    SHAREDFLOW: "sharedflowbundle"
}

var getXPathName = function(bundleType){
    return bundleType === BundleType.SHAREDFLOW ? "SharedFlowBundle" : "APIProxy";
}

module.exports = {
 BundleType,
 getXPathName
}