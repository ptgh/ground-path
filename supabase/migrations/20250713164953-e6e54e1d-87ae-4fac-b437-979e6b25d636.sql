-- Critical Security Fix: Prevent role escalation vulnerability
-- Add restrictive RLS policies to prevent users from modifying their own roles

-- Drop existing permissive policies and replace with secure ones
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Users can only view their own roles (read-only access)
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Only admins can insert new roles
CREATE POLICY "Only admins can assign roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update existing roles
CREATE POLICY "Only admins can update roles" 
ON public.user_roles 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete roles
CREATE POLICY "Only admins can delete roles" 
ON public.user_roles 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Special policy to allow the system to assign default roles during user creation
-- This allows the handle_new_user() function to work properly
CREATE POLICY "System can assign default roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  -- Allow if called from the handle_new_user trigger function
  -- or if no authenticated user (system operation)
  auth.uid() IS NULL OR 
  public.has_role(auth.uid(), 'admin')
);

-- Add constraint to prevent duplicate role assignments
ALTER TABLE public.user_roles 
ADD CONSTRAINT unique_user_role 
UNIQUE (user_id, role);

-- Add audit logging trigger for role changes
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit trigger for role changes
CREATE TRIGGER audit_user_roles_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_role_changes();