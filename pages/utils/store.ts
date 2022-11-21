import { createStore } from 'zustand';

export const useMazeAlgorithmStore = createStore(() => {
  return 'default'
});

export const usePathFindingAlgorithmStore = createStore(() => {
  return 'default';
});

export const useGridSize = createStore(() => {
  return { width: 200, height: 150 };
});
