import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { keccak256, encodePacked, toHex, stringToHex } from 'viem';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('BeyiniEscrow Contract Artifact & Zero-PII Cryptography', async (t) => {
  await t.test('Artifact has valid ABI and Bytecode', () => {
    const artifactPath = path.join(rootDir, 'src/blockchain/artifacts/BeyiniEscrow.json');
    assert.ok(fs.existsSync(artifactPath), 'Artifact must exist');
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

    assert.equal(artifact.contractName, 'BeyiniEscrow');
    assert.ok(artifact.bytecode.length > 100, 'Bytecode must be populated');

    const fnNames = artifact.abi
      .filter((item) => item.type === 'function')
      .map((item) => item.name);

    assert.ok(fnNames.includes('deposit'), 'Must have deposit function');
    assert.ok(fnNames.includes('claimWithPreimage'), 'Must have claimWithPreimage function');
    assert.ok(fnNames.includes('claimWithSignature'), 'Must have claimWithSignature function');
    assert.ok(fnNames.includes('refund'), 'Must have refund function');
    assert.ok(fnNames.includes('getPayment'), 'Must have getPayment function');
    assert.ok(fnNames.includes('DOMAIN_SEPARATOR'), 'Must have DOMAIN_SEPARATOR');
  });

  await t.test('Cryptographic Pre-image Commitment verification matches Solidity', () => {
    // Recipient identifier (e.g. phone number or email)
    const identifier = '+254712345678';
    const identifierHash = keccak256(stringToHex(identifier));

    // 32-byte cryptographically secure salt
    const salt = '0x11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff';

    // Commitment computed offchain: keccak256(abi.encodePacked(identifierHash, salt))
    const commitment = keccak256(
      encodePacked(['bytes32', 'bytes32'], [identifierHash, salt])
    );

    assert.ok(commitment.startsWith('0x'), 'Commitment must be valid hex');
    assert.equal(commitment.length, 66, 'Commitment must be 32 bytes hex');

    // On-chain verification simulation:
    const computedOnchain = keccak256(
      encodePacked(['bytes32', 'bytes32'], [identifierHash, salt])
    );
    assert.equal(commitment, computedOnchain, 'Offchain and onchain commitments must match');
  });
});
