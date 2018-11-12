// Prompt for requesting from the user
var prompt = require('prompt')

prompt.message = 'Input'

prompt.start({
	noHandleSIGINT: true,
})

module.exports = prompt