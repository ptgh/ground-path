-- Fix critical database function security paths to prevent SQL injection

-- Update has_role function with proper search path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- Update audit_role_changes function with proper security definer and search path
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notes (user_id, title, content, conversation_data)
    VALUES (
      auth.uid(),
      'Role Assignment Audit',
      'Role assigned: ' || NEW.role || ' to user: ' || NEW.user_id,
      jsonb_build_object(
        'action', 'INSERT',
        'role', NEW.role,
        'target_user_id', NEW.user_id,
        'timestamp', now(),
        'admin_user_id', auth.uid()
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.notes (user_id, title, content, conversation_data)
    VALUES (
      auth.uid(),
      'Role Modification Audit',
      'Role changed from: ' || OLD.role || ' to: ' || NEW.role || ' for user: ' || NEW.user_id,
      jsonb_build_object(
        'action', 'UPDATE',
        'old_role', OLD.role,
        'new_role', NEW.role,
        'target_user_id', NEW.user_id,
        'timestamp', now(),
        'admin_user_id', auth.uid()
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.notes (user_id, title, content, conversation_data)
    VALUES (
      auth.uid(),
      'Role Removal Audit',
      'Role removed: ' || OLD.role || ' from user: ' || OLD.user_id,
      jsonb_build_object(
        'action', 'DELETE',
        'role', OLD.role,
        'target_user_id', OLD.user_id,
        'timestamp', now(),
        'admin_user_id', auth.uid()
      )
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Create trigger for role audit logging if it doesn't exist
DROP TRIGGER IF EXISTS user_roles_audit_trigger ON public.user_roles;
CREATE TRIGGER user_roles_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_role_changes();

-- Add additional RLS policy for role management security
CREATE POLICY "Prevent role escalation" ON public.user_roles
  FOR INSERT 
  WITH CHECK (
    -- Only allow role assignment if user is admin or system (auth.uid() IS NULL for triggers)
    (auth.uid() IS NULL) OR 
    (has_role(auth.uid(), 'admin'::app_role) AND NEW.role != 'admin'::app_role) OR
    (has_role(auth.uid(), 'admin'::app_role) AND NEW.role = 'admin'::app_role AND auth.uid() = NEW.user_id)
  );