import { getCredentials } from "../_stub/data/setup";

export async function getAuthToken(baseUrl: string): Promise<string> {
  
  const credentials = getCredentials();

  if (credentials.length === 0) {
    throw new Error('No credentials available for authentication');
  }

  const credential = credentials[0];
  const response = await fetch(`${baseUrl}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      operatorId: credential.operatorId,
      password: credential.password,
    }),
  });

  if (!response.ok) {
    throw new Error(`Authentication failed: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function getAuthTokenWithoutIntegration(baseUrl: string): Promise<string> {
  
  const credentials = getCredentials();

  if (credentials.length < 2) {
    throw new Error('Second operator credentials not available for authentication');
  }

  const credential = credentials[1]; // Second operator without game integration
  const response = await fetch(`${baseUrl}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      operatorId: credential.operatorId,
      password: credential.password,
    }),
  });

  if (!response.ok) {
    throw new Error(`Authentication failed for operator without integration: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

export function getAuthHeader(token: string): { Authorization: string } {
  return {
    Authorization: `Bearer ${token}`,
  };
}
