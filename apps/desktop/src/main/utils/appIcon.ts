import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { SKRSContext2D } from '@napi-rs/canvas';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { nativeImage } from 'electron';

import { appStorageDir, buildDir } from '@/const/dir';
import { isDev } from '@/const/env';

const CUSTOM_APP_ICON_DIR = join(appStorageDir, 'branding');
const CUSTOM_APP_ICON_PATH = join(CUSTOM_APP_ICON_DIR, 'app-icon.png');
const CUSTOM_APP_ICON_CANVAS_SIZE = 1024;
const CUSTOM_APP_ICON_INSET = 112;
const CUSTOM_APP_ICON_PLATE_SIZE = CUSTOM_APP_ICON_CANVAS_SIZE - CUSTOM_APP_ICON_INSET * 2;
const CUSTOM_APP_ICON_RADIUS = 180;
export const CUSTOM_APP_ICON_VERSION = 1;

export const APP_ICON_FILE_FILTERS = [
  {
    extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'ico', 'icns'],
    name: 'Images',
  },
] as const;

export const getDefaultAppIconPath = () => join(buildDir, isDev ? 'icon-dev.png' : 'icon.png');

export const resolveStoredAppIconPath = (iconPath?: string) => {
  if (!iconPath) return undefined;

  const icon = nativeImage.createFromPath(iconPath);
  if (icon.isEmpty()) return undefined;

  return iconPath;
};

export const getResolvedAppIconPath = (iconPath?: string) =>
  resolveStoredAppIconPath(iconPath) ?? getDefaultAppIconPath();

export const getResolvedAppIcon = (iconPath?: string) => {
  const resolvedPath = getResolvedAppIconPath(iconPath);
  const icon = nativeImage.createFromPath(resolvedPath);

  if (icon.isEmpty()) {
    throw new Error(`Failed to load app icon from ${resolvedPath}`);
  }

  return icon;
};

const drawRoundedSquare = (ctx: SKRSContext2D, x: number, y: number, size: number) => {
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, CUSTOM_APP_ICON_RADIUS);
  ctx.closePath();
};

export const createNormalizedAppIconBuffer = async (input: Buffer | Uint8Array) => {
  const image = await loadImage(input);

  const plateCanvas = createCanvas(CUSTOM_APP_ICON_PLATE_SIZE, CUSTOM_APP_ICON_PLATE_SIZE);
  const plateContext = plateCanvas.getContext('2d');

  plateContext.clearRect(0, 0, CUSTOM_APP_ICON_PLATE_SIZE, CUSTOM_APP_ICON_PLATE_SIZE);
  plateContext.save();
  drawRoundedSquare(plateContext, 0, 0, CUSTOM_APP_ICON_PLATE_SIZE);
  plateContext.clip();

  const scale = Math.min(
    CUSTOM_APP_ICON_PLATE_SIZE / image.width,
    CUSTOM_APP_ICON_PLATE_SIZE / image.height,
  );
  const drawWidth = Math.max(1, Math.round(image.width * scale));
  const drawHeight = Math.max(1, Math.round(image.height * scale));
  const drawX = (CUSTOM_APP_ICON_PLATE_SIZE - drawWidth) / 2;
  const drawY = (CUSTOM_APP_ICON_PLATE_SIZE - drawHeight) / 2;

  plateContext.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  plateContext.restore();

  const canvas = createCanvas(CUSTOM_APP_ICON_CANVAS_SIZE, CUSTOM_APP_ICON_CANVAS_SIZE);
  const context = canvas.getContext('2d');

  context.clearRect(0, 0, CUSTOM_APP_ICON_CANVAS_SIZE, CUSTOM_APP_ICON_CANVAS_SIZE);
  context.drawImage(plateCanvas, CUSTOM_APP_ICON_INSET, CUSTOM_APP_ICON_INSET);

  return canvas.encode('png');
};

export const normalizeStoredAppIcon = async (iconPath: string) => {
  const icon = nativeImage.createFromPath(iconPath);

  if (icon.isEmpty()) {
    throw new Error(`Failed to load custom app icon from ${iconPath}`);
  }

  const normalizedIcon = await createNormalizedAppIconBuffer(icon.toPNG());
  await writeFile(iconPath, normalizedIcon);
};

export const persistCustomAppIcon = async (sourcePath: string) => {
  const icon = nativeImage.createFromPath(sourcePath);

  if (icon.isEmpty()) {
    throw new Error('Selected file is not a valid image');
  }

  await mkdir(CUSTOM_APP_ICON_DIR, { recursive: true });
  const normalizedIcon = await createNormalizedAppIconBuffer(icon.toPNG());
  await writeFile(CUSTOM_APP_ICON_PATH, normalizedIcon);

  return CUSTOM_APP_ICON_PATH;
};

export const removeCustomAppIcon = async () => rm(CUSTOM_APP_ICON_PATH, { force: true });
