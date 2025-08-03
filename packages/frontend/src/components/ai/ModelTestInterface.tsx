import React, { useState, useRef } from 'react';

interface ModelTestInterfaceProps {
  modelUrl: string;
  modelType: 'image' | 'audio' | 'pose';
  onTestResult?: (result: any) => void;
}

interface PredictionResult {
  className: string;
  probability: number;
}

const ModelTestInterface: React.FC<ModelTestInterfaceProps> = ({
  modelUrl,
  modelType,
  onTestResult,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setPredictions([]);

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setPredictions([]);

      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const testModel = async () => {
    if (!selectedFile && modelType !== 'pose') {
      setError('Please select a file to test');
      return;
    }

    setIsLoading(true);
    setError(null);
    setPredictions([]);

    try {
      // This is a simplified implementation
      // In a real application, you would load the TensorFlow.js model and make predictions
      
      // Simulate API call to test the model
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      formData.append('modelUrl', modelUrl);
      formData.append('modelType', modelType);

      // Simulate prediction results
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResults: PredictionResult[] = [
        { className: 'Class A', probability: 0.85 },
        { className: 'Class B', probability: 0.12 },
        { className: 'Class C', probability: 0.03 },
      ];

      setPredictions(mockResults);
      onTestResult?.(mockResults);

    } catch (err: any) {
      setError(err.message || 'Failed to test model');
    } finally {
      setIsLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Failed to access camera');
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      ctx?.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
          setSelectedFile(file);
          setPreviewUrl(URL.createObjectURL(file));
        }
      });
    }
  };

  const renderImageInterface = () => (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-400 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {previewUrl ? (
          <div className="space-y-4">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full max-h-64 mx-auto rounded-lg"
            />
            <p className="text-sm text-gray-600">
              {selectedFile?.name} • Click to change
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="text-lg font-medium text-gray-900">Upload an image</p>
              <p className="text-sm text-gray-600">Drag and drop or click to select</p>
            </div>
          </div>
        )}
      </div>

      {/* Camera Option */}
      <div className="flex items-center justify-center space-x-4">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="text-sm text-gray-500">or</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

      <div className="text-center">
        <button
          onClick={startCamera}
          className="btn-outline"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Use Camera
        </button>
      </div>

      {/* Camera View */}
      <div className="hidden" id="camera-view">
        <video ref={videoRef} autoPlay className="w-full rounded-lg" />
        <canvas ref={canvasRef} className="hidden" />
        <div className="text-center mt-4">
          <button onClick={captureImage} className="btn-primary">
            Capture Photo
          </button>
        </div>
      </div>
    </div>
  );

  const renderAudioInterface = () => (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-400 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {selectedFile ? (
          <div className="space-y-4">
            <svg className="w-12 h-12 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <p className="text-sm text-gray-600">
              {selectedFile.name} • Click to change
            </p>
            <audio controls className="w-full">
              <source src={previewUrl || ''} />
            </audio>
          </div>
        ) : (
          <div className="space-y-4">
            <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1h-2a1 1 0 01-1-1V4M7 4H5a1 1 0 00-1 1v14a1 1 0 001 1h2a1 1 0 001-1V5a1 1 0 00-1-1z" />
            </svg>
            <div>
              <p className="text-lg font-medium text-gray-900">Upload an audio file</p>
              <p className="text-sm text-gray-600">Drag and drop or click to select</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderPoseInterface = () => (
    <div className="space-y-4">
      <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <p className="text-lg font-medium text-gray-900 mb-2">Pose Detection</p>
        <p className="text-sm text-gray-600 mb-4">
          Use your camera to test pose detection in real-time
        </p>
        <button onClick={startCamera} className="btn-primary">
          Start Camera
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Test Your Model</h3>
          <p className="text-sm text-gray-600 mt-1">
            Upload a sample {modelType} to test your AI model's predictions
          </p>
        </div>
        <div className="card-body">
          {modelType === 'image' && renderImageInterface()}
          {modelType === 'audio' && renderAudioInterface()}
          {modelType === 'pose' && renderPoseInterface()}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={testModel}
              disabled={isLoading || (!selectedFile && modelType !== 'pose')}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner w-4 h-4 mr-2" />
                  Testing Model...
                </>
              ) : (
                'Test Model'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Prediction Results */}
      {predictions.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Prediction Results</h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {predictions.map((prediction, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    <span className="font-medium text-gray-900">{prediction.className}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          index === 0 ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                        style={{ width: `${prediction.probability * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-600">
                      {(prediction.probability * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-green-800">
                    <strong>Great!</strong> Your model is working correctly. The highest prediction is "{predictions[0]?.className}" with {(predictions[0]?.probability * 100).toFixed(1)}% confidence.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Model Information */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Model Information</h3>
        </div>
        <div className="card-body">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Model Type:</span>
              <span className="text-sm text-gray-900 capitalize">{modelType} Classification</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Model URL:</span>
              <a
                href={modelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 hover:text-primary-500 truncate max-w-xs"
              >
                {modelUrl}
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Status:</span>
              <span className="badge badge-success">Connected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelTestInterface;