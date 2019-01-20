// Import the vault for password/username
var VAULT = require('./config/vault.json')
// Google API for getting receipts and other data
var googleapi = require('./app/googleapi')
// Analytics for user data
var SQLInterface = require('./app/analytics').SQLInterface
// Scheduling of functions for financial updates
var schedule = require('node-schedule')
// Twilio / http imports
const http = require('http')
const express = require('express')
const MessagingResponse = require('twilio').twiml.MessagingResponse
const bodyParser = require('body-parser')
// Twilio number-specific messaging
const client = require('twilio')(VAULT.twilio.accountSid, VAULT.twilio.authToken)


let database = new SQLInterface()
// Run the MySQL query to determine if any data is available
// database.getFinancials((data) => {
// 	googleapi.runAuthorizeFunction(googleapi.fillFullDayBookkeeping, data, () => {}) })
// database.getSingleOrderFinancials((data) => {
// 	googleapi.runAuthorizeFunction(googleapi.fillSingleOrderBookkeeping, data, () => {}) })
// database.getStudentIDFinancials((data) => {
// 	googleapi.runAuthorizeFunction(googleapi.fillStudentIDOrders, data, () => {}) })
// database.getVenmoFinancials((data) => {
// 	googleapi.runAuthorizeFunction(googleapi.fillVenmoOrders, data, () => {}) })

// googleapi.runAuthorizeFunction(googleapi.getReceipts, 'Afternoon', (data) => {
// 	data.map((single) => {
// 		console.log(googleapi.receiptToString(single))
// 	})
// })

// If it is, return a Twilio message containing all the coupons formatted nicely
// database.getCoupons((data) => {
// 	let index = 0
// 	data.map((coupon) => {
// 		index++
// 		console.log('- COUPON ' + index + ' -\nCode: ' + coupon['code'] + '\nAmount: ' + (coupon['percent'] == 1 ? (coupon['amount'] * 100).toFixed(0) + '%' : '$' + coupon['amount'].toFixed(2)) + '\nFrom: ' + (coupon['calcfrom'] == 'DELIVERYFEE' ? 'Delivery Fee' : 'Total') + '\nUses: ' + coupon['uses'])
// 	})
// })

// Get the receipts for the specified time to retrieve phone numbers, dorm, etc.
googleapi.runAuthorizeFunction(googleapi.getReceipts, 'Afternoon', (data) => {
	// Get the dorm from the first section between split
	let currentDayOrders = 0
	for (let i = 0; i < data.length; i++) {
		database.processReceipt(data[i], currentDayOrders, false, (returned) => {})
		currentDayOrders++
	}
	
})