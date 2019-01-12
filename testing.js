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
	let dorm = 'Five Guys'
	let isStore = true

	// If it is a store, filter for store only
	if (isStore) {
		// Iterate through the data, and for each store match send the item to order
		let toReturn = '- ' + dorm + ' Orders -\n'
		for (let i = 0; i < data.length; i++) {
			let storeAdded = false
			// Iterate through items in each receipt
			for (let j = 2; j < 10; j++) {
				if (data[i][j][1].toLowerCase().indexOf(dorm.toLowerCase()) > -1) {
					if (!storeAdded) { toReturn += 'Order #' + i + ':\n'; storeAdded = true}
					toReturn += ' - ' + data[i][j][0].split(')')[1].trim() + '\n'
				}
			}
		}
		// When orders are acquired, then send the message
		console.log(toReturn)
	// Otherwise filter for dorm
	} else {
		// Iterate through the data, and for each dorm match send the order name and number
		for (let i = 0; i < data.length; i++) {
			if (data[i][11][0] != undefined && data[i][11][0].toLowerCase().indexOf(dorm) > -1 || 
				data[i][12][0] != undefined && data[i][12][0].toLowerCase().indexOf(dorm) > -1) {
				console.log(googleapi.orderToString(data[i], i + 1))
			}
		}
	}
})