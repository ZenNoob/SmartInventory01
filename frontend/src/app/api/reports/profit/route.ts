import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.BACKEND_URL || 'http://localhost:3001/api';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization');
    const storeId = request.headers.get('x-store-id');
    const searchParams = request.nextUrl.searchParams.toString();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) headers['Authorization'] = token;
    if (storeId) headers['X-Store-Id'] = storeId;
    
    const url = searchParams ? `${API_URL}/reports/profit?${searchParams}` : `${API_URL}/reports/profit`;
    const response = await fetch(url, { headers });
    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
