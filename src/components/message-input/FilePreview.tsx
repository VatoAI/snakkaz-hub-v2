
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
}

export const FilePreview = ({ file, onRemove }: FilePreviewProps) => {
  if (!file) return null;
  
  return (
    <div className="flex items-center gap-2 bg-cyberdark-800 px-2 py-1 rounded">
      <span className="text-sm text-cybergold-400 truncate max-w-[100px]">
        {file.name}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};
