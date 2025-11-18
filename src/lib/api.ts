const API_BASE_URL = 'https://functions.poehali.dev';

export const API_ENDPOINTS = {
  auth: 'a01ea47e-7e59-4f72-9278-9601581b7b0e',
  users: 'f9ce7f74-6b2b-44d4-9505-72fb689a4374',
  bots: 'fee936e7-7794-4f0a-b8f3-73e64570ada5',
};

export const authenticateTelegram = async (authData: any) => {
  const response = await fetch(`${API_BASE_URL}/${API_ENDPOINTS.auth}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ authData }),
  });
  
  if (!response.ok) {
    throw new Error('Authentication failed');
  }
  
  return response.json();
};

export const createOrUpdateUser = async (userData: any) => {
  const response = await fetch(`${API_BASE_URL}/${API_ENDPOINTS.users}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create/update user');
  }
  
  return response.json();
};

export const getUser = async (telegramId: number) => {
  const response = await fetch(
    `${API_BASE_URL}/${API_ENDPOINTS.users}?telegram_id=${telegramId}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to get user');
  }
  
  return response.json();
};

export const getBots = async (userId: number) => {
  const response = await fetch(
    `${API_BASE_URL}/${API_ENDPOINTS.bots}?user_id=${userId}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to get bots');
  }
  
  return response.json();
};

export const createBot = async (botData: any) => {
  const response = await fetch(`${API_BASE_URL}/${API_ENDPOINTS.bots}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(botData),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create bot');
  }
  
  return response.json();
};

export const updateBot = async (botData: any) => {
  const response = await fetch(`${API_BASE_URL}/${API_ENDPOINTS.bots}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(botData),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update bot');
  }
  
  return response.json();
};
