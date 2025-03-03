
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Image, Video, Camera, Paperclip, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

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
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Sjekk filtype basert på hvilken input som ble brukt
      const isValid = e.target === fileInputRef.current || e.target === cameraInputRef.current
        ? file.type.startsWith('image/')
        : e.target === videoInputRef.current
          ? file.type.startsWith('video/')
          : true; // For dokumenter aksepterer vi alle filtyper
      
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

  return (
    <>
      {selectedFile && (
        <div className="flex items-center gap-2 bg-cyberdark-800 px-2 py-1 rounded">
          <span className="text-sm text-cybergold-400 truncate max-w-[100px]">
            {selectedFile.name}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setSelectedFile(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={videoInputRef}
        onChange={handleFileSelect}
        accept="video/*"
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        capture="environment"
        className="hidden"
      />
      <input
        type="file"
        ref={documentInputRef}
        onChange={handleFileSelect}
        accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        className="hidden"
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="bg-cyberdark-800 border-cybergold-500/30 text-cybergold-400 hover:text-cybergold-300 hover:bg-cyberdark-700"
            disabled={isLoading || isRecording}
          >
            <Paperclip className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-cyberdark-800 border-cybergold-500/30 w-48">
          <DropdownMenuItem
            onClick={() => fileInputRef.current?.click()}
            className="text-cybergold-400 hover:text-cybergold-300 hover:bg-cyberdark-700 cursor-pointer flex items-center gap-2"
          >
            <Image className="w-4 h-4" />
            <span>Bilde</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => videoInputRef.current?.click()}
            className="text-cybergold-400 hover:text-cybergold-300 hover:bg-cyberdark-700 cursor-pointer flex items-center gap-2"
          >
            <Video className="w-4 h-4" />
            <span>Video</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => cameraInputRef.current?.click()}
            className="text-cybergold-400 hover:text-cybergold-300 hover:bg-cyberdark-700 cursor-pointer flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            <span>Ta bilde</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => documentInputRef.current?.click()}
            className="text-cybergold-400 hover:text-cybergold-300 hover:bg-cyberdark-700 cursor-pointer flex items-center gap-2"
          >
            <Paperclip className="w-4 h-4" />
            <span>Dokument</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
