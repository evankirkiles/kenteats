const ProductRetriever = require('./starbucks/products.js').ProductRetriever

let pr = new ProductRetriever()
pr.initialize(() => {
	pr.askForProduct()
})