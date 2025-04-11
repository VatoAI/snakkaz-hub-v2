
import { Image, FileIcon, FilmIcon, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

interface FileInputsProps {
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  isLoading: boolean;
  isRecording: boolean;
}

export const FileInputs = ({
  selectedFile,
  setSelectedFile,
  isLoading,
  isRecording
}: FileInputsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleTriggerFile = (inputRef: React.RefObject<HTMLInputElement>) => {
    inputRef.current?.click();
  };
  
  return (
    <div className="flex items-center gap-1">
      {selectedFile && (
        <div className="flex items-center gap-2 p-1 mr-2 bg-cyberblue-900/40 rounded-full">
          <span className="text-xs text-cyberblue-300 px-2 truncate max-w-[100px]">
            {selectedFile.name}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-5 w-5 rounded-full bg-red-900/80 text-white hover:bg-red-800"
            onClick={() => setSelectedFile(null)}
          >
            ✕
          </Button>
        </div>
      )}
      
      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
        disabled={isLoading || isRecording}
      />
      
      <input 
        ref={videoInputRef}
        type="file" 
        accept="video/*"
        className="hidden"
        onChange={handleFileSelect}
        disabled={isLoading || isRecording}
      />
      
      <input 
        ref={documentInputRef}
        type="file" 
        accept=".pdf,.doc,.docx,.txt"
        className="hidden"
        onChange={handleFileSelect}
        disabled={isLoading || isRecording}
      />
      
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-cybergold-400 hover:text-cybergold-300 hover:bg-cyberdark-800"
        onClick={() => handleTriggerFile(fileInputRef)}
        disabled={isLoading || isRecording}
      >
        <Image className="h-4 w-4" />
      </Button>
      
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-cybergold-400 hover:text-cybergold-300 hover:bg-cyberdark-800"
        onClick={() => handleTriggerFile(videoInputRef)}
        disabled={isLoading || isRecording}
      >
        <FilmIcon className="h-4 w-4" />
      </Button>
      
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-cybergold-400 hover:text-cybergold-300 hover:bg-cyberdark-800"
        onClick={() => handleTriggerFile(documentInputRef)}
        disabled={isLoading || isRecording}
      >
        <FileIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};
