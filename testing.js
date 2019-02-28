// Import the vault for password/username
var VAULT = require('./config/vault.json')
// Google API for getting receipts and other data
var googleapi = require('./app/googleapi')
const {google} = require('googleapis');
// Analytics for user data
var SQLInterface = require('./app/analytics').SQLInterface
// Scheduling of functions for financial updates
var schedule = require('node-schedule')
// Twilio / http imports
const http = require('http')
const express = require('express')
const MessagingResponse = require('twilio').twiml.MessagingResponse
const bodyParser = require('body-parser')
// Initialize the application
const app = express();
app.use(bodyParser.urlencoded({ extended: false }))
// Twilio number-specific messaging
const client = require('twilio')(VAULT.twilio.accountSid, VAULT.twilio.authToken)
// Imessage library
// const imessage = require('osa-imessage')
// Deprecated
const Checkout = require('./deprecated/scripts/checkout').Checkout


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

// let message = "11:00 A.M. delivery tomorrow. Dunkin and Starbucks. Order by 10:00 P.M. tonight. If you want to cancel any order, text 2035868752 (Brady)."

// // Perform MySQL request to get the list of numbers
// database.pullNumbers((results) => {
//     // With the list of numbers, use the client to send the message to each
//     let someth = 0
//     let failed = 0
//     for (let i = 0; i < results.length; i++) {
//         // If not muted, send the message
//         if (results[i]['muted'] == 0) {
//             // Depending on which number to use, send the messages
//             client.messages.create({
//                 body: message,
//                 to: results[i]['phone'],
//                 from: '+12038946844'
//             })
//             someth++
//         }
//     }
// })

// Finally build the HTTP server for the bot
http.createServer(app).listen(1337, () => {
    console.log('Express server listening on port 1337')
})

// googleapi.runAuthorizeFunction(googleapi.getReceipts, 'Breakfast', (data) => {
// 	data.map((row) => {
// 		console.log(googleapi.receiptToString(row))
// 	})
// })
// 

// imessage.send('+123234', 'IDK').catch((error) => {
// 	console.log('Conversation not started with ' + '+123234' + ' so they did not receive text.')
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
// googleapi.runAuthorizeFunction(googleapi.pushMiles, [0], (data) => {
// 	// Get the dorm from the first section between split
	
// })




