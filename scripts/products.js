// Require requests for accessing checkout HTTP endpoint
const request = require('request')

// Pulls the menu and searches for products matching keyword. Then, prompts user to select from all found.
// Menu is pulled on construction so is able to be reused many times over.