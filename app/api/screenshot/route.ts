import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/screenshot
 *
 * Generates a screenshot of a landing page using Microlink API
 * and saves the thumbnail URL to the pages table.
 *
 * Body: { pageId: string, slug: string }
 */

const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL || 'http://localhost:3002';

export async function POST(request: NextRequest) {
  try {
    const { pageId, slug } = await request.json();

    if (!pageId || !slug) {
      return NextResponse.json({ error: 'pageId and slug are required' }, { status: 400 });
    }

    const pageUrl = `${LANDING_URL}/p/${slug}`;

    // Use Microlink API to generate screenshot
    const screenshotUrl = `https://api.microlink.io/?url=${encodeURIComponent(pageUrl)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=1280&viewport.height=800&viewport.deviceScaleFactor=1`;

    // Fetch the screenshot URL from Microlink
    const mlResponse = await fetch(
      `https://api.microlink.io/?url=${encodeURIComponent(pageUrl)}&screenshot=true&meta=false&viewport.width=1280&viewport.height=800`,
      { next: { revalidate: 0 } }
    );

    if (!mlResponse.ok) {
      // Fallback: use the direct embed URL which returns the image itself
      const thumbnailUrl = screenshotUrl;

      // Save to database
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      await supabase
        .from('pages')
        .update({ thumbnail_url: thumbnailUrl })
        .eq('id', pageId);

      return NextResponse.json({ thumbnailUrl });
    }

    const mlData = await mlResponse.json();
    const thumbnailUrl = mlData?.data?.screenshot?.url || screenshotUrl;

    // Save to database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    await supabase
      .from('pages')
      .update({ thumbnail_url: thumbnailUrl })
      .eq('id', pageId);

    return NextResponse.json({ thumbnailUrl });
  } catch (error) {
    console.error('Screenshot error:', error);
    return NextResponse.json({ error: 'Failed to generate screenshot' }, { status: 500 });
  }
}
