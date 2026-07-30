import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly key: Buffer;

  constructor(private readonly config: ConfigService) {
    const keyHex = this.config.get<string>('encryption.aadhaarKey') || 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6';
    // Ensure key is 32 bytes (AES-256)
    this.key = Buffer.from(keyHex.padEnd(64, '0').slice(0, 64), 'hex');
  }

  /**
   * Encrypt a sensitive text (e.g. Aadhaar) using AES-256-GCM
   */
  encrypt(text: string): string {
    if (!text) return '';
    try {
      const iv = crypto.randomBytes(12); // 96-bit IV for GCM
      const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag().toString('hex');
      // Return iv:authTag:encrypted
      return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (error) {
      this.logger.error('Failed to encrypt data', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt ciphertext (iv:authTag:encrypted)
   */
  decrypt(cipherText: string): string {
    if (!cipherText) return '';
    try {
      const parts = cipherText.split(':');
      if (parts.length !== 3) return '';
      const [ivHex, authTagHex, encryptedHex] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      this.logger.error('Failed to decrypt data', error);
      return '';
    }
  }

  /**
   * Extracts last 4 digits of a string (e.g. Aadhaar)
   */
  getLast4(text: string): string {
    if (!text) return '';
    const clean = text.replace(/\D/g, '');
    return clean.length >= 4 ? clean.slice(-4) : clean;
  }
}
