
import { useMessageSender } from "./useMessageSender";
import { useMessageEditor } from "./useMessageEditor";
import { useMessageDeleter } from "./useMessageDeleter";

export const useMessageSend = (
  userId: string | null,
  newMessage: string,
  setNewMessage: (message: string) => void,
  ttl: number | null,
  setIsLoading: (loading: boolean) => void,
  toast: any
) => {
  // Use the specific hook implementations
  const { handleSendMessage } = useMessageSender(
    userId, newMessage, setNewMessage, ttl, setIsLoading, toast
  );
  
  const { handleEditMessage } = useMessageEditor(
    userId, newMessage, setNewMessage, setIsLoading, toast
  );
  
  const { handleDeleteMessage } = useMessageDeleter(
    userId, setIsLoading, toast
  );

  return { 
    handleSendMessage,
    handleEditMessage,
    handleDeleteMessage
  };
};
