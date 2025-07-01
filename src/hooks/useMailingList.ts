
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { mailingListService, MailingListSubscriber, ContactFormSubmission } from '@/services/mailingListService';
import { useToast } from '@/hooks/use-toast';

export const useMailingListSubscription = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Omit<MailingListSubscriber, 'id' | 'subscription_date' | 'confirmation_token'>) =>
      mailingListService.subscribeToMailingList(data),
    onSuccess: () => {
      toast({
        title: "Welcome aboard! 🎉",
        description: "Thanks for joining our mailing list. Check your email to confirm your subscription.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Subscription failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useContactFormSubmission = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Omit<ContactFormSubmission, 'id' | 'created_at' | 'updated_at'>) =>
      mailingListService.submitContactForm(data),
    onSuccess: () => {
      toast({
        title: "Message sent successfully!",
        description: "Thank you for contacting us. We'll get back to you soon.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useSubscribers = (status?: string) => {
  return useQuery({
    queryKey: ['subscribers', status],
    queryFn: () => mailingListService.getSubscribers(status),
  });
};

export const useMailingListModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return {
    isOpen,
    openModal,
    closeModal,
  };
};
