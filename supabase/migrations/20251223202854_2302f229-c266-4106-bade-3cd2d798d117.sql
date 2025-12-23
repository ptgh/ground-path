-- Drop ALL duplicate audit triggers on user_roles
DROP TRIGGER IF EXISTS audit_user_roles_changes ON public.user_roles;
DROP TRIGGER IF EXISTS user_roles_audit_trigger ON public.user_roles;
DROP TRIGGER IF EXISTS audit_role_changes_trigger ON public.user_roles;

-- Update audit_role_changes function to handle NULL auth.uid() gracefully
-- This prevents the signup failure when the trigger tries to insert with NULL user_id
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only audit if we have an authenticated user (skip during signup/system operations)
  IF auth.uid() IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

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

-- Create a single properly named audit trigger
CREATE TRIGGER audit_role_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_role_changes();

-- Update handle_new_user to also save registration_body and registration_number from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, registration_body, registration_number)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'display_name',
    NEW.raw_user_meta_data ->> 'registration_body',
    NEW.raw_user_meta_data ->> 'registration_number'
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;