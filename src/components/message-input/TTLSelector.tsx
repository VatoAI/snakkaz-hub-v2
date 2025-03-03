
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface TTLSelectorProps {
  ttl: number | null;
  setTtl: (ttl: number | null) => void;
  isLoading: boolean;
  isRecording: boolean;
}

export const TTLSelector = ({ ttl, setTtl, isLoading, isRecording }: TTLSelectorProps) => {
  const ttlOptions = [
    { label: 'Normal melding', value: null },
    { label: '30 sek', value: 30 },
    { label: '5 min', value: 300 },
    { label: '30 min', value: 1800 },
    { label: '1 time', value: 3600 }
  ];

  return (
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
  );
};
