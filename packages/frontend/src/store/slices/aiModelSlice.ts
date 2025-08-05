import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AIModelConfig {
  type: 'teachable-machine' | 'hugging-face';
  modelUrl?: string;
  modelId?: string;
  apiKey?: string;
  labels?: string[];
  inputType?: 'image' | 'audio' | 'text';
  task?: string;
}

export interface TestResult {
  success: boolean;
  predictions: any[];
  modelType: string;
  error?: string;
}

export interface AIModelType {
  id: string;
  name: string;
  description: string;
  inputTypes: string[];
}

interface AIModelState {
  currentModel: AIModelConfig | null;
  isLoading: boolean;
  error: string | null;
  testResult: TestResult | null;
  availableTypes: AIModelType[];
}

const initialState: AIModelState = {
  currentModel: null,
  isLoading: false,
  error: null,
  testResult: null,
  availableTypes: [],
};

const aiModelSlice = createSlice({
  name: 'aiModel',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setCurrentModel: (state, action: PayloadAction<AIModelConfig | null>) => {
      state.currentModel = action.payload;
    },
    setTestResult: (state, action: PayloadAction<TestResult | null>) => {
      state.testResult = action.payload;
    },
    setAvailableTypes: (state, action: PayloadAction<AIModelType[]>) => {
      state.availableTypes = action.payload;
    },
  },
});

export const {
  setLoading,
  setError,
  clearError,
  setCurrentModel,
  setTestResult,
  setAvailableTypes,
} = aiModelSlice.actions;

export default aiModelSlice.reducer;