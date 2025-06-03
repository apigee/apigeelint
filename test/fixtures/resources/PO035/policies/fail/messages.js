// These are the error messages only for the failed policies.
module.exports = {
  "Indentifier-instead-of-Identifier.xml": [
    "The element <Indentifier> is not allowed here.",
  ],
  "PreciseAtSecondsLevel.xml": [
    "The element <PreciseAtSecondsLevel> is not allowed here.",
  ],
  "Non-Boolean.xml": [
    "The value for <Synchronous> should be one of [true,false].",
  ],
  "UseProductQuotaConfig-1.xml": [
    "The element <Foo> is not allowed here.",
    "The stepName attribute refers to a policy (VerifyAPIKey) that does not exist.",
  ],
  "Multiple-Interval.xml": ["Extra <Interval> element."],
  "Missing-TimeUnit.xml": ["Missing <TimeUnit> element."],
  "UseProductQuotaConfig-missing-stepName.xml": ["Missing stepName attribute."],
  "CountOnly-in-apigee-profile.xml": [
    "The element <CountOnly> is not allowed here in profile=apigee.",
    "The element <SharedName> is not allowed here in profile=apigee.",
  ],
  "MessageWeight-Explicit.xml": [
    "The element <MessageWeight> must not have a text value.",
    "The element <MessageWeight> must have a ref attribute.",
  ],
  "Asynch-neither-child-element.xml": [
    "The element <AsynchronousConfiguration> must have at least one of {SyncIntervalInSeconds, SyncMessageCount} as a child.",
  ],
  "Asynch-non-integer-SyncIntervalInSeconds-element.xml": [
    "The element <SyncIntervalInSeconds> must have a text value representing an integer.",
  ],
  "Asynch-empty-SyncMessageCount-element.xml": [
    "The element <SyncMessageCount> must have a text value representing an integer.",
  ],
  "Quota-via-Classes.xml": ["The element <Classes> is not allowed here."],
};
