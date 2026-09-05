import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createWalletClient, createPublicClient, http, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables from .env.local
const envPath = path.join(rootDir, '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.VITE_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'MonadExplorer', url: 'https://testnet.monadexplorer.com' },
  },
});

async function main() {
  const privateKey = process.env.MONAD_DEPLOYER_KEY || process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    console.error('Error: MONAD_DEPLOYER_KEY or DEPLOYER_PRIVATE_KEY is not set in .env.local');
    console.log('To deploy to Monad Testnet, set MONAD_DEPLOYER_KEY=0x... in .env.local and re-run.');
    process.exit(1);
  }

  const cleanKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
  const account = privateKeyToAccount(cleanKey);
  console.log(`Deployer address: ${account.address}`);

  const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain: monadTestnet,
    transport: http(),
  });

  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`Deployer MON balance: ${balance.toString()} wei`);

  const artifactPath = path.join(rootDir, 'src/blockchain/artifacts/BeyiniEscrow.json');
  if (!fs.existsSync(artifactPath)) {
    console.error('Artifact not found! Run "node scripts/compile.js" first.');
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  console.log('Deploying BeyiniEscrow to Monad Testnet...');

  // Constructor takes (address _trustedSigner)
  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: `0x${artifact.bytecode}`,
    args: [account.address],
  });

  console.log(`Deployment transaction submitted: ${hash}`);
  console.log(`Monad Explorer: https://testnet.monadexplorer.com/tx/${hash}`);

  console.log('Waiting for receipt on Monad single-slot finality...');
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`BeyiniEscrow deployed successfully at: ${receipt.contractAddress}`);

  // Append or update VITE_BEYINI_ESCROW_ADDRESS in .env.local
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  if (envContent.includes('VITE_BEYINI_ESCROW_ADDRESS=')) {
    envContent = envContent.replace(
      /VITE_BEYINI_ESCROW_ADDRESS=.*/g,
      `VITE_BEYINI_ESCROW_ADDRESS=${receipt.contractAddress}`
    );
  } else {
    envContent += `\nVITE_BEYINI_ESCROW_ADDRESS=${receipt.contractAddress}\n`;
  }
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log(`Updated .env.local with VITE_BEYINI_ESCROW_ADDRESS=${receipt.contractAddress}`);
}

main().catch((err) => {
  console.error('Deployment error:', err);
  process.exit(1);
});
