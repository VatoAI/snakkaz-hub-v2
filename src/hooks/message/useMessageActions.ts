
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
    // Don't allow editing - all messages are auto-deleted after 24 hours
    toast({
      title: "Ikke tilgjengelig",
      description: "Redigering av meldinger er deaktivert. Alle meldinger slettes automatisk etter 24 timer.",
      variant: "destructive",
    });
    return message.content;
  };

  const handleCancelEditMessage = () => {
    setEditingMessage(null);
  };

  const handleSubmitEditMessage = async (newMessage: string) => {
    // Don't allow editing
    toast({
      title: "Ikke tilgjengelig",
      description: "Redigering av meldinger er deaktivert. Alle meldinger slettes automatisk etter 24 timer.",
      variant: "destructive",
    });
    setEditingMessage(null);
  };

  const handleDeleteMessageById = async (messageId: string) => {
    // Don't allow deleting
    toast({
      title: "Ikke tilgjengelig",
      description: "Sletting av meldinger er deaktivert. Alle meldinger slettes automatisk etter 24 timer.",
      variant: "destructive",
    });
  };

  return {
    editingMessage,
    handleStartEditMessage,
    handleCancelEditMessage,
    handleSubmitEditMessage,
    handleDeleteMessageById
  };
};
