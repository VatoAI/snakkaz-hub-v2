
import { Clock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TTLSelectorProps {
  ttl: number | null;
  setTtl: (ttl: number | null) => void;
  isDisabled?: boolean;
}

export const TTLSelector = ({ ttl, setTtl, isDisabled = false }: TTLSelectorProps) => {
  const handleTtlChange = (value: string) => {
    const ttlValue = value === "none" ? null : parseInt(value, 10);
    setTtl(ttlValue);
  };

  return (
    <Select
      value={ttl ? ttl.toString() : "none"}
      onValueChange={handleTtlChange}
      disabled={isDisabled}
    >
      <SelectTrigger
        className="w-auto px-2 h-8 border-none bg-transparent text-cybergold-400 hover:text-cybergold-300 hover:bg-cyberdark-800"
      >
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          <SelectValue placeholder="TTL" />
        </div>
      </SelectTrigger>
      <SelectContent className="bg-cyberdark-900 border-cybergold-500/30">
        <SelectItem value="none" className="text-cyberblue-300">Ingen</SelectItem>
        <SelectItem value="60" className="text-cyberblue-300">1 minutt</SelectItem>
        <SelectItem value="300" className="text-cyberblue-300">5 minutter</SelectItem>
        <SelectItem value="3600" className="text-cyberblue-300">1 time</SelectItem>
        <SelectItem value="86400" className="text-cyberblue-300">24 timer</SelectItem>
      </SelectContent>
    </Select>
  );
};
