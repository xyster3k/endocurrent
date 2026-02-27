export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          created_at?: string | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          affiliation: string | null;
          country: string | null;
          role: "user" | "editor" | "admin";
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          affiliation?: string | null;
          country?: string | null;
          role?: "user" | "editor" | "admin";
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          affiliation?: string | null;
          country?: string | null;
          role?: "user" | "editor" | "admin";
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      user_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: "FREE" | "PREMIUM";
          status: "active" | "canceled" | "past_due" | "incomplete";
          billing_provider: "stripe";
          external_customer_id: string | null;
          external_subscription_id: string | null;
          current_period_end: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan?: "FREE" | "PREMIUM";
          status?: "active" | "canceled" | "past_due" | "incomplete";
          billing_provider?: "stripe";
          external_customer_id?: string | null;
          external_subscription_id?: string | null;
          current_period_end?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: "FREE" | "PREMIUM";
          status?: "active" | "canceled" | "past_due" | "incomplete";
          billing_provider?: "stripe";
          external_customer_id?: string | null;
          external_subscription_id?: string | null;
          current_period_end?: string | null;
        };
      };
      articles: {
        Row: {
          id: string;
          slug: string;
          title: string;
          summary: string | null;
          body_markdown: string;
          status: "draft" | "draft_ai" | "published" | "archived";
          category: string | null;
          reading_time_minutes: number | null;
          word_count: number | null;
          author_id: string | null;
          published_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          summary?: string | null;
          body_markdown?: string;
          status?: "draft" | "draft_ai" | "published" | "archived";
          category?: string | null;
          reading_time_minutes?: number | null;
          word_count?: number | null;
          author_id?: string | null;
          published_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          summary?: string | null;
          body_markdown?: string;
          status?: "draft" | "draft_ai" | "published" | "archived";
          category?: string | null;
          reading_time_minutes?: number | null;
          word_count?: number | null;
          author_id?: string | null;
          published_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      article_images: {
        Row: {
          id: string;
          article_id: string;
          type: "cover" | "inline";
          storage_path: string;
          alt_text: string;
          caption: string | null;
          order_index: number | null;
        };
        Insert: {
          id?: string;
          article_id: string;
          type: "cover" | "inline";
          storage_path: string;
          alt_text: string;
          caption?: string | null;
          order_index?: number | null;
        };
        Update: {
          id?: string;
          article_id?: string;
          type?: "cover" | "inline";
          storage_path?: string;
          alt_text?: string;
          caption?: string | null;
          order_index?: number | null;
        };
      };
      tags: {
        Row: {
          id: string;
          slug: string;
          name: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
        };
      };
      article_tags: {
        Row: {
          article_id: string;
          tag_id: string;
        };
        Insert: {
          article_id: string;
          tag_id: string;
        };
        Update: {
          article_id?: string;
          tag_id?: string;
        };
      };
      article_references: {
        Row: {
          id: string;
          article_id: string;
          order_index: number | null;
          label: string | null;
          citation_text: string | null;
          url: string | null;
        };
        Insert: {
          id?: string;
          article_id: string;
          order_index?: number | null;
          label?: string | null;
          citation_text?: string | null;
          url?: string | null;
        };
        Update: {
          id?: string;
          article_id?: string;
          order_index?: number | null;
          label?: string | null;
          citation_text?: string | null;
          url?: string | null;
        };
      };
      article_likes: {
        Row: {
          id: string;
          article_id: string;
          user_id: string | null;
          value: number;
        };
        Insert: {
          id?: string;
          article_id: string;
          user_id?: string | null;
          value: number;
        };
        Update: {
          id?: string;
          article_id?: string;
          user_id?: string | null;
          value?: number;
        };
      };
      article_reports: {
        Row: {
          id: string;
          article_id: string;
          user_id: string | null;
          reason_code: "spam" | "incorrect" | "offensive" | "other";
          comment: string | null;
          created_at: string | null;
          resolved: boolean;
          resolved_by: string | null;
        };
        Insert: {
          id?: string;
          article_id: string;
          user_id?: string | null;
          reason_code: "spam" | "incorrect" | "offensive" | "other";
          comment?: string | null;
          created_at?: string | null;
          resolved?: boolean;
          resolved_by?: string | null;
        };
        Update: {
          id?: string;
          article_id?: string;
          user_id?: string | null;
          reason_code?: "spam" | "incorrect" | "offensive" | "other";
          comment?: string | null;
          created_at?: string | null;
          resolved?: boolean;
          resolved_by?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
