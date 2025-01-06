<?php 
// Send email via HTML
$to      = 'nobody@example.com';
$subject = isset($_REQUEST['subject']) ? strip_tags($_REQUEST['subject']) : 'the subject';
$message = isset($_REQUEST['message']) ? strip_tags($_REQUEST['message']) : 'the message';
$from = isset($_REQUEST['email']) ? strip_tags($_REQUEST['email']) . '<' .strip_tags($_REQUEST['email']) . '>' : '';


$headers  = 'MIME-Version: 1.0' . "\r\n";
$headers .= 'Content-type: text/html; charset=iso-8859-1' . "\r\n";
$headers .= 'From: ' . ( $from ) . '' . "\r\n";

if( mail( $to, $subject, $message, $headers ) ){
	die( json_encode(array(
		'status' => 'Email send successfully!'
	)));	
}

die( json_encode(array(
	'status' => 'Unable to send Email. Try again later.'
)));