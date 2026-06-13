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
  public: {
    Tables: {
      attachments: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          mime: string | null
          size_bytes: number | null
          storage_path: string
          tenant_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          mime?: string | null
          size_bytes?: number | null
          storage_path: string
          tenant_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          mime?: string | null
          size_bytes?: number | null
          storage_path?: string
          tenant_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          description_ar: string | null
          description_en: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_account_purposes: {
        Row: {
          account_id: string
          created_at: string
          id: string
          purpose: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          purpose: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          purpose?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_account_purposes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_account_purposes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_accounts: {
        Row: {
          archived_at: string | null
          code: string
          created_at: string
          id: string
          name_ar: string
          name_en: string | null
          parent_id: string | null
          tenant_id: string
          type: Database["public"]["Enums"]["account_type"]
        }
        Insert: {
          archived_at?: string | null
          code: string
          created_at?: string
          id?: string
          name_ar: string
          name_en?: string | null
          parent_id?: string | null
          tenant_id: string
          type: Database["public"]["Enums"]["account_type"]
        }
        Update: {
          archived_at?: string | null
          code?: string
          created_at?: string
          id?: string
          name_ar?: string
          name_en?: string | null
          parent_id?: string | null
          tenant_id?: string
          type?: Database["public"]["Enums"]["account_type"]
        }
        Relationships: [
          {
            foreignKeyName: "chart_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chart_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          archived_at: string | null
          code: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name_ar: string
          name_en: string | null
          notes: string | null
          opening_balance: number
          phone: string | null
          tenant_id: string
          updated_at: string | null
          vat_number: string | null
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name_ar: string
          name_en?: string | null
          notes?: string | null
          opening_balance?: number
          phone?: string | null
          tenant_id: string
          updated_at?: string | null
          vat_number?: string | null
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name_ar?: string
          name_en?: string | null
          notes?: string | null
          opening_balance?: number
          phone?: string | null
          tenant_id?: string
          updated_at?: string | null
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      document_number_sequences: {
        Row: {
          doc_type: string
          last_value: number
          tenant_id: string
          updated_at: string
          year: number
        }
        Insert: {
          doc_type: string
          last_value?: number
          tenant_id: string
          updated_at?: string
          year: number
        }
        Update: {
          doc_type?: string
          last_value?: number
          tenant_id?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_number_sequences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_lines: {
        Row: {
          description: string | null
          discount: number
          id: string
          invoice_id: string
          item_id: string | null
          qty: number
          unit_price: number
          vat_rate: number
        }
        Insert: {
          description?: string | null
          discount?: number
          id?: string
          invoice_id: string
          item_id?: string | null
          qty?: number
          unit_price?: number
          vat_rate?: number
        }
        Update: {
          description?: string | null
          discount?: number
          id?: string
          invoice_id?: string
          item_id?: string | null
          qty?: number
          unit_price?: number
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_lines_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          cancelled_at: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          date: string
          discount: number
          due: string | null
          id: string
          issued_at: string | null
          notes: string | null
          number: string
          paid: number
          status: Database["public"]["Enums"]["invoice_status"]
          tenant_id: string
          terms: string | null
          total: number
          updated_at: string | null
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          date: string
          discount?: number
          due?: string | null
          id?: string
          issued_at?: string | null
          notes?: string | null
          number: string
          paid?: number
          status?: Database["public"]["Enums"]["invoice_status"]
          tenant_id: string
          terms?: string | null
          total?: number
          updated_at?: string | null
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          date?: string
          discount?: number
          due?: string | null
          id?: string
          issued_at?: string | null
          notes?: string | null
          number?: string
          paid?: number
          status?: Database["public"]["Enums"]["invoice_status"]
          tenant_id?: string
          terms?: string | null
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          archived_at: string | null
          cost: number
          created_at: string
          id: string
          name_ar: string
          name_en: string | null
          price: number
          sku: string | null
          tenant_id: string
          type: string
          unit: string | null
          updated_at: string | null
          vat_rate: number
        }
        Insert: {
          archived_at?: string | null
          cost?: number
          created_at?: string
          id?: string
          name_ar: string
          name_en?: string | null
          price?: number
          sku?: string | null
          tenant_id: string
          type?: string
          unit?: string | null
          updated_at?: string | null
          vat_rate?: number
        }
        Update: {
          archived_at?: string | null
          cost?: number
          created_at?: string
          id?: string
          name_ar?: string
          name_en?: string | null
          price?: number
          sku?: string | null
          tenant_id?: string
          type?: string
          unit?: string | null
          updated_at?: string | null
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          created_at: string
          date: string
          description: string | null
          id: string
          number: string
          posted_at: string | null
          source: string | null
          source_id: string | null
          source_type: string
          status: Database["public"]["Enums"]["journal_status"]
          tenant_id: string
        }
        Insert: {
          created_at?: string
          date: string
          description?: string | null
          id?: string
          number: string
          posted_at?: string | null
          source?: string | null
          source_id?: string | null
          source_type?: string
          status?: Database["public"]["Enums"]["journal_status"]
          tenant_id: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          number?: string
          posted_at?: string | null
          source?: string | null
          source_id?: string | null
          source_type?: string
          status?: Database["public"]["Enums"]["journal_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entry_lines: {
        Row: {
          account_id: string
          credit: number
          debit: number
          description: string | null
          entry_id: string
          id: string
        }
        Insert: {
          account_id: string
          credit?: number
          debit?: number
          description?: string | null
          entry_id: string
          id?: string
        }
        Update: {
          account_id?: string
          credit?: number
          debit?: number
          description?: string | null
          entry_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_lines_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      migration_snapshots: {
        Row: {
          exported_at: string
          id: string
          payload: Json
          schema_version: number
          tenant_id: string
        }
        Insert: {
          exported_at?: string
          id?: string
          payload: Json
          schema_version: number
          tenant_id: string
        }
        Update: {
          exported_at?: string
          id?: string
          payload?: Json
          schema_version?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "migration_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          date: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          number: string
          payee: string | null
          reference: string | null
          supplier_id: string | null
          tenant_id: string
          vat_amount: number
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          date: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          number: string
          payee?: string | null
          reference?: string | null
          supplier_id?: string | null
          tenant_id: string
          vat_amount?: number
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          date?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          number?: string
          payee?: string | null
          reference?: string | null
          supplier_id?: string | null
          tenant_id?: string
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          lang: string
          phone: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          lang?: string
          phone?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          lang?: string
          phone?: string | null
        }
        Relationships: []
      }
      quotation_lines: {
        Row: {
          description: string | null
          discount: number
          id: string
          item_id: string | null
          qty: number
          quotation_id: string
          unit_price: number
          vat_rate: number
        }
        Insert: {
          description?: string | null
          discount?: number
          id?: string
          item_id?: string | null
          qty?: number
          quotation_id: string
          unit_price?: number
          vat_rate?: number
        }
        Update: {
          description?: string | null
          discount?: number
          id?: string
          item_id?: string | null
          qty?: number
          quotation_id?: string
          unit_price?: number
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_lines_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_lines_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          converted_invoice_id: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          date: string
          discount: number
          id: string
          notes: string | null
          number: string
          status: Database["public"]["Enums"]["quotation_status"]
          tenant_id: string
          terms: string | null
          updated_at: string | null
          valid_until: string | null
        }
        Insert: {
          converted_invoice_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          date: string
          discount?: number
          id?: string
          notes?: string | null
          number: string
          status?: Database["public"]["Enums"]["quotation_status"]
          tenant_id: string
          terms?: string | null
          updated_at?: string | null
          valid_until?: string | null
        }
        Update: {
          converted_invoice_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          date?: string
          discount?: number
          id?: string
          notes?: string | null
          number?: string
          status?: Database["public"]["Enums"]["quotation_status"]
          tenant_id?: string
          terms?: string | null
          updated_at?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_converted_invoice_fk"
            columns: ["converted_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          amount: number
          created_at: string
          customer_id: string
          date: string
          id: string
          invoice_id: string | null
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          number: string
          reference: string | null
          tenant_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          customer_id: string
          date: string
          id?: string
          invoice_id?: string | null
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          number: string
          reference?: string | null
          tenant_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string
          date?: string
          id?: string
          invoice_id?: string | null
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          number?: string
          reference?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      settings_company: {
        Row: {
          address: string | null
          cr_number: string | null
          email: string | null
          logo_url: string | null
          name_ar: string | null
          name_en: string | null
          phone: string | null
          tenant_id: string
          vat_number: string | null
        }
        Insert: {
          address?: string | null
          cr_number?: string | null
          email?: string | null
          logo_url?: string | null
          name_ar?: string | null
          name_en?: string | null
          phone?: string | null
          tenant_id: string
          vat_number?: string | null
        }
        Update: {
          address?: string | null
          cr_number?: string | null
          email?: string | null
          logo_url?: string | null
          name_ar?: string | null
          name_en?: string | null
          phone?: string | null
          tenant_id?: string
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settings_company_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      settings_numbering: {
        Row: {
          invoice: string
          journal: string
          payment: string
          quotation: string
          receipt: string
          tenant_id: string
        }
        Insert: {
          invoice?: string
          journal?: string
          payment?: string
          quotation?: string
          receipt?: string
          tenant_id: string
        }
        Update: {
          invoice?: string
          journal?: string
          payment?: string
          quotation?: string
          receipt?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "settings_numbering_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      settings_tax: {
        Row: {
          currency: string
          tenant_id: string
          vat_inclusive: boolean
          vat_rate: number
        }
        Insert: {
          currency?: string
          tenant_id: string
          vat_inclusive?: boolean
          vat_rate?: number
        }
        Update: {
          currency?: string
          tenant_id?: string
          vat_inclusive?: boolean
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "settings_tax_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          archived_at: string | null
          code: string | null
          created_at: string
          email: string | null
          id: string
          name_ar: string
          name_en: string | null
          notes: string | null
          opening_balance: number
          phone: string | null
          tenant_id: string
          updated_at: string | null
          vat_number: string | null
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name_ar: string
          name_en?: string | null
          notes?: string | null
          opening_balance?: number
          phone?: string | null
          tenant_id: string
          updated_at?: string | null
          vat_number?: string | null
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name_ar?: string
          name_en?: string | null
          notes?: string | null
          opening_balance?: number
          phone?: string | null
          tenant_id?: string
          updated_at?: string | null
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          tenant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          tenant_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          tenant_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          archived_at: string | null
          country: string
          cr_number: string | null
          created_at: string
          currency: string
          id: string
          is_demo: boolean
          name_ar: string
          name_en: string
          updated_at: string | null
          vat_number: string | null
        }
        Insert: {
          archived_at?: string | null
          country?: string
          cr_number?: string | null
          created_at?: string
          currency?: string
          id?: string
          is_demo?: boolean
          name_ar: string
          name_en: string
          updated_at?: string | null
          vat_number?: string | null
        }
        Update: {
          archived_at?: string | null
          country?: string
          cr_number?: string | null
          created_at?: string
          currency?: string
          id?: string
          is_demo?: boolean
          name_ar?: string
          name_en?: string
          updated_at?: string | null
          vat_number?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tenants: {
        Row: {
          id: string
          is_default: boolean
          joined_at: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_default?: boolean
          joined_at?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_default?: boolean
          joined_at?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tenants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tenants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _jaad_audit: {
        Args: {
          _action: string
          _ar: string
          _en: string
          _entity: string
          _entity_id: string
          _tenant: string
        }
        Returns: undefined
      }
      _jaad_err: {
        Args: { _ar: string; _code: string; _en: string }
        Returns: Json
      }
      _jaad_get_account: {
        Args: { _purpose: string; _tenant: string }
        Returns: string
      }
      _jaad_next_number: {
        Args: { _kind: string; _tenant: string }
        Returns: string
      }
      _jaad_require_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: undefined
      }
      _jaad_require_tenant: { Args: never; Returns: string }
      _jaad_seed_default_purpose_mappings: {
        Args: { _tenant: string }
        Returns: undefined
      }
      bootstrap_tenant_for_user: {
        Args: {
          p_currency?: string
          p_locale?: string
          p_name_ar: string
          p_name_en: string
          p_user_id: string
          p_vat_rate?: number
        }
        Returns: Json
      }
      create_default_chart_accounts: {
        Args: { p_tenant_id: string }
        Returns: undefined
      }
      create_default_settings: {
        Args: {
          p_currency?: string
          p_locale?: string
          p_tenant_id: string
          p_vat_rate?: number
        }
        Returns: undefined
      }
      current_tenant_id: { Args: never; Returns: string }
      ensure_profile_for_auth_user: {
        Args: { p_full_name?: string; p_user_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _tenant: string
          _user: string
        }
        Returns: boolean
      }
      invoice_issue: { Args: { _invoice_id: string }; Returns: Json }
      is_tenant_member: { Args: { _tenant: string }; Returns: boolean }
      journal_post_manual: { Args: { _entry_id: string }; Returns: Json }
      list_write_rpc_readiness: { Args: never; Returns: Json }
      payment_create_with_posting: {
        Args: {
          _account_code?: string
          _amount: number
          _category?: string
          _method?: Database["public"]["Enums"]["payment_method"]
          _notes?: string
          _payee?: string
          _reference?: string
          _supplier_id?: string
          _vat_amount?: number
        }
        Returns: Json
      }
      quotation_convert_to_invoice: {
        Args: { _quotation_id: string }
        Returns: Json
      }
      receipt_create_with_auto_apply: {
        Args: {
          _amount: number
          _customer_id: string
          _invoice_id?: string
          _method?: Database["public"]["Enums"]["payment_method"]
          _notes?: string
          _reference?: string
        }
        Returns: Json
      }
      seed_default_chart_of_accounts: {
        Args: { p_tenant_id: string }
        Returns: undefined
      }
      validate_numbering_setup: { Args: { _tenant: string }; Returns: Json }
      validate_tenant_account_setup: {
        Args: { _tenant: string }
        Returns: Json
      }
    }
    Enums: {
      account_type: "asset" | "liability" | "equity" | "revenue" | "expense"
      app_role: "owner" | "accountant" | "sales" | "viewer"
      invoice_status:
        | "draft"
        | "sent"
        | "official"
        | "partially_paid"
        | "fully_paid"
        | "cancelled"
      journal_status: "draft" | "posted"
      payment_method: "cash" | "bank" | "card" | "transfer"
      quotation_status:
        | "draft"
        | "sent"
        | "accepted"
        | "rejected"
        | "converted"
        | "expired"
      task_priority: "low" | "med" | "high"
      task_status: "task_new" | "in_progress" | "completed" | "deferred"
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
      account_type: ["asset", "liability", "equity", "revenue", "expense"],
      app_role: ["owner", "accountant", "sales", "viewer"],
      invoice_status: [
        "draft",
        "sent",
        "official",
        "partially_paid",
        "fully_paid",
        "cancelled",
      ],
      journal_status: ["draft", "posted"],
      payment_method: ["cash", "bank", "card", "transfer"],
      quotation_status: [
        "draft",
        "sent",
        "accepted",
        "rejected",
        "converted",
        "expired",
      ],
      task_priority: ["low", "med", "high"],
      task_status: ["task_new", "in_progress", "completed", "deferred"],
    },
  },
} as const
