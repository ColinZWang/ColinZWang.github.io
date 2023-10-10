from flask import Flask, request, jsonify, render_template
import requests
from ebay_oauth_token import OAuthToken


app = Flask(__name__)

@app.route("/", methods=['GET'])
def index():
    return app.send_static_file("index.html")

# eBay Credentials
APP_ID = 'ZixiWang-dummy-PRD-5fc9571dc-e3815a24'
CLIENT_SECRET = 'PRD-fc9571dc2408-8084-440a-b12d-c1e9'

BASE_EBAY_URL = 'https://svcs.ebay.com/services/search/FindingService/v1'
EBAY_SINGLE_ITEM_URL = 'https://open.api.ebay.com/shopping'
EBAY_PARAMS = {
    'OPERATION-NAME': 'findItemsAdvanced',
    'SERVICE-VERSION': '1.0.0',
    'SECURITY-APPNAME': APP_ID,
    'RESPONSE-DATA-FORMAT': 'JSON',
    'REST-PAYLOAD': True,
    'paginationInput.entriesPerPage': 10
}

oauth_utility = OAuthToken(APP_ID, CLIENT_SECRET)
application_token = oauth_utility.getApplicationToken()

headers = {
    "X-EBAY-API-IAF-TOKEN": oauth_utility.getApplicationToken()
}

@app.route('/api/search', methods=['GET'])
def search():
    # Get data from the frontend request
    keyword = request.args.get('keyword')
    priceFrom = request.args.get('priceFrom')
    priceTo = request.args.get('priceTo')
    sortOrder = request.args.get('sortOrder')
    conditions = request.args.get('condition')
    conditions = conditions.split(',') if conditions else []
    freeShipping = request.args.get('freeShipping') == 'true'
    expeditedShipping = request.args.get('expeditedShipping') == 'true'
    returnsAccepted = request.args.get('returnsAccepted') == 'true'

    # Construct eBay API URL with parameters
    EBAY_PARAMS['keywords'] = keyword
    if sortOrder:
        EBAY_PARAMS['sortOrder'] = sortOrder

    # Handling item filters
    item_filters = []

    if priceFrom and priceFrom.isdigit():
        item_filters.append({'name': 'MinPrice', 'value': priceFrom, 'paramName': 'Currency', 'paramValue': 'USD'})
    if priceTo and priceTo.isdigit():
        item_filters.append({'name': 'MaxPrice', 'value': priceTo, 'paramName': 'Currency', 'paramValue': 'USD'})
    if returnsAccepted:
        item_filters.append({'name': 'ReturnsAcceptedOnly', 'value': 'true'})
    if freeShipping:
        item_filters.append({'name': 'FreeShippingOnly', 'value': 'true'})
    if expeditedShipping:
        item_filters.append({'name': 'ExpeditedShippingType', 'value': 'Expedited'})
    if conditions:
        item_filters.append({'name': 'Condition', 'value': [str(cond) for cond in conditions]})

    for index, filter in enumerate(item_filters):
        for key, value in filter.items():
            param_name = f'itemFilter({index}).{key}'
            EBAY_PARAMS[param_name] = value

    response = requests.get(BASE_EBAY_URL, params=EBAY_PARAMS)
    if response.status_code == 200:
        data = response.json()
        items = data.get('findItemsAdvancedResponse', [{}])[0].get('searchResult', [{}])[0].get('item', [])
        
        filtered_items = []

        for item in items:
            item_id = item.get('itemId', [""])[0]
            name = item.get('title', [""])[0]
            category = item.get('primaryCategory', [{}])[0].get('categoryName', [""])[0]
            condition = item.get('condition', [{}])[0].get('conditionDisplayName', [""])[0]
            price_currency = item.get('sellingStatus', [{}])[0].get('currentPrice', [{}])[0].get('@currencyId', "")
            price_value = item.get('sellingStatus', [{}])[0].get('currentPrice', [{}])[0].get('__value__', "0.0")
            price = f"{price_currency} {price_value}"
            image = item.get('galleryURL', [""])[0]
            
            filtered_items.append({
                'itemId': item_id,
                'name': name,
                'category': category,
                'condition': condition,
                'price': price,
                'image': image
            })

        return jsonify(filtered_items)
    else:
        return jsonify({"error": "Unable to fetch data"}), 500



@app.route('/api/item/<item_id>', methods=['GET'])
def get_single_item(item_id):
    # Set the eBay endpoint URL
    single_item_url = f"https://open.api.ebay.com/shopping"
    
    # Set the necessary parameters for the eBay endpoint
    params = {
        "callname": "GetSingleItem",
        "responseencoding": "JSON",
        "appID": APP_ID,
        "siteid": '0',
        "version": '967',
        "IncludeSelector": "Description,Details,ItemSpecifics",
        "ItemID": item_id
    }
    
    # Retrieve the token and set it in headers
    headers = {
        "X-EBAY-API-IAF-TOKEN": oauth_utility.getApplicationToken()
    }
    
    # Send the request with parameters and headers
    response = requests.get(single_item_url, params=params, headers=headers)

    if response.status_code == 200:
        return jsonify(response.json())
    else:
        return jsonify({"error": "Unable to fetch item details"}), 500




if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
