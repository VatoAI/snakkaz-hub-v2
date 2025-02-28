
import { File } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DecryptedMessage } from "@/types/message";

interface MessageMediaProps {
  message: DecryptedMessage;
}

export const MessageMedia = ({ message }: MessageMediaProps) => {
  if (!message.media_url) return null;

  const url = supabase.storage.from('chat-media').getPublicUrl(message.media_url).data.publicUrl;
  
  if (message.is_deleted) {
    return (
      <div className="mt-2 p-3 border border-cyberdark-700 rounded-lg bg-cyberdark-900/50 text-center">
        <p className="text-cyberdark-400 text-sm italic">Medie slettet</p>
      </div>
    );
  }

  if (message.media_type?.startsWith('image/')) {
    return (
      <img 
        src={url} 
        alt="Bilde" 
        className="max-w-full h-auto rounded-lg mt-2 max-h-[300px] object-contain cursor-pointer hover:opacity-90 transition-opacity"
        onClick={() => window.open(url, '_blank')}
      />
    );
  } else if (message.media_type?.startsWith('video/')) {
    return (
      <video 
        controls 
        className="max-w-full h-auto rounded-lg mt-2 max-h-[300px]"
      >
        <source src={url} type={message.media_type} />
        Din nettleser støtter ikke videospilling.
      </video>
    );
  } else if (message.media_type?.startsWith('audio/')) {
    return (
      <audio 
        controls 
        className="max-w-full w-full mt-2"
      >
        <source src={url} type={message.media_type} />
        Din nettleser støtter ikke lydavspilling.
      </audio>
    );
  } else {
    // For dokumenter og andre filer
    return (
      <div className="mt-2 p-3 border border-cyberdark-700 rounded-lg bg-cyberdark-900/50 flex items-center">
        <File className="h-6 w-6 text-cybergold-400 mr-3" />
        <div className="flex-1 min-w-0">
          <p className="text-cybergold-200 text-sm truncate">
            {message.media_url.split('/').pop()}
          </p>
          <p className="text-xs text-cyberdark-400">
            {message.media_type || "Dokument"}
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="text-cybergold-300 hover:text-cybergold-200"
          onClick={() => window.open(url, '_blank')}
        >
          Åpne
        </Button>
      </div>
    );
  }
};
