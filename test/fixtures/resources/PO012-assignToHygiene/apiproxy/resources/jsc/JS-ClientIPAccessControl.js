 // read properties from the policy - ip list
var ipAddressStr = context.getVariable(properties.ipListFromKVM);

// read properties from the policy - get request source ip variable
var clientIP = getVariableFromHeaderOrContext(properties.ipVariableToVerify);

//raise an error if we are unable to read the required variable
if(clientIP === undefined || clientIP === null || clientIP ===""){
    createError("530", "MissingPolicyProperty", "Unable to read "+properties.ipVariableToVerify+" apigee Policy Property from context. Please configure JS-CheckClientIpAgainstAllowedListOfIps policy to pass on required propety.", "apigeePolicy", "checkClientIpAgainstAllowedListOfIps Client-IP-Access-Control.js");
}else if(ipAddressStr === undefined || ipAddressStr === null || ipAddressStr ===""){
    createError("530", "MissingPolicyProperty", "Unable to read "+properties.ipListFromKVM+" apigee Policy Property from context. Please configure JS-CheckClientIpAgainstAllowedListOfIps policy to pass on required propety.", "apigeePolicy", "checkClientIpAgainstAllowedListOfIps Client-IP-Access-Control.js");
}

var ipAddress = ipAddressStr.split(',');

var binaryClientIP = getBinaryStringFromIP(clientIP);

var validIP = false;
//loop through the values and return true when the match is found

for(var i =0;i<ipAddress.length;i++){
	
	var currentIP=ipAddress[i];
	//special case if give IP is 0.0.0.0 abort checking as all IPs are valid...!!
	if(currentIP == '0.0.0.0'){
		validIP = true;
		break;
	}
	//spilt IP and subnet mask
	var split = currentIP.split('/');
	var absIPAddressMask = getBinaryStringFromIP(split[0]);
	
	//if no mask was provide use the complete IP address
	var mask = split[1]?split[1]:'32';
	
	//compare the IP addresses based on mask digits.All digits till mask should be same for IP to be in range
	if(absIPAddressMask.substring(0,mask) == binaryClientIP.substring(0,mask)){
		validIP = true;
		//break the loop as we do not need to compare other IPs
		break;
	}
}

if(!validIP){
	//raise a forbidden access error
	createError("403", "IPDeniedAccess", "Access denied for " + properties.checkFor + " IP:"+clientIP, "apigeePolicy", "checkClientIpAgainstAllowedListOfIps Client-IP-Access-Control.js");
}

//calculate and return the Binary value from IP Address string
function getBinaryStringFromIP(ipaddress){
	var arr = ipaddress.split('.');
	
	var str = '';
	
	    arr.forEach(function(value){
		    var binValue=parseInt(value).toString(2);
		    binValue = padString(8,'0',binValue);
		    str+=binValue;
	    });

	return str;
}

//pad zeros before IP address
function padString(len,pad,original){
    var str = original?original:'';
    while(str.length < len){
        str = pad + str;
    }
    return str;
}

//read variable from header or context
function getVariableFromHeaderOrContext(varName){
 
 //modified by adam as the previous logic allowed unauthorized access.
    if(varName == 'client.ip'){
        return context.getVariable(varName.toLowerCase());
    }else if(varName == 'True-Client-IP'){
        return context.getVariable('request.header.'+varName.toLowerCase());
    }
 
}
