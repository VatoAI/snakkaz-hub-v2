
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Clock, Image, Video, X, Camera, Mic, Paperclip } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  
  const ttlOptions = [
    { label: 'Normal melding', value: null },
    { label: '30 sek', value: 30 },
    { label: '5 min', value: 300 },
    { label: '30 min', value: 1800 },
    { label: '1 time', value: 3600 }
  ];

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
        setSelectedFile(audioFile);
        stream.getTracks().forEach(track => track.stop());
      };
      
      setAudioChunks([]);
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Kunne ikke starte lydopptak. Sjekk at mikrofonen er tilgjengelig.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e, selectedFile || undefined);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (documentInputRef.current) documentInputRef.current.value = '';
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
      <div className="flex-1 flex gap-2 w-full">
        {editingMessage && (
          <div className="w-full mb-2 bg-cyberdark-800/70 p-2 rounded-md border border-cybergold-400/30">
            <div className="flex justify-between mb-1">
              <span className="text-xs text-cybergold-300">Redigerer melding</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancelEdit}
                className="h-5 px-2 text-xs text-cybergold-400 hover:text-cybergold-300"
              >
                Avbryt
              </Button>
            </div>
            <div className="text-sm text-cybergold-200 truncate">{editingMessage.content}</div>
          </div>
        )}
        
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
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={editingMessage ? "Endre melding..." : receiverId ? "Skriv en privat melding..." : "Skriv din melding..."}
          className="flex-1 bg-cyberdark-800 border-cybergold-500/30 text-cyberblue-100 placeholder:text-cyberdark-600 focus:ring-cyberblue-500 focus:border-cyberblue-500"
          disabled={isLoading || isRecording}
        />
        
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
        
        <div className="flex gap-2">
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
          
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={`bg-cyberdark-800 border-cybergold-500/30 ${
              isRecording 
                ? 'text-red-500 hover:text-red-400 animate-pulse' 
                : 'text-cybergold-400 hover:text-cybergold-300'
            } hover:bg-cyberdark-700`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
          >
            <Mic className="w-4 h-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                type="button"
                variant="outline" 
                size="icon"
                className="bg-cyberdark-800 border-cybergold-500/30 text-cybergold-400 hover:text-cybergold-300 hover:bg-cyberdark-700"
                disabled={isLoading || isRecording}
              >
                <Clock className="w-4 h-4" />
                <span className="sr-only">Velg tidsgrense</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-cyberdark-800 border-cybergold-500/30">
              {ttlOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value ?? 'permanent'}
                  onClick={() => setTtl(option.value)}
                  className="text-cybergold-400 hover:text-cybergold-300 hover:bg-cyberdark-700 cursor-pointer"
                >
                  {option.label} {ttl === option.value && '✓'}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Button 
        type="submit" 
        disabled={isLoading || (!newMessage.trim() && !selectedFile) || isRecording}
        className="w-full sm:w-auto bg-cybergold-500 hover:bg-cybergold-600 text-cyberdark-900 shadow-neon-gold transition-all duration-300 flex items-center justify-center gap-2"
      >
        <Send className="w-4 h-4" />
        <span className="sm:hidden">
          {editingMessage ? "Oppdater" : "Send"}
        </span>
        <span className="hidden sm:inline">
          {editingMessage ? "Oppdater" : "Send"}
        </span>
      </Button>
    </form>
  );
};
