import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
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

    // Don't let practitioners message themselves
    if (user.id === practitionerId) {
      toast.info("You can't message yourself");
      return;
    }

    navigate(`/messages?practitioner=${practitionerId}`);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={`border-primary/40 text-primary hover:bg-primary/5 hover:text-primary ${className}`}
    >
      <MessageSquare className="h-4 w-4 mr-2" />
      {practitionerName ? `Message ${practitionerName}` : 'Message Practitioner'}
    </Button>
  );
};
