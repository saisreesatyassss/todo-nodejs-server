import requests

def get_place_details(place_id, api_key, fields):
    """
    Function to get place details using the Google Places API.
    
    :param place_id: The place ID to get details for.
    :param api_key: Your Google Maps API key.
    :param fields: Comma-separated list of fields to include in the response.
    :return: Place details in JSON format.
    """
    url = f"https://places.googleapis.com/v1/places/{place_id}"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": fields
    }
    
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error: {response.status_code}")
        print(f"Response: {response.text}")
        response.raise_for_status()

# Your API key
api_key = "AIzaSyCyMAt9vx127yHj2Cp2VoTK8ROGWnF6aYM"

# Test the function with an example place ID and fields
place_id = "ChIJj61dQgK6j4AR4GeTYWZsKWw"
fields = "id,displayName,formattedAddress,plusCode"

try:
    place_details = get_place_details(place_id, api_key, fields)
    print(place_details)
except requests.exceptions.HTTPError as err:
    print(f"HTTP error occurred: {err}")
except Exception as err:
    print(f"Other error occurred: {err}")
