(function(window){

    function myLibrary(){
		const catalog = [];
		const starshipFieldWhitelist = ['name', 'model', 'manufacturer', 'cost_in_credits', 'length', 'max_atmosphering_speed', 'crew', 'passengers', 'cargo_capacity', 'consumables', 'hyperdrive_rating', 'MGLT', 'starship_class'];
		
		return {
			getStarshipNames: getStarshipNames,
			getStarship: getStarshipById,
		}
	
		function getStarshipNames() {
			return loadStarships().then(function() {
				var namesCatalog = [];
				Object.keys(catalog).map(function(key, index) {
					namesCatalog[key] = catalog[key].name;
				});
				return namesCatalog;
			});
		}
		
		function getStarshipById(id) {
			return loadStarships().then(function() {
				return catalog[id] ? catalog[id] : null;
			});
		}
	
		function loadStarships() {
			if (catalog.length === 0) {
				return run(loadStarshipsGen).catch(function(err) {
					alert(err.message);
				});
			} else {
				return Promise.resolve();
			}
		}
	
		function *loadStarshipsGen() {
			var starshipsUrl = "https://swapi.co/api/starships";
			do {
				var starshipResponse = yield fetch(starshipsUrl);
				var starshipsPage = yield starshipResponse.json();
				for (let i = 0; i < starshipsPage.results.length; i++) {
					const starshipId = extractIdFromStarshipUrl(starshipsPage.results[i].url);
					catalog[starshipId] = yield clearStarshipCatalogObject(starshipsPage.results[i]);
				}
				starshipsUrl = starshipsPage.next;
			} while (starshipsUrl);
		}
		
		function extractIdFromStarshipUrl(url) {
			const regex = /\/(\d+)\/$/g;
			const match = regex.exec(url);
			return match.length == 2 ? match[1] : null;				
		}
		
		function clearStarshipCatalogObject(object) {
			Object.keys(object).forEach(function(key) {
				if (starshipFieldWhitelist.indexOf(key) < 0) {
					delete object[key];
				}
			});
			return object;
		}
	}

	if(typeof(window.swapi) === 'undefined'){
        window.swapi = myLibrary();
    }

})(window); 

function run(genFunc){
	const genObject= genFunc(); //creating a generator object

	function iterate(iteration){ //recursive function to iterate through promises
		if(iteration.done) //stop iterating when done and return the final value wrapped in a promise
			return Promise.resolve(iteration.value);
		return Promise.resolve(iteration.value) //returns a promise with its then() and catch() methods filled
		.then(x => iterate(genObject.next(x))) //calls recursive function on the next value to be iterated
		.catch(x => iterate(genObject.throw(x))); //throws an error if a rejection is encountered
	}

	try {
		return iterate(genObject.next()); //starts the recursive loop
	} catch (ex) {
		return Promise.reject(ex); //returns a rejected promise if an exception is caught
	}
}	

function *gen(){
	//check if inputs are valid
	var select1Value = document.getElementById("select1").value;
	var select2Value = document.getElementById("select2").value;
	
	if (!select1Value && !select2Value) {
		throw new Error("No Starship not selected");
	}
	if (!select1Value) {
		throw new Error("First Starship not selected");
	}
	if (!select2Value) {
		throw new Error("Second Starship not selected");
	}
	if (select1Value == select2Value) {
		throw new Error("Selected Starships are the same");
	}
	
	//fetch the starships
	var starship1 = yield window.swapi.getStarship(select1Value);
	var starship2 = yield window.swapi.getStarship(select2Value);
	
	//display the starships on table
	var table = document.getElementById('table');
	var tableBodyElement = document.getElementById('table-body');
	tableBodyElement.innerHTML = '';
	yield Object.keys(starship1).forEach(function(param) {
		const tableTr = document.createElement('tr');
		const tableTd1 = document.createElement('td');
		const tableTd2 = document.createElement('td');
		const tableTd3 = document.createElement('td');
		
		tableTd1.innerHTML = getParamName(param);
		tableTd2.innerHTML = starship1[param];
		tableTd3.innerHTML = starship2[param];
		
		if (!isNaN(parseFloat(starship1[param])) && isFinite(starship1[param]) && !isNaN(parseFloat(starship2[param])) && isFinite(starship2[param])) {
			const n1 = parseFloat(starship1[param]);
			const n2 = parseFloat(starship2[param]);
			if (n1 > n2) {
				tableTd2.classList.add('higher');
			} else if (n1 < n2) { 
				tableTd3.classList.add('higher');
			}			
		}
		
		tableTr.appendChild(tableTd1);
		tableTr.appendChild(tableTd2);
		tableTr.appendChild(tableTd3);
		tableBodyElement.appendChild(tableTr);
	});
	table.classList.remove('hidden');
	
	function getParamName(param) {
		var paramName = param.charAt(0).toUpperCase() + param.slice(1);
		return paramName.replace(new RegExp('_', 'g'), ' ');
	}
}	

select1.disabled = "disabled";
select2.disabled = "disabled";
const selectOptionLoading = document.createElement('option');
selectOptionLoading.text = "Loading...";
selectOptionLoading2 = selectOptionLoading.cloneNode(true);
select1.appendChild(selectOptionLoading);
select2.appendChild(selectOptionLoading2);

window.swapi.getStarshipNames().then(function(starshipNames) {
	const select1 = document.getElementById("select1");
	const select2 = document.getElementById("select2");
		
	Object.keys(starshipNames).forEach(function(id) {
		const selectOption = document.createElement('option');
		selectOption.value = id;
		selectOption.text = starshipNames[id];
		select1.appendChild(selectOption);
		select2.appendChild(selectOption.cloneNode(true));
	});	
	
	selectOptionLoading.remove();
	selectOptionLoading2.remove();
	
	select1.disabled = false;
	select2.disabled = false;
});


document.getElementById("button").addEventListener('click',function(){
    run(gen).catch(function(err){
        alert(err.message);
    });
})