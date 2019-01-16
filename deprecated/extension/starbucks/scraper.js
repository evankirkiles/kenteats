// Retrieves the comprehensive list of products
export function getProducts(callback) {
	$.getJSON('https://app.starbucks.com/bff/ordering/menu?storeNumber=10190', 
		(result) => {
			let fullproducts = JSON.parse(body)
			let parsedproducts = {'products': []}

			// Parse the comprehensive product list
			for (let i = 0; i < fullproducts['menus'].length; i++) {
				traverseLevel(fullproducts['menus'][i], parsedproducts)
			}

			// Now return the parsed products
			callback(parsedproducts)
	})
}

// Traverses a level of the product tree
function traverseLevel(level, parsedproducts) {
	// Make sure the children and the products exist
	if (level.children == undefined || level.products == undefined) { return undefined }

	// If there are no children of this level, there must be products
	if (level.children.length == 0 && level.products.length != 0) {
		// Loop through the products and print the name of each one
		for (let i = 0; i < level.products.length; i++) {
			parsedproducts['products'].push(level.products[i])
		}
	// Otherwise loop through the children and traverse each one of them
	} else if (level.children.length != 0) {
		for (let i = 0; i < level.children.length; i++) {
			traverseLevel(level.children[i], parsedproducts)
		}
	}
}