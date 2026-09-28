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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          id: string
          reason: string | null
          target_entity: string
          target_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          target_entity: string
          target_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          target_entity?: string
          target_id?: string | null
        }
        Relationships: []
      }
      book_orders: {
        Row: {
          address_line1: string
          address_line2: string | null
          book_title: string
          city: string
          created_at: string
          id: string
          payment_id: string
          phone: string
          pincode: string
          recipient_name: string
          state: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          book_title: string
          city: string
          created_at?: string
          id?: string
          payment_id: string
          phone: string
          pincode: string
          recipient_name: string
          state: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          book_title?: string
          city?: string
          created_at?: string
          id?: string
          payment_id?: string
          phone?: string
          pincode?: string
          recipient_name?: string
          state?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_orders_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          candidate_id: string
          created_at: string
          exam_slot_id: string
          id: string
          status: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          exam_slot_id: string
          id?: string
          status?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          exam_slot_id?: string
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_exam_slot_id_fkey"
            columns: ["exam_slot_id"]
            isOneToOne: false
            referencedRelation: "exam_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          candidate_id: string
          certificate_number: string
          certification_type_id: string | null
          created_at: string
          expires_on: string | null
          id: string
          issued_date: string
          pdf_url: string | null
          qr_code_data: string | null
          status: string
        }
        Insert: {
          candidate_id: string
          certificate_number: string
          certification_type_id?: string | null
          created_at?: string
          expires_on?: string | null
          id?: string
          issued_date?: string
          pdf_url?: string | null
          qr_code_data?: string | null
          status?: string
        }
        Update: {
          candidate_id?: string
          certificate_number?: string
          certification_type_id?: string | null
          created_at?: string
          expires_on?: string | null
          id?: string
          issued_date?: string
          pdf_url?: string | null
          qr_code_data?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_certification_type_id_fkey"
            columns: ["certification_type_id"]
            isOneToOne: false
            referencedRelation: "certification_types"
            referencedColumns: ["id"]
          },
        ]
      }
      certification_types: {
        Row: {
          code: string
          created_at: string
          description: string | null
          fee_inr: number
          id: string
          is_active: boolean
          mcq_duration_minutes: number
          mcq_pass_percent: number
          mcq_question_count: number
          name: string
          practical_pass_score: number
          retake_cooldown_days: number
          retake_fee_inr: number
          validity_years: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          fee_inr?: number
          id?: string
          is_active?: boolean
          mcq_duration_minutes?: number
          mcq_pass_percent?: number
          mcq_question_count?: number
          name: string
          practical_pass_score?: number
          retake_cooldown_days?: number
          retake_fee_inr?: number
          validity_years?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          fee_inr?: number
          id?: string
          is_active?: boolean
          mcq_duration_minutes?: number
          mcq_pass_percent?: number
          mcq_question_count?: number
          name?: string
          practical_pass_score?: number
          retake_cooldown_days?: number
          retake_fee_inr?: number
          validity_years?: number
        }
        Relationships: []
      }
      cities: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          state: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          state?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          state?: string | null
        }
        Relationships: []
      }
      conduct_acceptances: {
        Row: {
          accepted_at: string
          full_name_signed: string
          id: string
          user_id: string
          version: string
        }
        Insert: {
          accepted_at?: string
          full_name_signed: string
          id?: string
          user_id: string
          version?: string
        }
        Update: {
          accepted_at?: string
          full_name_signed?: string
          id?: string
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      exam_slot_requests: {
        Row: {
          alternate_date: string | null
          candidate_id: string
          city_id: string | null
          created_at: string
          exam_type: string
          id: string
          notes: string | null
          preferred_date: string
          scheduled_details: string | null
          status: string
          testing_center_id: string | null
          updated_at: string
        }
        Insert: {
          alternate_date?: string | null
          candidate_id: string
          city_id?: string | null
          created_at?: string
          exam_type?: string
          id?: string
          notes?: string | null
          preferred_date: string
          scheduled_details?: string | null
          status?: string
          testing_center_id?: string | null
          updated_at?: string
        }
        Update: {
          alternate_date?: string | null
          candidate_id?: string
          city_id?: string | null
          created_at?: string
          exam_type?: string
          id?: string
          notes?: string | null
          preferred_date?: string
          scheduled_details?: string | null
          status?: string
          testing_center_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_slot_requests_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_slot_requests_testing_center_id_fkey"
            columns: ["testing_center_id"]
            isOneToOne: false
            referencedRelation: "testing_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_slots: {
        Row: {
          capacity: number
          certification_type_id: string | null
          created_at: string
          end_time: string
          exam_date: string
          id: string
          seats_booked: number
          start_time: string
          status: string
          testing_center_id: string
          type: string
        }
        Insert: {
          capacity?: number
          certification_type_id?: string | null
          created_at?: string
          end_time: string
          exam_date: string
          id?: string
          seats_booked?: number
          start_time: string
          status?: string
          testing_center_id: string
          type: string
        }
        Update: {
          capacity?: number
          certification_type_id?: string | null
          created_at?: string
          end_time?: string
          exam_date?: string
          id?: string
          seats_booked?: number
          start_time?: string
          status?: string
          testing_center_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_slots_certification_type_id_fkey"
            columns: ["certification_type_id"]
            isOneToOne: false
            referencedRelation: "certification_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_slots_testing_center_id_fkey"
            columns: ["testing_center_id"]
            isOneToOne: false
            referencedRelation: "testing_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_start_authorizations: {
        Row: {
          attempt_id: string | null
          authorized_at: string
          candidate_id: string
          exam_slot_id: string | null
          id: string
          testing_center_id: string
        }
        Insert: {
          attempt_id?: string | null
          authorized_at?: string
          candidate_id: string
          exam_slot_id?: string | null
          id?: string
          testing_center_id: string
        }
        Update: {
          attempt_id?: string | null
          authorized_at?: string
          candidate_id?: string
          exam_slot_id?: string | null
          id?: string
          testing_center_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_start_authorizations_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "mcq_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_start_authorizations_exam_slot_id_fkey"
            columns: ["exam_slot_id"]
            isOneToOne: false
            referencedRelation: "exam_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_start_authorizations_testing_center_id_fkey"
            columns: ["testing_center_id"]
            isOneToOne: false
            referencedRelation: "testing_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      examiner_assignments: {
        Row: {
          created_at: string
          examiner_id: string
          id: string
          testing_center_id: string
        }
        Insert: {
          created_at?: string
          examiner_id: string
          id?: string
          testing_center_id: string
        }
        Update: {
          created_at?: string
          examiner_id?: string
          id?: string
          testing_center_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "examiner_assignments_testing_center_id_fkey"
            columns: ["testing_center_id"]
            isOneToOne: false
            referencedRelation: "testing_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      office_admin_assignments: {
        Row: {
          city_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          city_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          city_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "office_admin_assignments_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_documents: {
        Row: {
          candidate_id: string
          created_at: string
          designation: string
          document_url: string
          employer_address: string | null
          employer_name: string
          end_date: string | null
          id: string
          is_current: boolean
          review_notes: string | null
          reviewed_by: string | null
          start_date: string
          status: string
          supervisor_contact: string | null
          supervisor_name: string | null
          updated_at: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          designation: string
          document_url: string
          employer_address?: string | null
          employer_name: string
          end_date?: string | null
          id?: string
          is_current?: boolean
          review_notes?: string | null
          reviewed_by?: string | null
          start_date: string
          status?: string
          supervisor_contact?: string | null
          supervisor_name?: string | null
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          designation?: string
          document_url?: string
          employer_address?: string | null
          employer_name?: string
          end_date?: string | null
          id?: string
          is_current?: boolean
          review_notes?: string | null
          reviewed_by?: string | null
          start_date?: string
          status?: string
          supervisor_contact?: string | null
          supervisor_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          question: string
          sort_order: number
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          question: string
          sort_order?: number
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          question?: string
          sort_order?: number
        }
        Relationships: []
      }
      library_documents: {
        Row: {
          access_level: string
          category: string
          created_at: string
          description: string | null
          external_url: string | null
          id: string
          internal_path: string | null
          is_active: boolean
          kind: string
          page_count: number | null
          slug: string
          sort_order: number
          storage_bucket: string | null
          storage_path: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          access_level?: string
          category?: string
          created_at?: string
          description?: string | null
          external_url?: string | null
          id?: string
          internal_path?: string | null
          is_active?: boolean
          kind?: string
          page_count?: number | null
          slug: string
          sort_order?: number
          storage_bucket?: string | null
          storage_path?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          access_level?: string
          category?: string
          created_at?: string
          description?: string | null
          external_url?: string | null
          id?: string
          internal_path?: string | null
          is_active?: boolean
          kind?: string
          page_count?: number | null
          slug?: string
          sort_order?: number
          storage_bucket?: string | null
          storage_path?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      mcq_attempts: {
        Row: {
          answers_json: Json
          candidate_id: string
          exam_slot_id: string | null
          id: string
          mode: string
          passed: boolean | null
          score: number | null
          started_at: string
          submitted_at: string | null
          total_questions: number | null
        }
        Insert: {
          answers_json?: Json
          candidate_id: string
          exam_slot_id?: string | null
          id?: string
          mode?: string
          passed?: boolean | null
          score?: number | null
          started_at?: string
          submitted_at?: string | null
          total_questions?: number | null
        }
        Update: {
          answers_json?: Json
          candidate_id?: string
          exam_slot_id?: string | null
          id?: string
          mode?: string
          passed?: boolean | null
          score?: number | null
          started_at?: string
          submitted_at?: string | null
          total_questions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mcq_attempts_exam_slot_id_fkey"
            columns: ["exam_slot_id"]
            isOneToOne: false
            referencedRelation: "exam_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      member_reports: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          incident_date: string | null
          is_anonymous: boolean
          member_cpb_id: string | null
          member_name: string
          reference_code: string
          reporter_email: string | null
          reporter_name: string | null
          reporter_phone: string | null
          reporter_relationship: string | null
          staff_notes: string | null
          status: string
          updated_at: string
          venue: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id?: string
          incident_date?: string | null
          is_anonymous?: boolean
          member_cpb_id?: string | null
          member_name: string
          reference_code?: string
          reporter_email?: string | null
          reporter_name?: string | null
          reporter_phone?: string | null
          reporter_relationship?: string | null
          staff_notes?: string | null
          status?: string
          updated_at?: string
          venue?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          incident_date?: string | null
          is_anonymous?: boolean
          member_cpb_id?: string | null
          member_name?: string
          reference_code?: string
          reporter_email?: string | null
          reporter_name?: string | null
          reporter_phone?: string | null
          reporter_relationship?: string | null
          staff_notes?: string | null
          status?: string
          updated_at?: string
          venue?: string | null
        }
        Relationships: []
      }
      membership_plans: {
        Row: {
          code: string
          created_at: string
          features: Json
          id: string
          is_active: boolean
          name: string
          period: string
          price_inr: number
          sort_order: number
          tagline: string | null
        }
        Insert: {
          code: string
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          name: string
          period?: string
          price_inr: number
          sort_order?: number
          tagline?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          name?: string
          period?: string
          price_inr?: number
          sort_order?: number
          tagline?: string | null
        }
        Relationships: []
      }
      memberships: {
        Row: {
          created_at: string
          expires_on: string
          id: string
          member_number: string
          plan_code: string
          started_on: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_on?: string
          id?: string
          member_number: string
          plan_code?: string
          started_on?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_on?: string
          id?: string
          member_number?: string
          plan_code?: string
          started_on?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_inr: number
          candidate_id: string
          created_at: string
          discount_code: string | null
          gateway: string
          gateway_reference: string | null
          id: string
          order_id: string | null
          payment_id: string | null
          plan_code: string | null
          purpose: string
          status: string
          updated_at: string
        }
        Insert: {
          amount_inr: number
          candidate_id: string
          created_at?: string
          discount_code?: string | null
          gateway?: string
          gateway_reference?: string | null
          id?: string
          order_id?: string | null
          payment_id?: string | null
          plan_code?: string | null
          purpose?: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount_inr?: number
          candidate_id?: string
          created_at?: string
          discount_code?: string | null
          gateway?: string
          gateway_reference?: string | null
          id?: string
          order_id?: string | null
          payment_id?: string | null
          plan_code?: string | null
          purpose?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      practical_scores: {
        Row: {
          candidate_id: string
          exam_slot_id: string | null
          examiner_id: string | null
          id: string
          notes: string | null
          passed: boolean
          rubric_scores_json: Json
          submitted_at: string
          total_score: number
        }
        Insert: {
          candidate_id: string
          exam_slot_id?: string | null
          examiner_id?: string | null
          id?: string
          notes?: string | null
          passed?: boolean
          rubric_scores_json?: Json
          submitted_at?: string
          total_score?: number
        }
        Update: {
          candidate_id?: string
          exam_slot_id?: string | null
          examiner_id?: string | null
          id?: string
          notes?: string | null
          passed?: boolean
          rubric_scores_json?: Json
          submitted_at?: string
          total_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "practical_scores_exam_slot_id_fkey"
            columns: ["exam_slot_id"]
            isOneToOne: false
            referencedRelation: "exam_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address_line: string | null
          bio: string | null
          blacklist_until: string | null
          city_id: string | null
          conduct_accepted_at: string | null
          cpb_id: string | null
          created_at: string
          current_employer: string | null
          date_of_birth: string | null
          directory_opt_in: boolean
          email: string | null
          emergency_contact: string | null
          employer_city: string | null
          employer_contact: string | null
          employer_designation: string | null
          employment_start_date: string | null
          full_name: string | null
          gender: string | null
          id: string
          id_proof_url: string | null
          instagram: string | null
          is_blacklisted: boolean
          languages: string[] | null
          linkedin: string | null
          phone: string | null
          photo_url: string | null
          pincode: string | null
          profession: string | null
          specialties: string[] | null
          state: string | null
          status: string
          updated_at: string
          years_experience: number | null
        }
        Insert: {
          address_line?: string | null
          bio?: string | null
          blacklist_until?: string | null
          city_id?: string | null
          conduct_accepted_at?: string | null
          cpb_id?: string | null
          created_at?: string
          current_employer?: string | null
          date_of_birth?: string | null
          directory_opt_in?: boolean
          email?: string | null
          emergency_contact?: string | null
          employer_city?: string | null
          employer_contact?: string | null
          employer_designation?: string | null
          employment_start_date?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          id_proof_url?: string | null
          instagram?: string | null
          is_blacklisted?: boolean
          languages?: string[] | null
          linkedin?: string | null
          phone?: string | null
          photo_url?: string | null
          pincode?: string | null
          profession?: string | null
          specialties?: string[] | null
          state?: string | null
          status?: string
          updated_at?: string
          years_experience?: number | null
        }
        Update: {
          address_line?: string | null
          bio?: string | null
          blacklist_until?: string | null
          city_id?: string | null
          conduct_accepted_at?: string | null
          cpb_id?: string | null
          created_at?: string
          current_employer?: string | null
          date_of_birth?: string | null
          directory_opt_in?: boolean
          email?: string | null
          emergency_contact?: string | null
          employer_city?: string | null
          employer_contact?: string | null
          employer_designation?: string | null
          employment_start_date?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          id_proof_url?: string | null
          instagram?: string | null
          is_blacklisted?: boolean
          languages?: string[] | null
          linkedin?: string | null
          phone?: string | null
          photo_url?: string | null
          pincode?: string | null
          profession?: string | null
          specialties?: string[] | null
          state?: string | null
          status?: string
          updated_at?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      question_bank: {
        Row: {
          correct_option: string
          created_at: string
          difficulty: string
          id: string
          is_active: boolean
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
          topic_tag: string
        }
        Insert: {
          correct_option: string
          created_at?: string
          difficulty?: string
          id?: string
          is_active?: boolean
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
          topic_tag?: string
        }
        Update: {
          correct_option?: string
          created_at?: string
          difficulty?: string
          id?: string
          is_active?: boolean
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question_text?: string
          topic_tag?: string
        }
        Relationships: []
      }
      reading_books: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          file_path: string | null
          file_url: string | null
          id: string
          section: string
          slug: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_path?: string | null
          file_url?: string | null
          id?: string
          section: string
          slug?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_path?: string | null
          file_url?: string | null
          id?: string
          section?: string
          slug?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      reading_progress: {
        Row: {
          book_slug: string
          id: string
          page: number
          updated_at: string
          user_id: string
        }
        Insert: {
          book_slug: string
          id?: string
          page?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          book_slug?: string
          id?: string
          page?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      study_links: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          kind: string
          sort_order: number
          title: string
          url: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          sort_order?: number
          title: string
          url: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          sort_order?: number
          title?: string
          url?: string
        }
        Relationships: []
      }
      study_materials: {
        Row: {
          created_at: string
          description: string | null
          file_url: string | null
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      syllabus_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      testing_center_applications: {
        Row: {
          address_line: string
          applicant_user_id: string | null
          bar_stations: number | null
          city: string
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at: string
          has_backup_power: boolean
          has_cctv: boolean
          has_dedicated_room: boolean
          has_fssai_licence: boolean
          has_liquor_licence: boolean
          has_wifi: boolean
          id: string
          intrastate_coverage: string | null
          notes: string | null
          organisation_name: string
          organisation_type: string
          pincode: string
          seating_capacity: number | null
          state: string
          status: string
          updated_at: string
          years_operating: number | null
        }
        Insert: {
          address_line: string
          applicant_user_id?: string | null
          bar_stations?: number | null
          city: string
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at?: string
          has_backup_power?: boolean
          has_cctv?: boolean
          has_dedicated_room?: boolean
          has_fssai_licence?: boolean
          has_liquor_licence?: boolean
          has_wifi?: boolean
          id?: string
          intrastate_coverage?: string | null
          notes?: string | null
          organisation_name: string
          organisation_type: string
          pincode: string
          seating_capacity?: number | null
          state: string
          status?: string
          updated_at?: string
          years_operating?: number | null
        }
        Update: {
          address_line?: string
          applicant_user_id?: string | null
          bar_stations?: number | null
          city?: string
          contact_email?: string
          contact_name?: string
          contact_phone?: string
          created_at?: string
          has_backup_power?: boolean
          has_cctv?: boolean
          has_dedicated_room?: boolean
          has_fssai_licence?: boolean
          has_liquor_licence?: boolean
          has_wifi?: boolean
          id?: string
          intrastate_coverage?: string | null
          notes?: string | null
          organisation_name?: string
          organisation_type?: string
          pincode?: string
          seating_capacity?: number | null
          state?: string
          status?: string
          updated_at?: string
          years_operating?: number | null
        }
        Relationships: []
      }
      testing_centers: {
        Row: {
          address: string
          admin_pin_hash: string | null
          city_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          address: string
          admin_pin_hash?: string | null
          city_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          address?: string
          admin_pin_hash?: string | null
          city_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "testing_centers_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      store_orders: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          created_at: string
          id: string
          payment_id: string
          phone: string
          pincode: string
          product_id: string | null
          product_name: string
          quantity: number
          recipient_name: string
          state: string
          status: string
          total_inr: number
          unit_price_inr: number
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          created_at?: string
          id?: string
          payment_id: string
          phone: string
          pincode: string
          product_id?: string | null
          product_name: string
          quantity?: number
          recipient_name: string
          state: string
          status?: string
          total_inr: number
          unit_price_inr: number
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          created_at?: string
          id?: string
          payment_id?: string
          phone?: string
          pincode?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          recipient_name?: string
          state?: string
          status?: string
          total_inr?: number
          unit_price_inr?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_orders_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "store_products"
            referencedColumns: ["id"]
          },
        ]
      }
      store_products: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_path: string | null
          image_url: string
          is_active: boolean
          name: string
          price_inr: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_path?: string | null
          image_url: string
          is_active?: boolean
          name: string
          price_inr: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_path?: string | null
          image_url?: string
          is_active?: boolean
          name?: string
          price_inr?: number
          updated_at?: string
        }
        Relationships: []
      }
      training_videos: {
        Row: {
          access_level: string
          created_at: string
          description: string | null
          duration_label: string | null
          id: string
          is_active: boolean
          module: string
          sort_order: number
          thumbnail_url: string | null
          title: string
          video_url: string
        }
        Insert: {
          access_level?: string
          created_at?: string
          description?: string | null
          duration_label?: string | null
          id?: string
          is_active?: boolean
          module?: string
          sort_order?: number
          thumbnail_url?: string | null
          title: string
          video_url: string
        }
        Update: {
          access_level?: string
          created_at?: string
          description?: string | null
          duration_label?: string | null
          id?: string
          is_active?: boolean
          module?: string
          sort_order?: number
          thumbnail_url?: string | null
          title?: string
          video_url?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      generate_cpb_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      search_members: {
        Args: { _query: string }
        Returns: {
          cpb_id: string
          full_name: string
          city: string
          state: string
          specialties: string[]
          employer: string
          certified_since: string
          status: string
          email: string
          photo_url: string
        }[]
      }
      set_centre_admin_pin: {
        Args: { _center_id: string; _pin: string }
        Returns: boolean
      }
      verify_centre_admin_pin: {
        Args: { _center_id: string; _pin: string }
        Returns: boolean
      }
      verify_certificate: {
        Args: { _certificate_number: string }
        Returns: {
          certificate_number: string
          certification_name: string
          city: string
          expires_on: string
          full_name: string
          issued_date: string
          photo_url: string
          status: string
        }[]
      }
    }
    Enums: {
      app_role: "candidate" | "examiner" | "admin" | "office_admin" | "superadmin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["candidate", "examiner", "admin", "office_admin", "superadmin"],
    },
  },
} as const
