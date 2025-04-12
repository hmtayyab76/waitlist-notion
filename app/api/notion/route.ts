import { Client } from "@notionhq/client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const notion = new Client({ auth: process.env.NOTION_SECRET });

    // Generate a unique numeric ID (you can modify this logic as needed)
    const uniqueId = Math.floor(Math.random() * 1000000); // Random number between 0 and 1 million

    // Get the current date and time
    const currentDate = new Date().toISOString();  // Format: YYYY-MM-DDTHH:mm:ss.sssZ

    // Create a new page in the Notion database
    const response = await notion.pages.create({
      parent: {
        database_id: `${process.env.NOTION_DB}`,
      },
      properties: {
        ID: {
          type: "number",
          number: uniqueId,  // Assign the generated numeric ID
        },
        Email: {
          type: "email",
          email: body?.email,
        },
        Name: {
          type: "title",
          title: [
            {
              type: "text",
              text: {
                content: body?.name,
              },
            },
          ],
        },
        Date: {
          type: "date",
          date: {
            start: currentDate,  // Add the current date
          },
        },
      },
    });

    if (!response) {
      throw new Error("Failed to add email to Notion");
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error adding to Notion:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
