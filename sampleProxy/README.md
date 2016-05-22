24Solver
========

A very simple no target proxy useful for demonstrating simple javascript callout debugging practices. 24Solver takes 4 numbers as input and returns a list of possible formulas using each and every number to arrive at the result of 24. More info about the game can be found here: http://en.wikipedia.org/wiki/24_Game

For instance if you want to see how many ways 1, 2, 4, and 6 can be combined to arrive at 24:
	calling: http://davidwallen2014-test.apigee.net/24solver?numbers=1,2,4,6
	results in:
		{
		    "numbers": "1,2,4,6",
		    "count": 20,
		    "answers": ["(2-1)\*4\*6", "(2-1)\*(4\*6)", "(2-1)\*6\*4", "(2-1)\*(6\*4)", "(2+6)\*(4-1)", "(4-1)\*(2+6)", "(4-1)\*(6+2)", "4\*(2-1)\*6", "4/(2-1)\*6", "(4\*6)\*(2-1)", "4\*6\*(2-1)", "(4\*6)/(2-1)", "4\*6/(2-1)", "6\*(2-1)\*4", "6/(2-1)\*4", "(6+2)\*(4-1)", "(6\*4)\*(2-1)", "6\*4\*(2-1)", "(6\*4)/(2-1)", "6\*4/(2-1)"]
		}

The implementation is lightly tested and has numerous bugs including not accounting for integer division in testing candidate results and unnecessary recursion when building permutations. It is left as an exercise for the reader to solve these issues. Doing so locally will significantly speed up the debugging process.

## Installation

There is a zip bundle in the targets directory that can be uploaded to Edge through the UI console.

As well, you can edit the POM files and use Maven to deploy. More information on using Maven to deploy Edge proxies can be found at: 
https://github.com/apigee/apigee-deploy-maven-plugin

Alternatively, you can simply hit the API at http://davidwallen2014-test.apigee.net/24solver?numbers=1,1,24,24 if you want to play with it.

## Tests

  none

## Contributing

In lieu of a formal style guide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality. Lint and test your code.

## Release History

* 0.1.0 Initial release