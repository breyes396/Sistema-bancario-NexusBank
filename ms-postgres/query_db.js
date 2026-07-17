import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const baseUrl = 'https://nexusbank-postgres.onrender.com/api/v1';

async function test() {
  const user = {
    id: 'usr_WvWQ9TdnZEw6',
    email: 'byronstevepinedaluna@gmail.com',
    role: 'Client',
    name: 'Byron Steve Pineda Luna'
  };

  const secret = process.env.JWT_SECRET || 'MyVerySecretKeyForJWTTokenAuthenticationWith256Bits!';
  const token = jwt.sign({ user }, secret, { expiresIn: '1h' });

  console.log('Generated Token:', token);

  console.log('\nFetching reversal requests GET from Render...');
  try {
    const getResponse = await fetch(`${baseUrl}/accounts/reversal-requests`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const getData = await getResponse.json();
    console.log('GET status:', getResponse.status);
    console.log('GET response:', JSON.stringify(getData, null, 2));

  } catch (error) {
    console.error('Error fetching:', error);
  }
}

test();
