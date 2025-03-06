
import { useCallback } from "react";
import { DecryptedMessage } from "@/types/message";
import { useMessageEditor } from "@/hooks/message/useMessageEditor";
import { useMessageDeleter } from "@/hooks/message/useMessageDeleter";
import { useToast } from "@/components/ui/use-toast";

export const useDirectMessageSubmit = (
  currentUserId: string,
  newMessage: string,
  setNewMessage: (message: string) => void,
  setIsLoading: (loading: boolean) => void,
  editingMessage: { id: string; content: string } | null,
  setEditingMessage: (message: { id: string; content: string } | null) => void,
  handleSendDirectMessage: (e: React.FormEvent, message: string) => Promise<boolean>
) => {
  const { toast } = useToast();
  
  // Initialize the message editor and deleter hooks
  const { handleEditMessage } = useMessageEditor(
    currentUserId,
    newMessage,
    setNewMessage,
    setIsLoading,
    toast
  );
  
  const { handleDeleteMessage } = useMessageDeleter(
    currentUserId,
    setIsLoading,
    toast
  );
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingMessage) {
      // Handle edit submission
      await handleEditMessage(editingMessage.id, newMessage);
      setEditingMessage(null);
      setNewMessage("");
    } else {
      // Handle new message submission
      const success = await handleSendDirectMessage(e, newMessage);
      if (success) {
        setNewMessage("");
      }
    }
  };

  const handleDeleteMessageById = useCallback(async (messageId: string) => {
    await handleDeleteMessage(messageId);
  }, [handleDeleteMessage]);

  return {
    handleSubmit,
    handleDeleteMessage: handleDeleteMessageById
  };
};
