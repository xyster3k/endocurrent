import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const debugInfo: Record<string, unknown> = {
    step: "start",
    timestamp: new Date().toISOString(),
  };

  try {
    // Check authentication
    debugInfo.step = "auth_check";
    const user = await getSessionUser();
    debugInfo.hasUser = !!user;
    debugInfo.userId = user?.id;

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", debug: debugInfo },
        { status: 401 }
      );
    }

    // Check role
    debugInfo.step = "role_check";
    debugInfo.userRole = user.role;
    try {
      requireRole(user, ["editor", "admin"]);
    } catch {
      return NextResponse.json(
        { error: "Insufficient permissions", debug: debugInfo },
        { status: 403 }
      );
    }

    // Get form data
    debugInfo.step = "parse_formdata";
    const formData = await req.formData();
    const file = formData.get("file") as File;

    debugInfo.hasFile = !!file;
    debugInfo.fileName = file?.name;
    debugInfo.fileType = file?.type;
    debugInfo.fileSize = file?.size;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided", debug: debugInfo },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image", debug: debugInfo },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File must be less than 5MB", debug: debugInfo },
        { status: 400 }
      );
    }

    // Create unique filename
    debugInfo.step = "create_filename";
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = file.name.split(".").pop();
    const filename = `${timestamp}-${randomString}.${extension}`;
    debugInfo.filename = filename;

    // Convert file to Uint8Array (works on both Node.js and Edge/Cloudflare)
    debugInfo.step = "convert_to_uint8array";
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    debugInfo.arrayBufferSize = arrayBuffer.byteLength;
    debugInfo.uint8ArraySize = uint8Array.length;

    // Check Supabase env vars
    debugInfo.step = "check_env";
    debugInfo.hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    debugInfo.hasSupabaseAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    debugInfo.hasSupabaseServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Upload to Supabase Storage
    debugInfo.step = "create_supabase_client";
    const supabase = await createSupabaseServerClient({ useServiceRole: true });
    debugInfo.supabaseClientCreated = !!supabase;

    debugInfo.step = "upload_to_storage";
    const { data, error } = await supabase.storage
      .from("article-images")
      .upload(filename, uint8Array, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      debugInfo.step = "upload_error";
      debugInfo.supabaseError = {
        message: error.message,
        name: error.name,
        // Include any additional error properties
        ...(typeof error === "object" ? error : {}),
      };
      console.error("Supabase upload error:", error);
      return NextResponse.json(
        { error: "Upload failed", debug: debugInfo },
        { status: 500 }
      );
    }

    debugInfo.step = "get_public_url";
    debugInfo.uploadedPath = data.path;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("article-images")
      .getPublicUrl(data.path);

    debugInfo.step = "success";
    debugInfo.publicUrl = urlData.publicUrl;

    return NextResponse.json({ url: urlData.publicUrl }, { status: 200 });
  } catch (error) {
    debugInfo.step = "caught_exception";
    debugInfo.errorType = error instanceof Error ? error.constructor.name : typeof error;
    debugInfo.errorMessage = error instanceof Error ? error.message : String(error);
    debugInfo.errorStack = error instanceof Error ? error.stack : undefined;

    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error", debug: debugInfo },
      { status: 500 }
    );
  }
}
