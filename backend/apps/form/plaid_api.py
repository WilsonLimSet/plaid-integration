import plaid
from plaid.api import plaid_api
from plaid.model.products import Products
from plaid.model.country_code import CountryCode
from django.conf import settings

# Configuration setup
configuration = plaid.Configuration(
    host=plaid.Environment.Sandbox,
    api_key={
        "clientId": settings.PLAID_CLIENT_ID,
        "secret": settings.PLAID_SECRET,
    },
)

# Create API client
api_client = plaid.ApiClient(configuration)
client = plaid_api.PlaidApi(api_client)

# Define products and country codes
PLAID_PRODUCTS = [Products("identity")]
PLAID_COUNTRY_CODES = [CountryCode("US")]
