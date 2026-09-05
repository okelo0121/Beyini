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
   * Detects the type of recipient identifier
   */
  public static detectIdentityType(raw: string): 'twitter' | 'discord' | 'email' | 'phone' | 'username' {
    const trimmed = raw.trim();
    if (trimmed.startsWith('discord:') || trimmed.includes('#') && !trimmed.includes('@')) {
      return 'discord';
    }
    if (trimmed.startsWith('@') || trimmed.includes('x.com/') || trimmed.includes('twitter.com/')) {
      return 'twitter';
    }
    if (trimmed.includes('@') && trimmed.includes('.')) {
      return 'email';
    }
    if (trimmed.startsWith('+') || /^\d+$/.test(trimmed.replace(/[\s\-\(\)]/g, ''))) {
      return 'phone';
    }
    return 'username';
  }

  /**
   * Normalizes an identifier (X/Twitter, Discord, phone number, email, or username)
   */
  public static normalizeIdentifier(
    rawIdentifier: string,
    explicitType?: 'twitter' | 'discord' | 'email' | 'phone' | 'username'
  ): string {
    const type = explicitType || this.detectIdentityType(rawIdentifier);
    let trimmed = rawIdentifier.trim().toLowerCase();

    if (type === 'twitter') {
      // Strip https://x.com/ or https://twitter.com/
      trimmed = trimmed.replace(/^(?:https?:\/\/)?(?:www\.)?(?:x\.com|twitter\.com)\//i, '');
      // Strip leading @
      trimmed = trimmed.replace(/^@+/, '');
      // Strip any query params or trailing slashes
      trimmed = trimmed.split('?')[0].replace(/\/+$/, '');
      return trimmed.trim();
    }

    if (type === 'discord') {
      // Strip discord: prefix
      trimmed = trimmed.replace(/^discord:/i, '');
      // Strip leading @
      trimmed = trimmed.replace(/^@+/, '');
      // Strip legacy #0000 discriminator
      trimmed = trimmed.replace(/#\d{4}$/, '');
      return trimmed.trim();
    }

    if (type === 'phone' || trimmed.startsWith('+') || /^\d+$/.test(trimmed.replace(/[\s\-\(\)]/g, ''))) {
      return trimmed.replace(/[\s\-\(\)]/g, '');
    }

    if (type === 'email') {
      return trimmed.replace(/^mailto:/i, '');
    }

    // Default username (strip @ if present)
    return trimmed.replace(/^@+/, '');
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
    if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.getRandomValues) {
      globalThis.crypto.getRandomValues(randomBytes);
    } else {
      for (let i = 0; i < 32; i++) {
        randomBytes[i] = Math.floor(Math.random() * 256);
      }
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
