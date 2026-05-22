import { type ChatFileItem } from '@lobechat/types';

import { type FileListItem } from '@/types/files';
import { type UploadFileItem } from '@/types/files/upload';

export interface PortalFileItem {
  fileType: string;
  id: string;
  isChatAttachment?: boolean;
  name: string;
  size: number;
  sourceType?: string;
  updatedAt?: Date;
  url?: string;
}

export const isManagedPortalFile = (item: FileListItem) => item.sourceType === 'file';

export const mergePortalFiles = (
  managedFiles: FileListItem[] = [],
  chatFiles: ChatFileItem[] = [],
): PortalFileItem[] => {
  const items = new Map<string, PortalFileItem>();

  for (const file of managedFiles) {
    if (!isManagedPortalFile(file)) continue;

    items.set(file.id, {
      fileType: file.fileType,
      id: file.id,
      name: file.name,
      size: file.size,
      sourceType: file.sourceType,
      updatedAt: file.updatedAt,
      url: file.url,
    });
  }

  for (const file of chatFiles) {
    if (items.has(file.id)) continue;

    items.set(file.id, {
      fileType: file.fileType,
      id: file.id,
      isChatAttachment: true,
      name: file.name,
      size: file.size,
    });
  }

  return Array.from(items.values());
};

export const getActiveUploadCount = (items: UploadFileItem[]) =>
  items.filter((item) => item.status === 'pending' || item.status === 'uploading').length;
