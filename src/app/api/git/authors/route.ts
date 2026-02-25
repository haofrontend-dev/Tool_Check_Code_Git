import { NextResponse } from 'next/server';
import { simpleGit } from 'simple-git';

export async function POST(request: Request) {
    try {
        const { projectPath, startDate, endDate } = await request.json();
        const git = simpleGit(projectPath);

        // Get authors between dates
        const args: string[] = [];
        if (startDate) args.push(`--since=${startDate} 00:00:00`);
        if (endDate) args.push(`--until=${endDate} 23:59:59`);

        const authorsRaw = await git.log(args);

        // Extract unique strings in format "Name <email>"
        const uniqueAuthors = Array.from(new Set(
            authorsRaw.all.map((c: any) => {
                const name = c.author_name || c.authorName || 'Unknown';
                const email = c.author_email || c.authorEmail || 'unknown';
                return `${name} <${email}>`.trim();
            })
        )).filter(a => a !== "Unknown <unknown>");

        console.log(`[Authors API] Found ${uniqueAuthors.length} unique authors.`);

        return NextResponse.json({ authors: uniqueAuthors });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
