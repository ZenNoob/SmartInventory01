import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.BACKEND_URL || 'http://localhost:3001/api';

async function getAuthHeaders(request: NextRequest): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Try to get from request headers first
  let token = request.headers.get('authorization');
  let storeId = request.headers.get('x-store-id');
  
  // If not in headers, try cookies
  if (!token) {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth_token');
    if (authCookie) {
      token = `Bearer ${authCookie.value}`;
    }
  }
  
  if (!storeId) {
    const cookieStore = await cookies();
    const storeCookie = cookieStore.get('store_id');
    if (storeCookie) {
      storeId = storeCookie.value;
    }
  }
  
  if (token) headers['Authorization'] = token;
  if (storeId) headers['X-Store-Id'] = storeId;
  
  return headers;
}

export async function GET(request: NextRequest) {
  try {
    const headers = await getAuthHeaders(request);
    
    const response = await fetch(`${API_URL}/suppliers`, { headers });
    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const headers = await getAuthHeaders(request);
    const body = await request.json();
    
    const response = await fetch(`${API_URL}/suppliers`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
