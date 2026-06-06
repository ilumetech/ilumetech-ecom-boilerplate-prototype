import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  private encryptTimers(number: string): string {
    const key = Buffer.from('79540e250fdb16afac03e19c46dbdeb3', 'hex');
    const iv = Buffer.from('eb2bb9425e81ffa942522e4414e95bd0', 'hex');
    const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
    let encrypted = cipher.update(number, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encodeURIComponent(encrypted);
  }

  private normalizeCourier(courier?: string | null): string {
    if (!courier) return 'JET';
    const c = courier.toLowerCase().trim();
    if (c.includes('j&t') || c.includes('jnt') || c.includes('jet')) return 'JET';
    if (c.includes('jne')) return 'JNE';
    if (c.includes('sicepat')) return 'SICEPAT';
    if (c.includes('pos')) return 'POS';
    if (c.includes('anteraja')) return 'ANTERAJA';
    if (c.includes('ninja')) return 'NINJA';
    if (c.includes('lion')) return 'LION';
    if (c.includes('wahana')) return 'WAHANA';
    if (c.includes('tiki')) return 'TIKI';
    return 'JET';
  }

  async track(courier: string | null, noresi: string) {
    const courierCode = this.normalizeCourier(courier);
    try {
      const startUrl = `https://cekresi.com/?noresi=${noresi}&e=${courierCode}`;
      const res = await fetch(startUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      const html = await res.text();

      const viewstateMatch = html.match(/name=["']viewstate["'][^>]*value=["']([^"']+)["']/i) || 
                             html.match(/value=["']([^"']+)["'][^>]*name=["']viewstate["']/i);
      const secretKeyMatch = html.match(/name=["']secret_key["'][^>]*value=["']([^"']+)["']/i) || 
                             html.match(/value=["']([^"']+)["'][^>]*name=["']secret_key["']/i);
                             
      const viewstate = viewstateMatch ? viewstateMatch[1] : '';
      const secret_key = secretKeyMatch ? secretKeyMatch[1] : '';

      if (!viewstate || !secret_key) {
        throw new BadRequestException('Failed to retrieve validation tokens from tracker');
      }

      const timers = this.encryptTimers(noresi);
      const postUrl = 'https://apa2.cekresi.com/cekresi/resi/initialize.php?ui=dad9643acec71f85853608db54345ada&p=1&w=chfj6h';
      
      const bodyParams = new URLSearchParams();
      bodyParams.append('viewstate', viewstate);
      bodyParams.append('secret_key', secret_key);
      bodyParams.append('e', courierCode);
      bodyParams.append('noresi', noresi);
      bodyParams.append('timers', decodeURIComponent(timers));

      const postRes = await fetch(postUrl, {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Origin': 'https://cekresi.com',
          'Referer': 'https://cekresi.com/'
        },
        body: bodyParams.toString()
      });

      const resultHtml = await postRes.text();

      if (resultHtml.includes('alert-warning') || resultHtml.includes('belum dapat kami lacak') || resultHtml.includes('tidak ditemukan')) {
        throw new BadRequestException('Receipt number not found or temporarily untrackable');
      }

      // Parse metadata & history
      return this.parseTrackingHtml(resultHtml, courierCode, noresi);
    } catch (err: any) {
      this.logger.error(`Failed tracking resi ${noresi} (${courierCode}): ${err.message}`);
      throw new BadRequestException(err.message || 'Tracking failed');
    }
  }

  private parseTrackingHtml(html: string, defaultCourier: string, noresi: string) {
    // 1. Status resi
    const statusMatch = html.match(/id=["']status_resi["'][^>]*>([^<]+)</i);
    // 2. Last position
    const lastPositionMatch = html.match(/id=["']last_position["'][^>]*>([^<]+)</i);
    // 3. Expedisi name
    const courierMatch = html.match(/id=["']nama_expedisi["'][^>]*>([^<]+)</i) || 
                         html.match(/<strong[^>]*>([^<]+)<\/strong>\s*:\s*<strong[^>]*>[^<]+<\/strong>\s*untuk/i);

    // 4. Fields (Dikirim oleh, Dikirim ke, Dikirim tanggal)
    const getValueForLabel = (label: string): string => {
      const regex = new RegExp(`<td>\\s*${label}\\s*</td>\\s*<td>\\s*:\\s*</td>\\s*<td>\\s*([^<]+)\\s*</td>`, 'i');
      const m = html.match(regex);
      return m ? m[1].replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() : '';
    };

    const sender = getValueForLabel('Dikirim oleh');
    const destination = getValueForLabel('Dikirim ke') || getValueForLabel('Tujuan');
    const shippingDate = getValueForLabel('Dikirim tanggal') || getValueForLabel('Tanggal');

    // 5. History rows
    const history: Array<{ date: string; description: string }> = [];
    const rowRegex = /<tr>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<\/tr>/gi;
    let match;
    while ((match = rowRegex.exec(html)) !== null) {
      const date = match[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
      const description = match[2].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
      
      if (date && description && !date.toLowerCase().includes('tanggal') && !description.toLowerCase().includes('keterangan')) {
        history.push({ date, description });
      }
    }

    return {
      courier: courierMatch ? courierMatch[1].trim() : defaultCourier,
      trackingCode: noresi,
      status: statusMatch ? statusMatch[1].trim() : 'UNKNOWN',
      sender: sender || undefined,
      destination: destination || undefined,
      shippingDate: shippingDate || undefined,
      recipient: lastPositionMatch ? lastPositionMatch[1].trim() : undefined,
      history
    };
  }
}
