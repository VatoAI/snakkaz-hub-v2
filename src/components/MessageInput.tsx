
import { useRef, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { useMessageInputState } from "./message-input/useMessageInputState";
import { FileInputs } from "./message-input/FileInputs";
import { AudioRecorder } from "./message-input/AudioRecorder";
import { TTLSelector } from "./message-input/TTLSelector";
import { EditingMessage } from "./message-input/EditingMessage";
import { SubmitButton } from "./message-input/SubmitButton";

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  onSubmit: (e: React.FormEvent, mediaFile?: File) => void;
  isLoading: boolean;
  ttl: number | null;
  setTtl: (ttl: number | null) => void;
  receiverId?: string | null;
  editingMessage?: { id: string; content: string } | null;
  onCancelEdit?: () => void;
}

export const MessageInput = ({ 
  newMessage, 
  setNewMessage, 
  onSubmit, 
  isLoading,
  ttl,
  setTtl,
  receiverId,
  editingMessage,
  onCancelEdit
}: MessageInputProps) => {
  const {
    selectedFile,
    setSelectedFile,
    isRecording,
    setIsRecording,
    clearFileInputs
  } = useMessageInputState();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(e, selectedFile || undefined);
    setSelectedFile(null);
    
    // Clear all file inputs
    const resetInput = clearFileInputs();
    resetInput(fileInputRef.current);
    resetInput(videoInputRef.current);
    resetInput(cameraInputRef.current);
    resetInput(documentInputRef.current);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
      <div className="flex-1 flex gap-2 w-full">
        <EditingMessage editingMessage={editingMessage} onCancelEdit={onCancelEdit} />
        
        <FileInputs 
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          isLoading={isLoading}
          isRecording={isRecording}
        />
        
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={editingMessage ? "Endre melding..." : receiverId ? "Skriv en privat melding..." : "Skriv din melding..."}
          className="flex-1 bg-cyberdark-800 border-cybergold-500/30 text-cyberblue-100 placeholder:text-cyberdark-600 focus:ring-cyberblue-500 focus:border-cyberblue-500"
          disabled={isLoading || isRecording}
        />
        
        <div className="flex gap-2">
          <AudioRecorder
            isLoading={isLoading}
            isRecording={isRecording}
            setIsRecording={setIsRecording}
            setSelectedFile={setSelectedFile}
          />
          
          <TTLSelector
            ttl={ttl}
            setTtl={setTtl}
            isLoading={isLoading}
            isRecording={isRecording}
          />
        </div>
      </div>
      
      <SubmitButton
        isLoading={isLoading}
        newMessage={newMessage}
        selectedFile={selectedFile}
        isRecording={isRecording}
        editingMessage={editingMessage}
      />
    </form>
  );
};
