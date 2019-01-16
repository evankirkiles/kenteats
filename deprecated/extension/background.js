import { getProducts } from './starbucks/scraper.js'

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {

	chrome.tabs.create({"url": "http://google.com"});

 //  // Send a message to the active tab
 //  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
   
	// scraper.getProducts((parsed) => {
	// 	console.log('aaaaaaa')
	// })

 //  });
});