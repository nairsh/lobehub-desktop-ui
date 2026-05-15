'use client';

import { Button, Flexbox, Input, TextArea } from '@lobehub/ui';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useProjectStore } from '@/store/project';
import type { ProjectItem } from '@/types/project';

interface ProjectFormProps {
  initialValues?: Partial<Pick<ProjectItem, 'description' | 'name'>>;
  onClose?: () => void;
  onSuccess?: (id: string) => void;
  projectId?: string;
}

const ProjectForm = memo<ProjectFormProps>(({ projectId, initialValues, onClose, onSuccess }) => {
  const { t } = useTranslation('project');
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(initialValues?.name ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');

  const createProject = useProjectStore((s) => s.createProject);
  const updateProject = useProjectStore((s) => s.updateProject);
  const isEditMode = !!projectId;

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      if (isEditMode) {
        await updateProject(projectId, { description: description.trim(), name: name.trim() });
        onClose?.();
      } else {
        const result = await createProject({ description: description.trim(), name: name.trim() });
        if (result?.id) {
          onSuccess?.(result.id);
        }
        onClose?.();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flexbox gap={16}>
      <Input
        autoFocus
        placeholder={t('projectName')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onPressEnter={handleSubmit}
      />
      <TextArea
        placeholder={t('projectDescription')}
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Flexbox direction={'horizontal-reverse'} gap={8}>
        <Button loading={loading} type={'primary'} onClick={handleSubmit}>
          {isEditMode ? t('editProject') : t('createProject')}
        </Button>
        <Button onClick={onClose}>{t('cancel', { ns: 'common' })}</Button>
      </Flexbox>
    </Flexbox>
  );
});

ProjectForm.displayName = 'ProjectForm';

export default ProjectForm;
