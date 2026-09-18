import type { PaymentRecord } from './StorageService';
import { MONAD_USDC_ADDRESS } from '../auth/privyConfig';

export interface CompactClaimPayload {
  pid: string;
  cid: `0x${string}`;
  snd: string;
  type: 'email' | 'phone' | 'username' | 'twitter' | 'discord';
  val: string;
  com: `0x${string}`;
  amt: number;
  salt: `0x${string}`;
  tx: string;
  cat: number;
}

export class ClaimTokenService {
  /**
   * Encodes a PaymentRecord into a compact, URL-safe base64 string
   */
  public static encodePayment(record: PaymentRecord): string {
    const compact: CompactClaimPayload = {
      pid: record.payment_id,
      cid: record.contract_payment_id,
      snd: record.sender_address,
      type: record.recipient_identity_type,
      val: record.recipient_identity_value,
      com: record.recipient_identity_commitment,
      amt: record.amount,
      salt: record.salt,
      tx: record.deposit_tx_hash,
      cat: record.created_at,
    };

    try {
      const jsonStr = JSON.stringify(compact);
      // Safe base64 encoding for browser environment
      if (typeof window !== 'undefined' && window.btoa) {
        return window.btoa(unescape(encodeURIComponent(jsonStr)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
      }
      return Buffer.from(jsonStr).toString('base64url');
    } catch (e) {
      console.error('Failed to encode claim payload:', e);
      return record.payment_id;
    }
  }

  /**
   * Decodes a URL-safe base64 string or URL query parameters back into a PaymentRecord
   */
  public static decodePayment(tokenOrQuery: string): PaymentRecord | null {
    if (!tokenOrQuery) return null;

    let clean = tokenOrQuery.trim();

    // 1. Check if token contains query params (e.g. ?p=... or ?id=...&salt=...)
    if (clean.includes('?') || clean.includes('&') || clean.includes('=')) {
      const queryStr = clean.startsWith('?') || clean.startsWith('#') 
        ? clean.substring(clean.indexOf('?') !== -1 ? clean.indexOf('?') + 1 : 1) 
        : clean;
      
      const params = new URLSearchParams(queryStr);
      
      // If packed in 'p' parameter
      const pParam = params.get('p') || params.get('token');
      if (pParam) {
        clean = pParam;
      } else if (params.get('cid') || params.get('id')) {
        // Individual unpacked query parameters
        const cid = (params.get('cid') || params.get('id') || '') as `0x${string}`;
        const salt = (params.get('salt') || '') as `0x${string}`;
        const amt = parseFloat(params.get('amt') || params.get('amount') || '0');
        const type = (params.get('type') || 'email') as 'email' | 'phone' | 'username' | 'twitter' | 'discord';
        const val = params.get('val') || params.get('to') || '';
        const com = (params.get('com') || params.get('commit') || '') as `0x${string}`;
        const tx = params.get('tx') || '';
        const pid = params.get('pid') || `by_${Date.now()}`;
        const snd = params.get('snd') || '0x0000000000000000000000000000000000000000';

        if (cid && salt) {
          return {
            payment_id: pid,
            contract_payment_id: cid,
            sender_address: snd,
            recipient_identity_type: type,
            recipient_identity_value: val,
            recipient_identity_commitment: com,
            amount: amt,
            token_address: MONAD_USDC_ADDRESS,
            chain_id: 10143,
            deposit_tx_hash: tx,
            salt,
            status: 'SECURED',
            created_at: Math.floor(Date.now() / 1000),
          };
        }
      }
    }

    // 2. Decode base64url payload
    try {
      // Re-pad base64 string
      let base64 = clean.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4 !== 0) {
        base64 += '=';
      }

      let jsonStr = '';
      if (typeof window !== 'undefined' && window.atob) {
        jsonStr = decodeURIComponent(escape(window.atob(base64)));
      } else {
        jsonStr = Buffer.from(base64, 'base64').toString('utf8');
      }

      const parsed: CompactClaimPayload = JSON.parse(jsonStr);
      if (parsed && parsed.cid && parsed.salt) {
        return {
          payment_id: parsed.pid || `by_${parsed.cat || Date.now()}`,
          contract_payment_id: parsed.cid,
          sender_address: parsed.snd || '0x0000000000000000000000000000000000000000',
          recipient_identity_type: parsed.type || 'email',
          recipient_identity_value: parsed.val || '',
          recipient_identity_commitment: parsed.com || '0x0',
          amount: parsed.amt || 0,
          token_address: MONAD_USDC_ADDRESS,
          chain_id: 10143,
          deposit_tx_hash: parsed.tx || '',
          salt: parsed.salt,
          status: 'SECURED',
          created_at: parsed.cat || Math.floor(Date.now() / 1000),
        };
      }
    } catch {
      // Not a base64 encoded token, might be standard UUID
    }

    return null;
  }

  /**
   * Generates a fully qualified, self-contained cross-device claim URL
   */
  public static buildClaimUrl(record: PaymentRecord): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://beyini.paaco.xyz';
    const encoded = this.encodePayment(record);
    return `${origin}/#claim?p=${encodeURIComponent(encoded)}`;
  }
}
