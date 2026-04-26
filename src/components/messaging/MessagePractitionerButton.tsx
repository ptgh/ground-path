import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageSquare, NotebookPen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface MessagePractitionerButtonProps {
  practitionerId: string;
  practitionerName?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const MessagePractitionerButton = ({
  practitionerId,
  practitionerName,
  variant = 'outline',
  size = 'default',
  className = '',
}: MessagePractitionerButtonProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleClick = () => {
    if (!user) {
      toast.error('Please sign in to message a practitioner');
      navigate('/practitioner/auth');
      return;
    }

    // Practitioner messaging themselves opens their Personal Notes thread
    if (user.id === practitionerId) {
      toast.info('Opening your Personal Notes — a private space for record-keeping.');
    }

    navigate(`/messages?practitioner=${practitionerId}`);
  };

  const isSelf = user?.id === practitionerId;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={`border-primary/40 text-primary hover:bg-primary/5 hover:text-primary ${className}`}
    >
      {isSelf ? <NotebookPen className="h-4 w-4 mr-2" /> : <MessageSquare className="h-4 w-4 mr-2" />}
      {isSelf
        ? 'Open Personal Notes'
        : practitionerName ? `Message ${practitionerName}` : 'Message Practitioner'}
    </Button>
  );
};
