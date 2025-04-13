
import { useEffect, useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { secureConnectionMonitorInstance } from '@/utils/security';

interface SecurityStatusProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const SecurityStatus = ({ size = 'md', showLabel = false }: SecurityStatusProps) => {
  const [status, setStatus] = useState(secureConnectionMonitorInstance.getStatus());
  
  useEffect(() => {
    const handleStatusChange = () => {
      setStatus(secureConnectionMonitorInstance.getStatus());
    };
    
    secureConnectionMonitorInstance.addStatusChangeListener(handleStatusChange);
    
    return () => {
      secureConnectionMonitorInstance.removeStatusChangeListener(handleStatusChange);
    };
  }, []);
  
  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };
  
  const statusDetails = {
    secure: {
      icon: <ShieldCheck className={`${iconSizes[size]} text-green-500`} />,
      text: 'Sikker forbindelse',
      description: 'Ende-til-ende kryptert kommunikasjon er aktivert'
    },
    warning: {
      icon: <AlertTriangle className={`${iconSizes[size]} text-yellow-500`} />,
      text: 'Begrenset sikkerhet',
      description: 'Noen sikkerhetsfunksjoner er ikke tilgjengelige'
    },
    insecure: {
      icon: <ShieldAlert className={`${iconSizes[size]} text-red-500`} />,
      text: 'Usikker forbindelse',
      description: 'Ende-til-ende kryptering er ikke tilgjengelig nå'
    }
  };
  
  const currentStatus = statusDetails[status] || statusDetails.warning;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="flex items-center space-x-1">
          {currentStatus.icon}
          {showLabel && (
            <span className="text-xs font-medium">{currentStatus.text}</span>
          )}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-snakkaz-dark border-snakkaz-blue/10">
          <div className="px-3 py-2">
            <p className="text-sm font-medium">{currentStatus.text}</p>
            <p className="text-xs text-gray-400">{currentStatus.description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
