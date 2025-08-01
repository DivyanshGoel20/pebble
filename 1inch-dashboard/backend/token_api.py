import requests
import time
import os

API_KEY = os.getenv("API_KEY")
BASE_URL = "https://api.1inch.dev/token"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "accept": "application/json"
}

# for a list of providers check https://tokenlists.org/

def search_tokens(query, chain_id, limit=10, ignore_listed="false"):
    endpoint = f"{BASE_URL}/v1.2/{chain_id}/search"
    params = {
        "query": query,
        "limit": limit,
        "ignore_listed": ignore_listed
    }
    response = requests.get(endpoint, headers=HEADERS, params=params)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Failed to search tokens. Status code: {response.status_code}")
        return None

def get_tokens_info(chain_id, addresses):
    endpoint = f"{BASE_URL}/v1.2/{chain_id}/custom/{','.join(addresses)}"
    response = requests.get(endpoint, headers=HEADERS )
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Failed to get tokens info. Status code: {response.status_code}")
        return None

def get_all_tokens_info(chain_id, provider="1inch"):
    endpoint = f"{BASE_URL}/v1.2/{chain_id}"
    params = {
        "provider": provider,
    }
    response = requests.get(endpoint, headers=HEADERS, params=params)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Failed to get all tokens info. Status code: {response.status_code}")
        return None

def get_1inch_token_list(chain_id, provider="1inch"):
    endpoint = f"{BASE_URL}/v1.2/{chain_id}/token-list"
    params = {
        "provider": provider,
    }
    response = requests.get(endpoint, headers=HEADERS, params=params)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Failed to get 1inch token list. Status code: {response.status_code}")
        return None


if __name__ == "__main__":
    # Step 3: Search for tokens
    search_query = "1inch"
    chain_id = 1  # Replace with the chain ID you want to search on
    search_results = search_tokens(search_query, chain_id)
    print("Search Results:")
    print(search_results)
    # sleep one second because of RPS limit
    time.sleep(1)

    # Step 4: Get detailed information about specific tokens
    token_addresses = ["0x111111111117dc0aa78b770fa6a738034120c302"]  # Replace with token addresses you want to query
    tokens_info = get_tokens_info(chain_id, token_addresses)
    print("Tokens Info:")
    print(tokens_info)
    # sleep one second because of RPS limit
    time.sleep(1)

    # Step 5: Get information about all tokens on a token list
    all_tokens_info = get_all_tokens_info(chain_id)
    print("All Tokens Info:")
    print(all_tokens_info)
    # sleep one second because of RPS limit
    time.sleep(1)

    # Step 6: Get 1inch token list
    token_list = get_1inch_token_list(chain_id)
    print("1inch Token List:")
    print(token_list)