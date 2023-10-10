let savedSearchResults = [];
let isShowingItemDetails = false;

function performSearch() {
    console.log("performSearch function called!");
    const keywordInput = document.querySelector("input[name='keyword']");
    const priceFromInput = document.querySelector("input[name='price-from']");
    const priceToInput = document.querySelector("input[name='price-to']");
    const sortOrder = document.getElementById('sortOrder').value;
    const conditions = Array.from(document.getElementsByName('condition'))
                            .filter(checkbox => checkbox.checked)
                            .map(checkbox => checkbox.value)
                            .join(',');
    const freeShipping = document.getElementById('freeShipping').checked;
    const expeditedShipping = document.getElementById('expeditedShipping').checked;
    const returnsAccepted = document.getElementById('returnsAccepted').checked;

    if (!keywordInput.value.trim()) { 
        alert("Please fill out this field.");
        return;
    }

    let fromValue = parseFloat(priceFromInput.value);
    let toValue = parseFloat(priceToInput.value);

    if (isNaN(fromValue) && isNaN(toValue)) { 
        fromValue = 0;
        toValue = Number.MAX_VALUE;
    } else {
        if (isNaN(fromValue)) {
            alert("Please enter a valid starting price.");
            return;
        }
        if (isNaN(toValue)) {
            alert("Please enter a valid ending price.");
            return;
        }
        if (fromValue < 0 || toValue < 0) {
            alert("Please enter a positive value for the price range.");
            return;
        }
        if (fromValue > toValue) {
            alert("The lower price range cannot be higher than the upper price range.");
            return;
        }
    }

    const queryParams = new URLSearchParams({
        keyword: keywordInput.value,
        priceFrom: fromValue,
        priceTo: toValue,
        sortOrder,
        condition: conditions,
        freeShipping,
        expeditedShipping,
        returnsAccepted
    });

    fetch(`/api/search?${queryParams.toString()}`)
        .then(response => response.json())
        .then(data => displayResults(data))
        .catch(error => console.error('Error fetching data:', error));
}





function displayResults(data) {
    const resultsContainer = document.getElementById("resultsContainer");
    resultsContainer.innerHTML = "";  // Clear previous results

    // Define a function to render items
    const renderItems = (items) => {
        items.forEach(item => {
            const itemDiv = document.createElement("div");
            itemDiv.className = "result-item";

            const itemImage = document.createElement("img");
            itemImage.src = item.image;
            itemImage.alt = item.name;
            itemImage.className = "result-image";

            const itemDetails = document.createElement("div");
            itemDetails.className = "result-details";

            const itemName = document.createElement("h2");
            itemName.textContent = item.name;

            const itemCategory = document.createElement("p");
            itemCategory.textContent = "Category: " + item.category;

            const itemCondition = document.createElement("p");
            itemCondition.textContent = "Condition: " + item.condition;

            const itemPrice = document.createElement("p");
            itemPrice.className = "price";
            let formattedPrice = parseFloat(item.price.split(" ")[1]).toFixed(2);
            itemPrice.textContent = `Price: $${formattedPrice}`;

            itemDetails.appendChild(itemName);
            itemDetails.appendChild(itemCategory);
            itemDetails.appendChild(itemCondition);
            itemDetails.appendChild(itemPrice);

            itemDiv.appendChild(itemImage);
            itemDiv.appendChild(itemDetails);
            itemDiv.addEventListener('click', () => getItemDetails(item));

            resultsContainer.appendChild(itemDiv);
        });
    }

    // Initially, render the first 3 items
    renderItems(data.slice(0, 3));

    // If there are more than 3 items, show the "Show More" button
    if (data.length > 3) {
        // Update styles for the "Show More" button:
        const showMoreBtn = document.createElement("button");
        showMoreBtn.textContent = "Show More";
        showMoreBtn.style.display = "block";
        showMoreBtn.style.margin = "20px auto 40px";  // 20px margin top, auto center, 40px margin bottom
        showMoreBtn.style.width = "150px";
        showMoreBtn.onclick = () => {
            renderItems(data.slice(3)); // Render the remaining items
            showMoreBtn.remove(); // Remove the "Show More" button
        };
        resultsContainer.appendChild(showMoreBtn);
    }
}




function getItemDetails(item) {
    // Fetch the item details using the GetSingleItem API
    fetch(`/api/item/${item.itemId}`)
        .then(response => response.json())
        .then(data => {
            isShowingItemDetails = true;
            displayItemDetails(data);
        })
        .catch(error => console.error('Error fetching item details:', error));
}



function displayItemDetails(data) {
    const resultsContainer = document.getElementById("resultsContainer");
    resultsContainer.innerHTML = "";  // Clear previous results

    const header = document.createElement('h2');
    header.textContent = "Item Details";
    header.style.textAlign = "center";
    header.style.fontFamily = "Times New Roman, Times, serif";
    header.style.fontSize = "3em"; // Make the header text larger
    header.style.marginBottom = "5px"; // Decrease margin between header and button

    const closeModalBtn = document.createElement('button');
    closeModalBtn.textContent = "Back to Search Results";
    closeModalBtn.onclick = () => {
        isShowingItemDetails = false;
        displayResults(savedSearchResults);
    };
    closeModalBtn.style.display = "block";
    closeModalBtn.style.margin = "5px auto"; // Reduced margin

    const table = document.createElement('table');
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    // table.style.fontFamily = "Times New Roman, Times, serif"; 

    // Define keys and their corresponding values
    const detailsMapping = {
        "Photo": data.Item.PictureURL[0],
        "eBay Link": data.Item.ViewItemURLForNaturalSearch,
        "Title": data.Item.Title,
        "SubTitle": data.Item.Subtitle,
        "Price": `${data.Item.CurrentPrice.Value} ${data.Item.CurrentPrice.CurrencyID}`,
        "Location": `${data.Item.Location}, ${data.Item.PostalCode}`,
        "Seller": data.Item.Seller.UserID,
        "Return Policy (US)": data.Item.ReturnPolicy.ReturnsAccepted
    };

    for (const key in detailsMapping) {
        const row = table.insertRow();
        const keyCell = row.insertCell(0);
        keyCell.textContent = key;
        keyCell.style.fontWeight = "bold";
        keyCell.style.border = "1px solid grey";

        const valueCell = row.insertCell(1);
        if (key === "Photo") {
            const img = document.createElement('img');
            img.src = detailsMapping[key];
            img.alt = "Item photo";
            img.width = 300;
            valueCell.appendChild(img);
        } else if (key === "eBay Link") {
            const anchor = document.createElement('a');
            anchor.href = detailsMapping[key];
            anchor.textContent = "eBay Product Link";
            anchor.target = "_blank"; // Open link in new tab
            valueCell.appendChild(anchor);
        } else {
            valueCell.textContent = detailsMapping[key];
        }
        valueCell.style.border = "1px solid grey";
     }

    const itemSpecifics = data.Item.ItemSpecifics.NameValueList;
    itemSpecifics.forEach(spec => {
        let valueString = spec.Value.join(", ");
            
        const row = table.insertRow();
            
        const keyCell = row.insertCell(0);
        keyCell.textContent = spec.Name;
        keyCell.style.fontWeight = "bold";
        keyCell.style.border = "1px solid grey";

        const valueCell = row.insertCell(1);
        valueCell.textContent = valueString;
        valueCell.style.border = "1px solid grey";
    });

    resultsContainer.appendChild(header);
    resultsContainer.appendChild(closeModalBtn);
    resultsContainer.appendChild(table);
}



const searchButton = document.getElementById('searchButton');
searchButton.addEventListener('click', performSearch);
