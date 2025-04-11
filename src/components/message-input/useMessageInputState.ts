
import { useState, useRef } from "react";

export const useMessageInputState = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  // Clear file inputs after submission
  const clearFileInputs = () => {
    return (inputElement: HTMLInputElement | null) => {
      if (inputElement) {
        inputElement.value = '';
      }
    };
  };
  
  return {
    selectedFile,
    setSelectedFile,
    isRecording,
    setIsRecording,
    clearFileInputs
  };
};
