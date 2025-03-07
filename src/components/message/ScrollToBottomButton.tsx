
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface ScrollToBottomButtonProps {
  show: boolean;
  onClick: () => void;
}

export const ScrollToBottomButton = ({ show, onClick }: ScrollToBottomButtonProps) => {
  if (!show) return null;
  
  return (
    <Button
      className="fixed bottom-20 right-8 bg-cybergold-500 text-black shadow-lg rounded-full p-2 z-10"
      size="sm"
      onClick={onClick}
    >
      <ChevronDown className="h-4 w-4 mr-1" />
      Scroll ned
    </Button>
  );
};
