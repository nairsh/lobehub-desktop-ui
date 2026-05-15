'use client';

import { createModal, Flexbox, useModalContext } from '@lobehub/ui';
import { memo, Suspense, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { ProjectItem } from '@/types/project';

import ProjectForm from './ProjectForm';

interface ModalContentProps {
  initialValues?: Partial<Pick<ProjectItem, 'description' | 'name'>>;
  onSuccess?: (id: string) => void;
  projectId?: string;
}

const ModalContent = memo<ModalContentProps>(({ projectId, initialValues, onSuccess }) => {
  const { close } = useModalContext();

  return (
    <Flexbox paddingInline={8} style={{ paddingBottom: 8 }}>
      <ProjectForm
        initialValues={initialValues}
        projectId={projectId}
        onClose={close}
        onSuccess={onSuccess}
      />
    </Flexbox>
  );
});

ModalContent.displayName = 'ProjectModalContent';

interface OpenProjectModalParams {
  initialValues?: Partial<Pick<ProjectItem, 'description' | 'name'>>;
  onSuccess?: (id: string) => void;
  projectId?: string;
}

export const useProjectModal = () => {
  const { t } = useTranslation('project');

  const open = useCallback(
    (props?: OpenProjectModalParams) => {
      const isEditMode = !!props?.projectId;

      createModal({
        children: (
          <Suspense fallback={<div style={{ minHeight: 160 }} />}>
            <ModalContent
              initialValues={props?.initialValues}
              projectId={props?.projectId}
              onSuccess={props?.onSuccess}
            />
          </Suspense>
        ),
        focusTriggerAfterClose: true,
        footer: null,
        title: isEditMode ? t('editProject') : t('createProject'),
        width: 420,
      });
    },
    [t],
  );

  return { open };
};
