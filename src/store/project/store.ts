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

const createStore: StateCreator<ProjectStore, [['zustand/devtools', never]]> = (set, get) => ({
  ...initialProjectState,
  ...flattenActions<ProjectStoreAction>([
    createProjectActiveSlice(set, get),
    createProjectCrudSlice(set, get),
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

export const getProjectStoreState = () => useProjectStore.getState();

expose('project', useProjectStore);
