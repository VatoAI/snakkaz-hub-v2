
import { Circle, Clock, Loader2 } from "lucide-react";
import { UserStatus } from "@/types/presence";
import { cn } from "@/lib/utils";

export const statusIcons = {
  online: Circle,
  busy: Clock,
  brb: Loader2
};

export const statusLabels = {
  online: "Online",
  busy: "Opptatt",
  brb: "BRB"
};

export const statusColors = {
  online: "text-green-500",
  busy: "text-yellow-500",
  brb: "text-blue-500"
};

interface StatusIconProps {
  status: UserStatus;
  className?: string;
  size?: number;
  showBadge?: boolean;
}

export const StatusIcon = ({ status, className, size = 4, showBadge = false }: StatusIconProps) => {
  const Icon = statusIcons[status];
  
  if (showBadge) {
    return (
      <div className="relative">
        <div className={cn(
          `absolute -top-1 -right-1 w-${size/2} h-${size/2} rounded-full`,
          status === 'online' ? "bg-green-500" : 
          status === 'busy' ? "bg-yellow-500" : 
          "bg-blue-500"
        )}></div>
        <Icon className={cn(
          `w-${size} h-${size}`,
          className
        )} />
      </div>
    );
  }
  
  return (
    <Icon className={cn(
      `w-${size} h-${size}`,
      statusColors[status],
      className
    )} />
  );
};
