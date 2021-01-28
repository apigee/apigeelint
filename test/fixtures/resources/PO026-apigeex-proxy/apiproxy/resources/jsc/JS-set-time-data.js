/* globals context */
var request_start_time = context.getVariable('client.received.start.timestamp');
var target_start_time  = context.getVariable('target.sent.start.timestamp');
var target_end_time    = context.getVariable('target.received.end.timestamp');
var request_end_time   = context.getVariable('system.timestamp');
var total_request_time = request_end_time-request_start_time;
var total_target_time  = target_end_time-target_start_time;
var total_client_time  = total_request_time-total_target_time;

context.setVariable("total_client_time", total_client_time+'');
context.setVariable("total_target_time", total_target_time+'');
context.setVariable("total_request_time",total_request_time+'');