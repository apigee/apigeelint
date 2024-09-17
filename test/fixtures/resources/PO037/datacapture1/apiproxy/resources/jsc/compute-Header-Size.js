var list = context.getVariable("request.headers.names") + "";
var totalSize = list
  .substring(1, list.length - 1)
  .split(", ")
  .reduce(function (acc, name) {
    return (
      acc +
      context.getVariable("request.header." + name + ".values.string").length
    );
  }, 0);

context.setVariable("computed-headers-length", totalSize);
