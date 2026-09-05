import { keccak256, encodePacked, stringToHex } from 'viem';

export interface IdentityCommitment {
  normalizedIdentifier: string;
  identifierHash: `0x${string}`;
  salt: `0x${string}`;
  commitment: `0x${string}`;
  paymentId: `0x${string}`;
}

export class IdentityService {
  /**
   * Normalizes an identifier (phone number, email, or username)
   */
  public static normalizeIdentifier(rawIdentifier: string): string {
    const trimmed = rawIdentifier.trim().toLowerCase();
    // If phone number, strip hyphens, spaces, and brackets
    if (trimmed.startsWith('+') || /^\d+$/.test(trimmed.replace(/[\s\-\(\)]/g, ''))) {
      return trimmed.replace(/[\s\-\(\)]/g, '');
    }
    return trimmed;
  }

  /**
   * Hashes normalized recipient identifier using keccak256
   */
  public static hashIdentifier(identifier: string): `0x${string}` {
    const normalized = this.normalizeIdentifier(identifier);
    return keccak256(stringToHex(normalized));
  }

  /**
   * Generates a cryptographically secure 32-byte secret salt
   */
  public static generateSecretSalt(): `0x${string}` {
    const randomBytes = new Uint8Array(32);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(randomBytes);
    } else {
      // Fallback for Node/test environment
      const crypto = require('crypto');
      const buf = crypto.randomBytes(32);
      return `0x${buf.toString('hex')}` as `0x${string}`;
    }
    const hex = Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return `0x${hex}` as `0x${string}`;
  }

  /**
   * Computes the on-chain cryptographic commitment:
   * keccak256(abi.encodePacked(identifierHash, salt))
   */
  public static computeCommitment(
    identifierHash: `0x${string}`,
    salt: `0x${string}`
  ): `0x${string}` {
    return keccak256(
      encodePacked(['bytes32', 'bytes32'], [identifierHash, salt])
    );
  }

  /**
   * Generates a unique, non-colliding paymentId for Monad Escrow
   */
  public static generatePaymentId(
    senderAddress: `0x${string}`,
    commitment: `0x${string}`,
    nonce: number = Date.now()
  ): `0x${string}` {
    return keccak256(
      encodePacked(
        ['address', 'bytes32', 'uint256'],
        [senderAddress, commitment, BigInt(nonce)]
      )
    );
  }

  /**
   * Bundles full Zero-PII commitment package for a given recipient
   */
  public static createCommitmentPackage(
    senderAddress: `0x${string}`,
    rawIdentifier: string
  ): IdentityCommitment {
    const normalizedIdentifier = this.normalizeIdentifier(rawIdentifier);
    const identifierHash = this.hashIdentifier(normalizedIdentifier);
    const salt = this.generateSecretSalt();
    const commitment = this.computeCommitment(identifierHash, salt);
    const paymentId = this.generatePaymentId(senderAddress, commitment);

    return {
      normalizedIdentifier,
      identifierHash,
      salt,
      commitment,
      paymentId,
    };
  }
}
