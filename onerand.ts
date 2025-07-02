

/**
 * ONERAND - Secure random draw system
 * 
 * @version 1.0
 */

class OneError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'OneError';
  }
}
export class ONERAND {
  private version = "1.0";
  private initialized = false;
  private drawLink!: string;
  private participants!: any[];
  private config!: {
    slug: string;
    closedAt: number;
    hashAlgorithm: string;
    encoding: "hex";
  };

  constructor(drawLink: string) {
    this.drawLink = drawLink;
  }

  private async init() {
    if (this.initialized) return;
    try {
      const slug = this.drawLink.split('draw/')[1];

      if (!slug) {
        throw new OneError('Invalid draw link format', 'INVALID_LINK');
      }

      const response = await fetch(`http://localhost:5000/api/public/onerand?slug=${slug}`);

      if (!response.ok) {
        throw new OneError(`API request failed with status ${response.status}`, 'API_ERROR');
      }

      const data = await response.json();
      console.log("Draw Data:", data);

      const participants = data.participants;
      if (!participants || participants.length < data.minParticipants) {
        throw new OneError(
          `At least ${data.minParticipants} participants required`,
          'INSUFFICIENT_PARTICIPANTS'
        );
      }

      this.participants = [...participants].sort((a, b) => a.txId.localeCompare(b.txId));
      this.config = {
        //closedAt: data.closedAt,
        closedAt: new Date(data.closedAt).getTime(),
        slug: data.slug,
        hashAlgorithm: "SHA-512", // Web Crypto API
        encoding: "hex",
      };
      this.initialized = true;
    } catch (error) {
      throw error instanceof OneError ? error : new OneError('Initialization failed', 'INIT_ERROR');
    }
  }

  private delay(ms: number = 500) {
    return new Promise((resolve) => setTimeout(resolve, 200));
  }

  async chooseOne(onStep: (message: string) => void) {
    try {
      onStep("⏳ Loading data...");
      await this.init();
      await this.delay(2300);

      onStep("🔐 Generating secure seed...");
      await this.delay(1900);
      const seed = this.generateSeed();

      onStep("🔄 Calculating hash chain...");
      await this.delay(2400);
      const hash = await this.hashChain(seed);

      onStep("🎰 Recipient Choosing......");
      await this.delay(3000);
      const index = this.chooseRecipient(hash.stage2);
      const recipient = this.participants[index];

      onStep("🎉 Completed!");

      return {
        recipient,
        winnerIndex: index,
        totalParticipants: this.participants.length,
        seed,
        hashChain: hash,
        timestamp: new Date(this.config.closedAt).toISOString(),
        version: this.version,
      };
    } catch (error) {
      onStep("❌ Error occurred during draw");
      throw error instanceof OneError ? error : new OneError('Draw process failed', 'DRAW_ERROR');

    }
  }

  private generateSeed() {
    const fingerprint = this.participants.map(p => `${p.user.username}:${p.user.uuid}`).join("|");
    const timestamp = new Date(this.config.closedAt).toISOString().replace(/[^0-9]/g, "");
    return `${fingerprint}_${timestamp}_${this.config.slug}`;
  }

  private async hashChain(seed: string) {
    try {
      const encoder = new TextEncoder();
      const stage1Buffer = await crypto.subtle.digest("SHA-256", encoder.encode(seed));
      const stage2Buffer = await crypto.subtle.digest(this.config.hashAlgorithm, encoder.encode(seed + this.config.closedAt));
      return {
        stage1: this.bufferToHex(stage1Buffer),
        stage2: this.bufferToHex(stage2Buffer),
      };
    } catch (error) {
      throw new OneError('Hash computation failed', 'HASH_ERROR');
    }
  }

  private bufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  }

  private chooseRecipient(hash: string): number {
    try {
      const buffer = new Uint8Array(hash.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
      const hex = Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('');
      return Number(BigInt('0x' + hex) % BigInt(this.participants.length));
    } catch (error) {
      throw new OneError('Winner selection failed', 'SELECTION_ERROR');
    }
  }
}
