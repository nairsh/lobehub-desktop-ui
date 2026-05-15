import { subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';
import type { StateCreator } from 'zustand/vanilla';

import { isDev } from '@/utils/env';

import { createDevtools } from '../middleware/createDevtools';
import { expose } from '../middleware/expose';
import { flattenActions } from '../utils/flattenActions';
import type { ProjectStoreState } from './initialState';
import { initialProjectState } from './initialState';
import { createProjectActiveSlice, type ProjectActiveAction } from './slices/active';
import { createProjectCrudSlice, type ProjectCrudAction } from './slices/crud';

export interface ProjectStore extends ProjectActiveAction, ProjectCrudAction, ProjectStoreState {}

type ProjectStoreAction = ProjectActiveAction & ProjectCrudAction;

const createStore: StateCreator<ProjectStore, [['zustand/devtools', never]]> = (
  ...parameters: Parameters<StateCreator<ProjectStore, [['zustand/devtools', never]]>>
) => ({
  ...initialProjectState,
  ...flattenActions<ProjectStoreAction>([
    createProjectActiveSlice(...parameters),
    createProjectCrudSlice(...parameters),
  ]),
});

const devtools = createDevtools('project');

export const useProjectStore = createWithEqualityFn<ProjectStore>()(
  subscribeWithSelector(
    devtools(createStore, {
      name: 'LobeChat_Project' + (isDev ? '_DEV' : ''),
    }),
  ),
  shallow,
);

expose('project', useProjectStore);

export const getProjectStoreState = () => useProjectStore.getState();
