// These are the error messages only for the failed policies.
module.exports = {
  "Indentifier-instead-of-Identifier.xml": [
    "element <Indentifier> is not allowed here."
  ],
  "PreciseAtSecondsLevel.xml": [
    "element <PreciseAtSecondsLevel> is not allowed here."
  ],
  "Non-Boolean.xml": ["value for <Synchronous> should be one of [true,false]."],
  "UseProductQuotaConfig-1.xml": ["element <Foo> is not allowed here."],
  "Multiple-Interval.xml": ["extra <Interval> element."],
  "Missing-TimeUnit.xml": ["missing <TimeUnit> element."],
  "UseProductQuotaConfig-missing-stepName.xml": ["missing stepName attribute."],
  "CountOnly-in-apigee-profile.xml": [
    "element <CountOnly> is not allowed here.",
    "element <SharedName> is not allowed here."
  ],
  "MessageWeight-Explicit.xml": [
    "element <MessageWeight> must not have a text value.",
    "element <MessageWeight> must have a ref attribute."
  ],
  "Asynch-neither-child-element.xml": [
    "element <AsynchronousConfiguration> must have at least one of {SyncIntervalInSeconds, SyncMessageCount} as a child."
  ],
  "Asynch-non-integer-SyncIntervalInSeconds-element.xml": [
    "element <SyncIntervalInSeconds> must have a text value representing an integer."
  ],
  "Asynch-empty-SyncMessageCount-element.xml": [
    "element <SyncMessageCount> must have a text value representing an integer."
  ],
  "Quota-via-Classes.xml": ["element <Classes> is not allowed here."]
};
