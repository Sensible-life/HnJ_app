import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface WatermarkMeta {
  hotelName: string;
  roomLabel: string;
  capturedAt: string;
}

const UPLOAD_DIR = join(process.cwd(), 'uploads');

@Injectable()
export class MediaService {
  private async ensureUploadDir() {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }

  private buildWatermarkSvg(meta: WatermarkMeta, width: number): string {
    const text = `${meta.hotelName} | ${meta.roomLabel} | ${meta.capturedAt}`;
    const fontSize = Math.max(14, Math.round(width * 0.022));
    const paddingX = Math.round(fontSize * 0.8);
    const boxHeight = Math.round(fontSize * 2);
    return `
      <svg width="${width}" height="${boxHeight}">
        <rect x="0" y="0" width="${width}" height="${boxHeight}" fill="rgba(0,0,0,0.45)" />
        <text x="${width - paddingX}" y="${boxHeight / 2 + fontSize / 3}"
          text-anchor="end" font-size="${fontSize}" fill="#FFFFFF"
          font-family="sans-serif">${text}</text>
      </svg>`;
  }

  /**
   * FR-MED-01: 촬영 시 [호텔명 | 객실번호 | 촬영일시] 자동 각인.
   * 실제로는 클라이언트 촬영 직후 즉시 업로드되며, 워터마크는 서버에서 합성한다
   * (기기별 폰트/캔버스 차이 없이 항상 동일한 결과를 보장하기 위함).
   */
  async saveWithWatermark(buffer: Buffer, meta: WatermarkMeta): Promise<{ id: string; url: string }> {
    await this.ensureUploadDir();

    const image = sharp(buffer).rotate(); // EXIF orientation 보정
    const metadata = await image.metadata();
    const width = metadata.width ?? 1080;
    const watermarkSvg = Buffer.from(this.buildWatermarkSvg(meta, width));

    const id = randomUUID();
    const filename = `${id}.jpg`;
    const outputBuffer = await image
      .composite([{ input: watermarkSvg, gravity: 'south' }])
      .jpeg({ quality: 82 })
      .toBuffer();

    await writeFile(join(UPLOAD_DIR, filename), outputBuffer);

    return { id, url: `/uploads/${filename}` };
  }
}
