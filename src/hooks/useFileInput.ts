
import { useRef, useState } from "react";

interface UseFileInputProps {
  setSelectedFile: (file: File | null) => void;
}

export const useFileInput = ({ setSelectedFile }: UseFileInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type based on which input was used
      const isValid = e.target === fileInputRef.current || e.target === cameraInputRef.current
        ? file.type.startsWith('image/')
        : e.target === videoInputRef.current
          ? file.type.startsWith('video/')
          : true; // For documents we accept all file types
      
      const maxSize = 20000000; // 20MB
      
      if (isValid && file.size <= maxSize) {
        setSelectedFile(file);
      } else {
        if (file.size > maxSize) {
          alert('Filen er for stor. Maksimal størrelse er 20MB.');
        } else {
          alert('Ugyldig filtype.');
        }
      }
    }
  };

  return {
    fileInputRef,
    videoInputRef,
    cameraInputRef,
    documentInputRef,
    handleFileSelect
  };
};
