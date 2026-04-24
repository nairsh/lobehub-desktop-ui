import { existsSync } from 'node:fs';

import { createCanvas, loadImage } from '@napi-rs/canvas';
import { nativeImage } from 'electron';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildDir } from '@/const/dir';
import { createNormalizedAppIconBuffer, getDefaultAppIconPath, getResolvedAppIcon } from '../appIcon';

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
}));

vi.mock('electron', () => ({
  app: {
    isPackaged: false,
  },
  nativeImage: {
    createEmpty: vi.fn(() => ({ isEmpty: () => true })),
    createFromPath: vi.fn(),
  },
}));

vi.mock('@/const/dir', () => ({
  appStorageDir: '/mock/app-storage',
  buildDir: '/mock/build',
}));

vi.mock('@/const/env', () => ({
  isDev: false,
}));

const getAlphaAt = (rgba: Uint8ClampedArray, size: number, x: number, y: number) =>
  rgba[(y * size + x) * 4 + 3];

describe('appIcon', () => {
  const originalResourcesPath = process.resourcesPath;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(process, 'resourcesPath', {
      configurable: true,
      value: '/mock/resources',
    });
  });

  afterEach(() => {
    Object.defineProperty(process, 'resourcesPath', {
      configurable: true,
      value: originalResourcesPath,
    });
  });

  it('should normalize a raw square image into an inset rounded app icon', async () => {
    const sourceCanvas = createCanvas(512, 512);
    const sourceContext = sourceCanvas.getContext('2d');

    sourceContext.fillStyle = '#FFFFFF';
    sourceContext.fillRect(0, 0, 512, 512);
    sourceContext.strokeStyle = '#000000';
    sourceContext.lineCap = 'round';
    sourceContext.lineWidth = 28;
    sourceContext.beginPath();
    sourceContext.moveTo(168, 132);
    sourceContext.lineTo(256, 88);
    sourceContext.lineTo(344, 132);
    sourceContext.moveTo(256, 88);
    sourceContext.lineTo(256, 392);
    sourceContext.moveTo(168, 312);
    sourceContext.quadraticCurveTo(256, 252, 344, 312);
    sourceContext.stroke();

    const normalized = await createNormalizedAppIconBuffer(sourceCanvas.toBuffer('image/png'));
    const image = await loadImage(normalized);
    const outputCanvas = createCanvas(image.width, image.height);
    const outputContext = outputCanvas.getContext('2d');

    outputContext.drawImage(image, 0, 0);

    const { data } = outputContext.getImageData(0, 0, image.width, image.height);

    expect(image.width).toBe(1024);
    expect(image.height).toBe(1024);
    expect(getAlphaAt(data, image.width, 0, 0)).toBe(0);
    expect(getAlphaAt(data, image.width, 48, 512)).toBe(0);
    expect(getAlphaAt(data, image.width, 160, 512)).toBeGreaterThan(0);
    expect(getAlphaAt(data, image.width, 512, 512)).toBeGreaterThan(0);
  });

  it('should return the first existing candidate from icon path search', () => {
    const expectedCandidatePath = `${buildDir}/icon.ico`;
    vi.mocked(existsSync).mockImplementation((path) => path === expectedCandidatePath);

    expect(getDefaultAppIconPath()).toBe(expectedCandidatePath);
  });

  it('should fall back to a resources candidate when build candidates are missing', () => {
    const expectedCandidatePath = '/mock/resources/build/icon.png';
    vi.mocked(existsSync).mockImplementation((path) => path === expectedCandidatePath);

    expect(getDefaultAppIconPath()).toBe(expectedCandidatePath);
  });

  it('should load a fallback icon candidate when the first resolved icon is empty', () => {
    const expectedFallbackPath = '/mock/resources/icon.png';
    const fallbackIcon = {
      isEmpty: () => false,
    } as ReturnType<typeof nativeImage.createFromPath>;
    vi.mocked(existsSync).mockImplementation(
      (path) => path === '/mock/build/icon.png' || path === expectedFallbackPath,
    );

    vi.mocked(nativeImage.createFromPath).mockImplementation((path) => {
      if (path === '/mock/build/icon.png') {
        return { isEmpty: () => true } as ReturnType<typeof nativeImage.createFromPath>;
      }

      if (path === expectedFallbackPath) return fallbackIcon;

      return { isEmpty: () => true } as ReturnType<typeof nativeImage.createFromPath>;
    });

    expect(getResolvedAppIcon()).toBe(fallbackIcon);
  });

  it('should return an empty image instead of throwing when all app icons are missing', () => {
    vi.mocked(existsSync).mockReturnValue(false);
    const createFromPath = vi.mocked(nativeImage.createFromPath);
    const createEmpty = vi.mocked(nativeImage.createEmpty);
    const emptyImage = {
      isEmpty: () => true,
    } as ReturnType<typeof nativeImage.createFromPath>;

    createFromPath.mockReturnValue({
      isEmpty: () => true,
    } as ReturnType<typeof nativeImage.createFromPath>);
    createEmpty.mockReturnValue(emptyImage);

    expect(getResolvedAppIcon().isEmpty()).toBe(true);
    expect(createEmpty).toHaveBeenCalledTimes(1);
  });
});
