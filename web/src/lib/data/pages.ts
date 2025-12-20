import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PageContent = {
  title: string;
  content: string;
};

const DEFAULT_PAGES: Record<string, PageContent> = {
  about: {
    title: "About Us",
    content: "Welcome to our site. This is the default about page content. Edit this in the admin panel.",
  },
  privacy: {
    title: "Privacy & Cookies",
    content: "This is the default privacy policy. Edit this in the admin panel to add your privacy policy.",
  },
  terms: {
    title: "Terms of Use",
    content: "This is the default terms of use. Edit this in the admin panel to add your terms.",
  },
};

export async function getPageContent(slug: string): Promise<PageContent> {
  const defaultContent = DEFAULT_PAGES[slug] || {
    title: slug.charAt(0).toUpperCase() + slug.slice(1),
    content: "",
  };

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return defaultContent;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", [`page_${slug}_title`, `page_${slug}_content`]);

    if (error || !data || data.length === 0) {
      return defaultContent;
    }

    const settings: Record<string, string> = {};
    data.forEach((row: { key: string; value: string }) => {
      settings[row.key] = row.value;
    });

    return {
      title: settings[`page_${slug}_title`] || defaultContent.title,
      content: settings[`page_${slug}_content`] || defaultContent.content,
    };
  } catch (error) {
    console.error(`Error fetching page content for ${slug}:`, error);
    return defaultContent;
  }
}

export async function updatePageContent(
  slug: string,
  content: PageContent
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { success: false, error: "Database not configured" };
  }

  try {
    const supabase = await createSupabaseServerClient({ useServiceRole: true });

    // Upsert title
    const { error: titleError } = await supabase
      .from("site_settings")
      .upsert(
        { key: `page_${slug}_title`, value: content.title, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );

    if (titleError) throw titleError;

    // Upsert content
    const { error: contentError } = await supabase
      .from("site_settings")
      .upsert(
        { key: `page_${slug}_content`, value: content.content, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );

    if (contentError) throw contentError;

    return { success: true };
  } catch (error) {
    console.error(`Error updating page content for ${slug}:`, error);
    return { success: false, error: "Failed to update page content" };
  }
}
