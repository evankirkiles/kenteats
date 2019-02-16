// Analytics for user data
var SQLInterface = require('../app/analytics').SQLInterface
// Filesystem for writing
var fs = require('fs')

// Pull the contacts with names and who haven't been made contacts yet
let database = new SQLInterface()
database.getContacts((results) => {
	// For each one, write them to a file
	var stream = fs.createWriteStream('./contacts.txt', {flags: 'a'})
	results.map((row) => {
		stream.write(row['name'] + ',' + row['phone'].replace(/\D+/g, '') + '\n')
	})
	stream.end()
})
