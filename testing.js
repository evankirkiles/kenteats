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

googleapi.runAuthorizeFunction(googleapi.getCoupons, undefined, (data) => {
	console.log(data)
})