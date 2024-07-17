"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePlaidLink } from "react-plaid-link";
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

interface Address {
  street: string;
  city: string;
  region: string;
  postal_code: string;
  country: string;
}

interface Identity {
  name: string;
  email: string;
  primary_phone_number: string;
  primary_phone_type: string;
  primary_address: Address;
}

interface IdentityData {
  identities: Identity[];
  request_id: string;
}

interface AttributeConfig {
  name: boolean;
  email: boolean;
  phone: boolean;
  address: boolean;
}

export default function Home() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [identityData, setIdentityData] = useState<IdentityData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attributeConfig, setAttributeConfig] = useState<AttributeConfig>({
    name: true,
    email: true,
    phone: true,
    address: true,
  });

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [phoneType, setPhoneType] = useState<string>("");
  const [address, setAddress] = useState<string>("");

  const fetchLinkToken = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/create_link_token/`
      );
      console.log("Link token response:", response.data);
      if (response.data.link_token) {
        setLinkToken(response.data.link_token);
      } else {
        throw new Error("No link token in response");
      }
    } catch (err) {
      console.error("Error fetching link token:", err);
      setError("Failed to initialize Plaid. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLinkToken();
  }, [fetchLinkToken]);

  const onSuccess = useCallback(async (publicToken: string, metadata: any) => {
    console.log("Plaid Link success", metadata);
    setIsLoading(true);
    setError(null);
    try {
      const exchangeResponse = await axios.post(
        `${API_BASE_URL}/api/set_access_token/`,
        {
          public_token: publicToken,
        }
      );
      console.log("Access token set:", exchangeResponse.data);

      const identityResponse = await axios.post(
        `${API_BASE_URL}/api/get_identity/`,
        {
          access_token: exchangeResponse.data.access_token,
        }
      );
      console.log("Full Identity Response:", identityResponse.data);

      const ownerData = identityResponse.data.identities[0];
      setName(ownerData.name);
      setEmail(ownerData.email);
      setPhoneNumber(ownerData.primary_phone_number);
      setPhoneType(ownerData.primary_phone_type);
      setAddress(
        `${ownerData.primary_address.street}, ${ownerData.primary_address.city}, ${ownerData.primary_address.region} ${ownerData.primary_address.postal_code}, ${ownerData.primary_address.country}`
      );

      setIdentityData(identityResponse.data);
    } catch (err) {
      console.error("Error processing Plaid data:", err);
      setError("Failed to fetch user data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const config = {
    token: linkToken,
    onSuccess,
    onExit: (err, metadata) => {
      console.log("Plaid Link exited", err, metadata);
      if (err != null) {
        setError("Connection process exited. Please try again.");
      }
    },
    onEvent: (eventName, metadata) => {
      console.log("Plaid Link event", eventName, metadata);
    },
  };

  const { open, ready } = usePlaidLink(config);

  const handleAttributeChange = (attribute: keyof AttributeConfig) => {
    setAttributeConfig((prev) => ({ ...prev, [attribute]: !prev[attribute] }));
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-6">
      <h1 className="text-4xl font-bold mb-6 text-gray-800">
        Plaid Integration
      </h1>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-2 text-gray-700 ">
          Configure Attributes
        </h2>
        {Object.keys(attributeConfig).map((attr) => (
          <label key={attr} className="inline-flex items-center mr-4">
            <input
              type="checkbox"
              checked={attributeConfig[attr as keyof AttributeConfig]}
              onChange={() =>
                handleAttributeChange(attr as keyof AttributeConfig)
              }
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span className="ml-2 text-gray-700 capitalize">{attr}</span>
          </label>
        ))}
      </div>

      <button
        onClick={() => {
          console.log("Button clicked, opening Plaid");
          open();
        }}
        disabled={!ready || isLoading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400 mb-4"
      >
        {isLoading ? "Loading..." : "Connect a bank account"}
      </button>

      <div className="bg-white p-6 rounded shadow-md w-full max-w-4xl mb-6">
        <h2 className="text-2xl font-bold mb-4">Identity Data</h2>
        {attributeConfig.name && (
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        )}
        {attributeConfig.email && (
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        )}
        {attributeConfig.phone && (
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Phone</label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            <label className="block text-gray-700 font-bold mb-2">
              Phone Type
            </label>
            <input
              type="text"
              value={phoneType}
              onChange={(e) => setPhoneType(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        )}
        {attributeConfig.address && (
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">
              Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        )}
      </div>
    </main>
  );
}
