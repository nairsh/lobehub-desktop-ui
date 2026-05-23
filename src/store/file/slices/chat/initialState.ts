import { type ChatContextContent } from '@lobechat/types';

import { type UploadFileItem } from '@/types/files/upload';

export interface ImageFileState {
  chatContextSelections: ChatContextContent[];
  chatUploadFileList: UploadFileItem[];
  /**
   * File IDs that have been uploaded but not yet materialized into the compute workspace.
   * Consumed by sendMessage after topic creation.
   */
  pendingComputeMaterializeFileIds: string[];

  uploadingIds: string[];
}

export const initialImageFileState: ImageFileState = {
  chatContextSelections: [],
  chatUploadFileList: [],
  uploadingIds: [],
  pendingComputeMaterializeFileIds: [],
};
