import { render } from "@react-email/render";

import WelcomeTemplate from "../../../emails";

import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const resend = new Resend(process.env.RESEND_API_KEY);

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const ratelimit = new Ratelimit({
  redis,
  // 2 requests per minute from the same IP address in a sliding window of 1 minute duration which means that the window slides forward every second and the rate limit is reset every minute for each IP address.
  limiter: Ratelimit.slidingWindow(2, "1 m"),
});

export async function POST(request: NextRequest, response: NextResponse) {
  const ip = request.ip ?? "127.0.0.1";

  const result = await ratelimit.limit(ip);

  if (!result.success) {
    return Response.json(
      {
        error: "Too many requests!!",
      },
      {
        status: 429,
      },
    );
  }

  const { email, firstname } = await request.json();

  const { data, error } = await resend.emails.send({
    from: 'Tayyab <sender@waitlist.unpuzzle.co>',
    to: [email],
    subject: "Thank You for Joining the Waitlist! 🎉",
    reply_to: "hmtayyab76@gmail.com",
    html:  await render(WelcomeTemplate({ userFirstname: firstname })),
  });

  // const { data, error } = { data: true, error: null }

  if (error) {
    console.error("Email sending failed: ", error);  // Log the error for better debugging
    return NextResponse.json({ message: "Failed to send email", error });
  }
  

  if (!data) {
    console.error("No data received from Resend");  // Log case where no data is returned
    return NextResponse.json({ message: "Failed to send email" });
  }
  
  console.log("Email sent successfully:", data);

  return NextResponse.json({ message: "Email sent successfully" });
}
