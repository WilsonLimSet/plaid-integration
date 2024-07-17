from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from .plaid_api import client, PLAID_PRODUCTS, PLAID_COUNTRY_CODES
import json
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.item_public_token_exchange_request import (
    ItemPublicTokenExchangeRequest,
)
from plaid.model.identity_get_request import IdentityGetRequest
import time
import plaid
from .models import Identity


def create_link_token(request):
    try:
        request = LinkTokenCreateRequest(
            products=PLAID_PRODUCTS,
            client_name="Plaid Integration",
            country_codes=PLAID_COUNTRY_CODES,
            language="en",
            user=LinkTokenCreateRequestUser(client_user_id=str(time.time())),
        )
        response = client.link_token_create(request)
        return JsonResponse({"link_token": response["link_token"]})
    except plaid.ApiException as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
def set_access_token(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            public_token = data["public_token"]
            exchange_request = ItemPublicTokenExchangeRequest(public_token=public_token)
            exchange_response = client.item_public_token_exchange(exchange_request)
            access_token = exchange_response["access_token"]

            # should really be storing this securely
            return JsonResponse({"access_token": access_token})
        except plaid.ApiException as e:
            return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
def get_identity(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            access_token = data.get("access_token")
            if not access_token:
                return JsonResponse({"error": "No access token provided"}, status=400)

            identity_request = IdentityGetRequest(access_token=access_token)
            identity_response = client.identity_get(identity_request)

            # Extract relevant information
            accounts = identity_response["accounts"]
            identities = []
            for account in accounts:
                for owner in account["owners"]:
                    primary_address = next(
                        (
                            address["data"]
                            for address in owner.get("addresses", [])
                            if address.get("primary")
                        ),
                        {},
                    )
                    primary_phone = next(
                        (
                            phone
                            for phone in owner.get("phone_numbers", [])
                            if phone.get("primary")
                        ),
                        {},
                    )
                    if not primary_phone:  # If no primary phone is found, default to the first phone number
                        primary_phone = owner.get("phone_numbers", [{}])[0]

                    # Save identity to the database
                    identity = Identity.objects.create(
                        name=owner.get("names", [""])[0],
                        email=next(
                            (
                                email["data"]
                                for email in owner.get("emails", [])
                                if email.get("primary")
                            ),
                            "",
                        ),
                        primary_phone_number=primary_phone.get("data", ""),
                        primary_phone_type=primary_phone.get("type", ""),
                        street=primary_address.get("street", ""),
                        city=primary_address.get("city", ""),
                        region=primary_address.get("region", ""),
                        postal_code=primary_address.get("postal_code", ""),
                        country=primary_address.get("country", ""),
                    )

                    identities.append(
                        {
                            "name": owner.get("names", [""])[0],
                            "email": next(
                                (
                                    email["data"]
                                    for email in owner.get("emails", [])
                                    if email.get("primary")
                                ),
                                "",
                            ),
                            "primary_address": {
                                "street": primary_address.get("street", ""),
                                "city": primary_address.get("city", ""),
                                "region": primary_address.get("region", ""),
                                "postal_code": primary_address.get("postal_code", ""),
                                "country": primary_address.get("country", ""),
                            },
                            "primary_phone_number": primary_phone.get("data", ""),
                            "primary_phone_type": primary_phone.get("type", ""),
                        }
                    )
            print(identities)
            return JsonResponse({"identities": identities})
        except plaid.ApiException as e:
            print("Plaid API Exception:", str(e))
            return JsonResponse({"error": str(e)}, status=400)
    else:
        return JsonResponse({"error": "Invalid request method"}, status=405)
