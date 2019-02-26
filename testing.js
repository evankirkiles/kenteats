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
// Twilio number-specific messaging
const client = require('twilio')(VAULT.twilio.accountSid, VAULT.twilio.authToken)
// Imessage library
// const imessage = require('osa-imessage')
// Deprecated
const Checkout = require('./deprecated/scripts/checkout').Checkout


// let database = new SQLInterface()
// Run the MySQL query to determine if any data is available
// database.getFinancials((data) => {
// 	googleapi.runAuthorizeFunction(googleapi.fillFullDayBookkeeping, data, () => {}) })
// database.getSingleOrderFinancials((data) => {
// 	googleapi.runAuthorizeFunction(googleapi.fillSingleOrderBookkeeping, data, () => {}) })
// database.getStudentIDFinancials((data) => {
// 	googleapi.runAuthorizeFunction(googleapi.fillStudentIDOrders, data, () => {}) })
// database.getVenmoFinancials((data) => {
// 	googleapi.runAuthorizeFunction(googleapi.fillVenmoOrders, data, () => {}) })

// googleapi.runAuthorizeFunction(googleapi.getReceipts, 'Breakfast', (data) => {
// 	data.map((row) => {
// 		console.log(googleapi.receiptToString(row))
// 	})
// })

let stringin = "sdsdhsdh_assd YshdshdsjdsdSasdsahd"

function convertSnake(stringin) {
    let current = ''
    let convertToUppercase = false
    let toggleableWord = 0   // 0: no word, 1: ignorable word, 2: toggleable word
    for (let i = 0; i < stringin.length; i++) {
        if (stringin[i] == ' ') { toggleableWord = 0; current += ' '; continue }
        
        if (toggleableWord == 0) {
            current += stringin[i];
            if (stringin[i] == stringin[i].toUpperCase()) {
                toggleableWord = 1
            } else {
                toggleableWord = 2
            }
        } else if (toggleableWord == 2) {
            if (stringin[i] == stringin[i].toUpperCase()) {
                current += '_' + stringin[i].toUpperCase()
            } else if (stringin[i] == '_') {
                convertToUppercase = true
            } else {
                if (convertToUppercase) {
                    current += stringin[i].toUpperCase()
                    convertToUppercase = false
                } else {
                    current += stringin[i]
                }
            }
        }  
    }
    return current
}

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




