//BN003	Cache Coherence	A bundle that includes cache reads should include cache writes with the same keys.

var bundle,
  plugin = {
    ruleId: "BN003",
    name: "Cache Coherence",
    message:
      "Cache strategies that rely on external cache population can be problematic and lead to run time errors.",
    fatal: false,
    severity: 2, //warn
    nodeType: "Cache",
    enabled: true
  },
  xpath = require("xpath"),
  store = { LookupCache: {}, PopulateCache: {} };

onBundle = function(bundle) {
  //is it a cache policy?
  //is it attached?
  bundle.getPolicies().forEach(function(policy) {
    if (
      (policy.getType() === "PopulateCache" ||
        policy.getType() === "LookupCache") &&
      policy.getSteps().length > 0
    ) {
      /*
        <CacheKey>
            <Prefix/>
            <KeyFragment ref=""/>
        </CacheKey>
      */

      var prefix = xpath.select(
          "//CacheKey/Prefix/text()",
          policy.getElement()
        ),
        keyFragmentRef = xpath.select(
          "//CacheKey/KeyFragment/@ref/text()",
          policy.getElement()
        ),
        keyFragment = xpath.select(
          "//CacheKey/KeyFragment/text()",
          policy.getElement()
        );

      prefix = (prefix[0] && prefix[0].data) || "";
      keyFragmentRef = (keyFragmentRef[0] && keyFragmentRef[0].data) || "";
      keyFragment = (keyFragment[0] && keyFragment[0].data) || "";

      //ok now we have the key values for the cache policy, lets stow them if they don't already exist
      //use a composite key
      store[policy.getType()][
        prefix + "-" + keyFragmentRef + "-" + keyFragment
      ] = policy;
    }
  });
  //now inspect the store object
  //for every lookup key we expect a populate key
  for (lookupKey in store["LookupCache"]) {
    if (!store["PopulateCache"][lookupKey]) {
      //report an error
      //the object in the store is the policy so we can report directly against it
      store["LookupCache"][lookupKey].addMessage({
        plugin,
        message: "Cache Lookup may not have a corresponding Populate."
      });
    }
  }
};

module.exports = {
  plugin,
  onBundle
};
