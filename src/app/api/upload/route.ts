import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const result = await new Promise<{
    secure_url: string;
    resource_type: string;
    original_filename: string;
    format: string;
  }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "auto",
          folder: "termchat",
        },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve(result as typeof result & { secure_url: string; resource_type: string; original_filename: string; format: string });
        }
      )
      .end(buffer);
  });

  return NextResponse.json({
    url: result.secure_url,
    resourceType: result.resource_type,
    filename: file.name,
    format: result.format,
  });
}
