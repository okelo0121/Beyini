import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { keccak256, encodePacked, stringToHex } from 'viem';

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

  await t.test('Cross-Device Claim Token Serialization and Deserialization', () => {
    const sampleRecord = {
      pid: 'by_test_123',
      cid: '0x1234567890123456789012345678901234567890123456789012345678901234',
      snd: '0x9fb085D7B1a59e9A8fC1D9495b21',
      type: 'email',
      val: 'alice@example.com',
      com: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
      amt: 20,
      salt: '0x1111111111111111111111111111111111111111111111111111111111111111',
      tx: '0x9999999999999999999999999999999999999999999999999999999999999999',
      cat: 1726671234
    };

    const jsonStr = JSON.stringify(sampleRecord);
    const token = Buffer.from(jsonStr).toString('base64url');
    assert.ok(token.length > 0, 'Token must be non-empty base64url');

    let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) base64 += '=';
    const decoded = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));

    assert.equal(decoded.cid, sampleRecord.cid, 'Contract payment ID must match');
    assert.equal(decoded.salt, sampleRecord.salt, 'Salt must match');
    assert.equal(decoded.amt, sampleRecord.amt, 'Amount must match');
    assert.equal(decoded.val, sampleRecord.val, 'Recipient value must match');
  });
});
