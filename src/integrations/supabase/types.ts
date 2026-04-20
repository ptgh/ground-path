export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      booking_checkins: {
        Row: {
          booking_request_id: string
          client_user_id: string
          created_at: string
          desired_outcome: string | null
          id: string
          mood_score: number | null
          mood_tags: string[] | null
          notes_for_practitioner: string | null
          practitioner_id: string
          updated_at: string
        }
        Insert: {
          booking_request_id: string
          client_user_id: string
          created_at?: string
          desired_outcome?: string | null
          id?: string
          mood_score?: number | null
          mood_tags?: string[] | null
          notes_for_practitioner?: string | null
          practitioner_id: string
          updated_at?: string
        }
        Update: {
          booking_request_id?: string
          client_user_id?: string
          created_at?: string
          desired_outcome?: string | null
          id?: string
          mood_score?: number | null
          mood_tags?: string[] | null
          notes_for_practitioner?: string | null
          practitioner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      booking_requests: {
        Row: {
          calendar_provider: string | null
          calendar_sync_status: string | null
          client_user_id: string
          created_at: string
          duration_minutes: number
          external_calendar_event_id: string | null
          external_meeting_id: string | null
          id: string
          last_calendar_sync_at: string | null
          lobby_policy: string | null
          meeting_access_policy: string | null
          meeting_created_at: string | null
          meeting_last_attempt_at: string | null
          meeting_last_error: string | null
          meeting_provider: string | null
          meeting_retry_count: number | null
          meeting_status: string | null
          meeting_url: string | null
          notes: string | null
          organizer_email: string | null
          practitioner_id: string
          practitioner_notes: string | null
          reminder_sent_at: string | null
          requested_date: string
          requested_end_time: string
          requested_start_time: string
          session_type: string
          status: string
          updated_at: string
        }
        Insert: {
          calendar_provider?: string | null
          calendar_sync_status?: string | null
          client_user_id: string
          created_at?: string
          duration_minutes?: number
          external_calendar_event_id?: string | null
          external_meeting_id?: string | null
          id?: string
          last_calendar_sync_at?: string | null
          lobby_policy?: string | null
          meeting_access_policy?: string | null
          meeting_created_at?: string | null
          meeting_last_attempt_at?: string | null
          meeting_last_error?: string | null
          meeting_provider?: string | null
          meeting_retry_count?: number | null
          meeting_status?: string | null
          meeting_url?: string | null
          notes?: string | null
          organizer_email?: string | null
          practitioner_id: string
          practitioner_notes?: string | null
          reminder_sent_at?: string | null
          requested_date: string
          requested_end_time: string
          requested_start_time: string
          session_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          calendar_provider?: string | null
          calendar_sync_status?: string | null
          client_user_id?: string
          created_at?: string
          duration_minutes?: number
          external_calendar_event_id?: string | null
          external_meeting_id?: string | null
          id?: string
          last_calendar_sync_at?: string | null
          lobby_policy?: string | null
          meeting_access_policy?: string | null
          meeting_created_at?: string | null
          meeting_last_attempt_at?: string | null
          meeting_last_error?: string | null
          meeting_provider?: string | null
          meeting_retry_count?: number | null
          meeting_status?: string | null
          meeting_url?: string | null
          notes?: string | null
          organizer_email?: string | null
          practitioner_id?: string
          practitioner_notes?: string | null
          reminder_sent_at?: string | null
          requested_date?: string
          requested_end_time?: string
          requested_start_time?: string
          session_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_messages: {
        Row: {
          attachment_name: string | null
          attachment_path: string | null
          attachment_size: number | null
          attachment_type: string | null
          attachment_url: string | null
          conversation_id: string
          created_at: string
          delivered_at: string | null
          id: string
          is_read: boolean
          message_text: string
          read_at: string | null
          receiver_id: string
          resource_description: string | null
          resource_title: string | null
          resource_url: string | null
          sender_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_path?: string | null
          attachment_size?: number | null
          attachment_type?: string | null
          attachment_url?: string | null
          conversation_id: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          is_read?: boolean
          message_text: string
          read_at?: string | null
          receiver_id: string
          resource_description?: string | null
          resource_title?: string | null
          resource_url?: string | null
          sender_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_path?: string | null
          attachment_size?: number | null
          attachment_type?: string | null
          attachment_url?: string | null
          conversation_id?: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          is_read?: boolean
          message_text?: string
          read_at?: string | null
          receiver_id?: string
          resource_description?: string | null
          resource_title?: string | null
          resource_url?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          date_of_birth: string | null
          emergency_contact: Json | null
          first_name: string
          id: string
          intake_date: string | null
          last_name: string
          notes: string | null
          practitioner_id: string
          presenting_concerns: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          emergency_contact?: Json | null
          first_name: string
          id?: string
          intake_date?: string | null
          last_name: string
          notes?: string | null
          practitioner_id: string
          presenting_concerns?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          emergency_contact?: Json | null
          first_name?: string
          id?: string
          intake_date?: string | null
          last_name?: string
          notes?: string | null
          practitioner_id?: string
          presenting_concerns?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_forms: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          status: string | null
          subject: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          status?: string | null
          subject: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string | null
          subject?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          last_message_text: string | null
          linked_halaxy_client_id: string | null
          practitioner_id: string
          status: string
          unread_count_practitioner: number
          unread_count_user: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_text?: string | null
          linked_halaxy_client_id?: string | null
          practitioner_id: string
          status?: string
          unread_count_practitioner?: number
          unread_count_user?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_text?: string | null
          linked_halaxy_client_id?: string | null
          practitioner_id?: string
          status?: string
          unread_count_practitioner?: number
          unread_count_user?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      form_submissions: {
        Row: {
          client_id: string | null
          completed_at: string | null
          created_at: string | null
          form_data: Json
          form_type: string
          id: string
          interpretation: string | null
          practitioner_id: string
          score: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          form_data?: Json
          form_type: string
          id?: string
          interpretation?: string | null
          practitioner_id: string
          score?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          form_data?: Json
          form_type?: string
          id?: string
          interpretation?: string | null
          practitioner_id?: string
          score?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      link_health: {
        Row: {
          category: string
          country: string
          created_at: string
          error_message: string | null
          id: string
          is_broken: boolean | null
          last_checked: string | null
          resource_name: string
          status_code: number | null
          updated_at: string
          url: string
        }
        Insert: {
          category: string
          country?: string
          created_at?: string
          error_message?: string | null
          id?: string
          is_broken?: boolean | null
          last_checked?: string | null
          resource_name: string
          status_code?: number | null
          updated_at?: string
          url: string
        }
        Update: {
          category?: string
          country?: string
          created_at?: string
          error_message?: string | null
          id?: string
          is_broken?: boolean | null
          last_checked?: string | null
          resource_name?: string
          status_code?: number | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      mailing_list: {
        Row: {
          confirmation_token: string | null
          created_at: string | null
          email: string
          email_preferences: Json | null
          id: string
          name: string | null
          preferences: Json | null
          source: string
          status: string | null
          subscription_date: string | null
          unsubscribe_token: string | null
          updated_at: string | null
        }
        Insert: {
          confirmation_token?: string | null
          created_at?: string | null
          email: string
          email_preferences?: Json | null
          id?: string
          name?: string | null
          preferences?: Json | null
          source: string
          status?: string | null
          subscription_date?: string | null
          unsubscribe_token?: string | null
          updated_at?: string | null
        }
        Update: {
          confirmation_token?: string | null
          created_at?: string | null
          email?: string
          email_preferences?: Json | null
          id?: string
          name?: string | null
          preferences?: Json | null
          source?: string
          status?: string | null
          subscription_date?: string | null
          unsubscribe_token?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      newsletter_articles: {
        Row: {
          author_name: string | null
          category: string
          content: string
          created_at: string
          featured: boolean | null
          id: string
          published_at: string
          slug: string
          source_name: string | null
          source_url: string | null
          status: string | null
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string | null
          category: string
          content: string
          created_at?: string
          featured?: boolean | null
          id?: string
          published_at?: string
          slug: string
          source_name?: string | null
          source_url?: string | null
          status?: string | null
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string | null
          category?: string
          content?: string
          created_at?: string
          featured?: boolean | null
          id?: string
          published_at?: string
          slug?: string
          source_name?: string | null
          source_url?: string | null
          status?: string | null
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string | null
          conversation_data: Json | null
          created_at: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          conversation_data?: Json | null
          created_at?: string | null
          id?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          conversation_data?: Json | null
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      org_microsoft_integration: {
        Row: {
          calendar_enabled: boolean
          config_version: number
          connected_at: string | null
          connection_status: string
          created_at: string
          disconnected_at: string | null
          id: string
          integration_mode: string
          last_sync_at: string | null
          organizer_email: string | null
          provider: string
          scopes: string[] | null
          service_identity_reference: string | null
          teams_enabled: boolean
          tenant_id: string | null
          token_metadata: Json | null
          updated_at: string
        }
        Insert: {
          calendar_enabled?: boolean
          config_version?: number
          connected_at?: string | null
          connection_status?: string
          created_at?: string
          disconnected_at?: string | null
          id?: string
          integration_mode?: string
          last_sync_at?: string | null
          organizer_email?: string | null
          provider?: string
          scopes?: string[] | null
          service_identity_reference?: string | null
          teams_enabled?: boolean
          tenant_id?: string | null
          token_metadata?: Json | null
          updated_at?: string
        }
        Update: {
          calendar_enabled?: boolean
          config_version?: number
          connected_at?: string | null
          connection_status?: string
          created_at?: string
          disconnected_at?: string | null
          id?: string
          integration_mode?: string
          last_sync_at?: string | null
          organizer_email?: string | null
          provider?: string
          scopes?: string[] | null
          service_identity_reference?: string | null
          teams_enabled?: boolean
          tenant_id?: string | null
          token_metadata?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          brand: string | null
          created_at: string
          exp_month: number | null
          exp_year: number | null
          id: string
          is_default: boolean
          last4: string | null
          stripe_payment_method_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand?: string | null
          created_at?: string
          exp_month?: number | null
          exp_year?: number | null
          id?: string
          is_default?: boolean
          last4?: string | null
          stripe_payment_method_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string | null
          created_at?: string
          exp_month?: number | null
          exp_year?: number | null
          id?: string
          is_default?: boolean
          last4?: string | null
          stripe_payment_method_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      practitioner_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_recurring: boolean
          practitioner_id: string
          specific_date: string | null
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_recurring?: boolean
          practitioner_id: string
          specific_date?: string | null
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_recurring?: boolean
          practitioner_id?: string
          specific_date?: string | null
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      practitioner_connect_accounts: {
        Row: {
          charges_enabled: boolean
          country: string | null
          created_at: string
          default_currency: string | null
          details_submitted: boolean
          id: string
          payouts_enabled: boolean
          requirements_currently_due: string[] | null
          stripe_account_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          charges_enabled?: boolean
          country?: string | null
          created_at?: string
          default_currency?: string | null
          details_submitted?: boolean
          id?: string
          payouts_enabled?: boolean
          requirements_currently_due?: string[] | null
          stripe_account_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          charges_enabled?: boolean
          country?: string | null
          created_at?: string
          default_currency?: string | null
          details_submitted?: boolean
          id?: string
          payouts_enabled?: boolean
          requirements_currently_due?: string[] | null
          stripe_account_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      practitioner_registrations: {
        Row: {
          body_name: string
          created_at: string | null
          id: string
          registration_date: string | null
          registration_number: string | null
          updated_at: string | null
          user_id: string
          years_as_practitioner: number | null
        }
        Insert: {
          body_name: string
          created_at?: string | null
          id?: string
          registration_date?: string | null
          registration_number?: string | null
          updated_at?: string | null
          user_id: string
          years_as_practitioner?: number | null
        }
        Update: {
          body_name?: string
          created_at?: string | null
          id?: string
          registration_date?: string | null
          registration_number?: string | null
          updated_at?: string | null
          user_id?: string
          years_as_practitioner?: number | null
        }
        Relationships: []
      }
      practitioner_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          id: string
          status: string
          stripe_customer_id: string
          stripe_price_id: string
          stripe_subscription_id: string
          trial_end: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          id?: string
          status: string
          stripe_customer_id: string
          stripe_price_id: string
          stripe_subscription_id: string
          trial_end?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string
          stripe_price_id?: string
          stripe_subscription_id?: string
          trial_end?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          aasw_membership_number: string | null
          ahpra_number: string | null
          ahpra_profession: string | null
          avatar_url: string | null
          bio: string | null
          cpd_hours_current_year: number | null
          cpd_requirements: number | null
          created_at: string | null
          currency: string
          directory_approved: boolean | null
          display_name: string | null
          emergency_contact: Json | null
          halaxy_integration: Json | null
          id: string
          insurance_expiry: string | null
          insurance_policy_number: string | null
          insurance_provider: string | null
          license_number: string | null
          linkedin_profile: string | null
          linkedin_verified_data: Json | null
          notification_preferences: Json | null
          organisation: string | null
          practice_location: string | null
          preferred_contact_method: string | null
          profession: string | null
          professional_verified: boolean | null
          qualifications: string[] | null
          registration_body: string | null
          registration_country: string | null
          registration_expiry: string | null
          registration_number: string | null
          session_rate_cents: number | null
          specializations: string[] | null
          supervisor_details: Json | null
          swe_registration_number: string | null
          updated_at: string | null
          user_id: string
          user_type: string | null
          verification_method: string | null
          verification_status: string | null
          website_url: string | null
          years_experience: number | null
        }
        Insert: {
          aasw_membership_number?: string | null
          ahpra_number?: string | null
          ahpra_profession?: string | null
          avatar_url?: string | null
          bio?: string | null
          cpd_hours_current_year?: number | null
          cpd_requirements?: number | null
          created_at?: string | null
          currency?: string
          directory_approved?: boolean | null
          display_name?: string | null
          emergency_contact?: Json | null
          halaxy_integration?: Json | null
          id?: string
          insurance_expiry?: string | null
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          license_number?: string | null
          linkedin_profile?: string | null
          linkedin_verified_data?: Json | null
          notification_preferences?: Json | null
          organisation?: string | null
          practice_location?: string | null
          preferred_contact_method?: string | null
          profession?: string | null
          professional_verified?: boolean | null
          qualifications?: string[] | null
          registration_body?: string | null
          registration_country?: string | null
          registration_expiry?: string | null
          registration_number?: string | null
          session_rate_cents?: number | null
          specializations?: string[] | null
          supervisor_details?: Json | null
          swe_registration_number?: string | null
          updated_at?: string | null
          user_id: string
          user_type?: string | null
          verification_method?: string | null
          verification_status?: string | null
          website_url?: string | null
          years_experience?: number | null
        }
        Update: {
          aasw_membership_number?: string | null
          ahpra_number?: string | null
          ahpra_profession?: string | null
          avatar_url?: string | null
          bio?: string | null
          cpd_hours_current_year?: number | null
          cpd_requirements?: number | null
          created_at?: string | null
          currency?: string
          directory_approved?: boolean | null
          display_name?: string | null
          emergency_contact?: Json | null
          halaxy_integration?: Json | null
          id?: string
          insurance_expiry?: string | null
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          license_number?: string | null
          linkedin_profile?: string | null
          linkedin_verified_data?: Json | null
          notification_preferences?: Json | null
          organisation?: string | null
          practice_location?: string | null
          preferred_contact_method?: string | null
          profession?: string | null
          professional_verified?: boolean | null
          qualifications?: string[] | null
          registration_body?: string | null
          registration_country?: string | null
          registration_expiry?: string | null
          registration_number?: string | null
          session_rate_cents?: number | null
          specializations?: string[] | null
          supervisor_details?: Json | null
          swe_registration_number?: string | null
          updated_at?: string | null
          user_id?: string
          user_type?: string | null
          verification_method?: string | null
          verification_status?: string | null
          website_url?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      session_charges: {
        Row: {
          amount_cents: number
          booking_request_id: string | null
          charged_at: string | null
          client_user_id: string
          created_at: string
          currency: string
          description: string | null
          failure_reason: string | null
          hosted_invoice_url: string | null
          id: string
          practitioner_id: string
          status: string
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          stripe_receipt_url: string | null
          updated_at: string
        }
        Insert: {
          amount_cents: number
          booking_request_id?: string | null
          charged_at?: string | null
          client_user_id: string
          created_at?: string
          currency?: string
          description?: string | null
          failure_reason?: string | null
          hosted_invoice_url?: string | null
          id?: string
          practitioner_id: string
          status?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_receipt_url?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          booking_request_id?: string | null
          charged_at?: string | null
          client_user_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          failure_reason?: string | null
          hosted_invoice_url?: string | null
          id?: string
          practitioner_id?: string
          status?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_receipt_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      stripe_customers: {
        Row: {
          created_at: string
          id: string
          stripe_customer_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          stripe_customer_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          stripe_customer_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_active_practitioner_subscription: {
        Args: { _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_practitioner_connect_ready: {
        Args: { _user_id: string }
        Returns: boolean
      }
      list_bookable_practitioners: {
        Args: never
        Returns: {
          avatar_url: string
          bio: string
          display_name: string
          halaxy_integration: Json
          practice_location: string
          profession: string
          professional_verified: boolean
          specializations: string[]
          user_id: string
        }[]
      }
      upgrade_practitioner_role: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      verify_practitioner_linkedin: {
        Args: {
          p_display_name?: string
          p_linkedin_profile?: string
          p_linkedin_verified_data: Json
          p_professional_verified: boolean
          p_user_id: string
          p_verification_status: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "social_worker"
        | "mental_health_professional"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "moderator",
        "user",
        "social_worker",
        "mental_health_professional",
      ],
    },
  },
} as const
