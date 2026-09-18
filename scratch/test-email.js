import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const keyMatch = envContent.match(/VITE_RESEND_API_KEY=([^\r\n]+)/);
const fromMatch = envContent.match(/VITE_RESEND_FROM=([^\r\n]+)/);

const apiKey = keyMatch ? keyMatch[1].trim() : '';
const from = fromMatch ? fromMatch[1].trim() : 'onboarding@resend.dev';

console.log('Testing Resend Integration...');
console.log('Using API key:', apiKey.slice(0, 8) + '...' + apiKey.slice(-4));
console.log('Using From address:', from);

async function testEmail() {
  const testPayload = {
    from: `Beyini <${from}>`,
    to: ['delivered@resend.dev'],
    subject: '💰 Test Payment Claim: 10.00 USDC on Monad Testnet',
    html: `
      <div style="font-family: sans-serif; padding: 20px; background: #0F0E17; color: #FFF; border-radius: 12px;">
        <h2 style="color: #836EF9;">Monad Metropolis • Beyini Escrow</h2>
        <p>You received <strong>10.00 USDC</strong> on Monad Testnet!</p>
        <p>Claim URL: <a href="https://beyini.app/#claim?p=sample" style="color: #FF6B35;">Claim Your Funds</a></p>
      </div>
    `
  };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testPayload)
  });

  const data = await res.json();
  console.log('Resend Response Status:', res.status);
  console.log('Resend Response Data:', data);

  if (res.ok && data.id) {
    console.log('SUCCESS: Resend Email was accepted with ID:', data.id);
  } else {
    console.error('FAILURE:', data);
    process.exit(1);
  }
}

testEmail().catch((err) => {
  console.error(err);
  process.exit(1);
});
