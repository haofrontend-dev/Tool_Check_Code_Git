import { NextResponse } from 'next/server';
import { simpleGit } from 'simple-git';

export async function POST(request: Request) {
    try {
        const { projectPath, from, to, startDate, endDate, authors } = await request.json();
        const git = simpleGit(projectPath);

        let diffOptions = [];
        if (from && to) {
            diffOptions.push(`${from}..${to}`);
        } else {
            // If no branches, maybe use date/author filtering for logs then diff?
            // Git diff doesn't directly support --author. We usually diff branches.
            // But we can get files changed in commits by authors in date range.
            const logOptions: any = {
                '--name-only': null,
            };
            if (startDate) logOptions['--since'] = startDate;
            if (endDate) logOptions['--until'] = endDate;

            const logs = await git.log(logOptions);
            // Filter logs by authors if provided
            let filteredCommits = logs.all;
            if (authors && authors.length > 0) {
                filteredCommits = logs.all.filter((c: any) =>
                    authors.includes(`${c.authorName} <${c.authorEmail}>`)
                );
            }

            // If we are looking for "changes" in a period, we might want the diff between 
            // the commit before the period and the last commit in the period.
            // For now, let's stick to branch-based diff or just all changes by these authors.
        }

        const summary = await git.diffSummary(diffOptions);

        const files = await Promise.all(summary.files.map(async (file) => {
            const diff = await git.diff([...diffOptions, '--', file.file]);
            return {
                ...file,
                diff
            };
        }));

        return NextResponse.json({ files });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
