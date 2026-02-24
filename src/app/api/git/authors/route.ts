import { NextResponse } from 'next/server';
import { simpleGit } from 'simple-git';

export async function POST(request: Request) {
    try {
        const { projectPath, startDate, endDate } = await request.json();
        const git = simpleGit(projectPath);

        // Get authors between dates
        // git log --since="2024-01-01" --until="2024-01-31" --format="%aN <%aE>"
        const logOptions: any = {
            '--format': '%aN <%aE>',
        };
        if (startDate) logOptions['--since'] = startDate;
        if (endDate) logOptions['--until'] = endDate;

        const authorsRaw = await git.log(logOptions);
        const authorsSet = new Set(authorsRaw.all.map((commit: any) => commit.hash)); // In '--format' mode, simple-git might put the formatted string in 'hash' or 'message'

        // Actually, git.log with custom format might return lines in a specific way.
        // Let's use raw command for more control if needed, but let's try this first.
        const uniqueAuthors = Array.from(new Set(authorsRaw.all.map((c: any) => c.hash))).filter(Boolean);

        return NextResponse.json({ authors: uniqueAuthors });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
