import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.BACKEND_URL || 'http://localhost:3001/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization');
    const storeId = request.headers.get('x-store-id');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) headers['Authorization'] = token;
    if (storeId) headers['X-Store-Id'] = storeId;
    
    console.log(`Proxying GET /api/purchases/${params.id} to ${API_URL}/purchases/${params.id}`);
    console.log('Headers:', headers);
    
    const response = await fetch(`${API_URL}/purchases/${params.id}`, { headers });
    const data = await response.json();
    
    console.log('Backend response status:', response.status);
    console.log('Backend response data:', data);
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization');
    const storeId = request.headers.get('x-store-id');
    const body = await request.json();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) headers['Authorization'] = token;
    if (storeId) headers['X-Store-Id'] = storeId;
    
    console.log(`Proxying PUT /api/purchases/${params.id} to ${API_URL}/purchases/${params.id}`);
    
    const response = await fetch(`${API_URL}/purchases/${params.id}`, {
      method: 'PUT',
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization');
    const storeId = request.headers.get('x-store-id');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) headers['Authorization'] = token;
    if (storeId) headers['X-Store-Id'] = storeId;
    
    console.log(`Proxying DELETE /api/purchases/${params.id} to ${API_URL}/purchases/${params.id}`);
    
    const response = await fetch(`${API_URL}/purchases/${params.id}`, {
      method: 'DELETE',
      headers,
    });
    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
