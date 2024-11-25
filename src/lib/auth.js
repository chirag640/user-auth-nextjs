export async function verifyToken(token) {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET); // Use TextEncoder for Web Crypto
  
    // Decode JWT
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !signatureB64) {
      throw new Error('Invalid token structure');
    }
  
    const data = `${headerB64}.${payloadB64}`;
    const signature = Uint8Array.from(atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')), (c) =>
      c.charCodeAt(0)
    );
  
    // Verify Signature
    const isValid = await crypto.subtle.verify(
      'HMAC',
      await crypto.subtle.importKey(
        'raw',
        secret,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
      ),
      signature,
      new TextEncoder().encode(data)
    );
  
    if (!isValid) {
      throw new Error('Invalid token signature');
    }
  
    // Decode payload
    const payloadJson = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson);
  
    if (payload.exp && payload.exp < Date.now() / 1000) {
      throw new Error('Token has expired');
    }
  
    return payload;
  }
  