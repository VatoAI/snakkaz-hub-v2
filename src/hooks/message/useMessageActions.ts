
import { useState } from "react";
import { DecryptedMessage } from "@/types/message";
import { useToast } from "@/components/ui/use-toast";

export const useMessageActions = (
  userId: string | null, 
  handleEditMessage: (messageId: string, content: string) => Promise<void>,
  handleDeleteMessage: (messageId: string) => Promise<void>
) => {
  const [editingMessage, setEditingMessage] = useState<{ id: string; content: string } | null>(null);
  const { toast } = useToast();

  const handleStartEditMessage = (message: { id: string; content: string }) => {
    // Allow editing for your own messages
    if (editingMessage) {
      setEditingMessage(null);
    } else {
      setEditingMessage(message);
    }
    return message.content;
  };

  const handleCancelEditMessage = () => {
    setEditingMessage(null);
  };

  const handleSubmitEditMessage = async (newMessage: string) => {
    if (!editingMessage || !newMessage.trim()) {
      return;
    }
    
    try {
      await handleEditMessage(editingMessage.id, newMessage);
      toast({
        title: "Melding redigert",
        description: "Meldingen ble oppdatert",
      });
    } catch (error) {
      toast({
        title: "Feil",
        description: "Kunne ikke redigere meldingen",
        variant: "destructive",
      });
    } finally {
      setEditingMessage(null);
    }
  };

  const handleDeleteMessageById = async (messageId: string) => {
    try {
      await handleDeleteMessage(messageId);
      toast({
        title: "Melding slettet",
        description: "Meldingen ble slettet",
      });
    } catch (error) {
      toast({
        title: "Feil",
        description: "Kunne ikke slette meldingen",
        variant: "destructive",
      });
    }
  };

  return {
    editingMessage,
    handleStartEditMessage,
    handleCancelEditMessage,
    handleSubmitEditMessage,
    handleDeleteMessageById
  };
};
