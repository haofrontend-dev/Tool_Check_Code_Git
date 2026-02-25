import { NextResponse } from 'next/server';
import { simpleGit } from 'simple-git';

export async function POST(request: Request) {
    try {
        const { projectPath, from, to, startDate, endDate, authors } = await request.json();
        const git = simpleGit(projectPath);

        let diffOptions = [];
        if (from && to && from !== to) {
            diffOptions.push(`${from}..${to}`);
        } else if (startDate || endDate || (authors && authors.length > 0)) {
            // Find commit range based on filters
            const args: string[] = [];
            if (from) args.push(from);
            if (startDate) args.push(`--since=${startDate} 00:00:00`);
            if (endDate) args.push(`--until=${endDate} 23:59:59`);

            console.log(`[Diff API] Project: ${projectPath}`);
            console.log(`[Diff API] Executing: git log ${args.join(' ')}`);

            const logs = await git.log(args);
            let filteredCommits = logs.all;

            console.log(`[Diff API] Found ${logs.total} total commits in time range.`);

            if (authors && authors.length > 0) {
                // Flatten and clean the authors list
                const cleanAuthors = authors.flatMap((a: string) => a.split(/[\n\r]+/)).map((a: string) => a.trim()).filter(Boolean);
                console.log(`[Diff API] Cleaned authors to match:`, cleanAuthors);

                filteredCommits = logs.all.filter((c: any) => {
                    const name = c.author_name || c.authorName || 'Unknown';
                    const email = c.author_email || c.authorEmail || 'unknown';
                    const authorStr = `${name} <${email}>`;
                    const isMatch = cleanAuthors.includes(authorStr);
                    if (!isMatch) console.log(`[Diff API] No match for: "${authorStr}"`);
                    return isMatch;
                });
                console.log(`[Diff API] Found ${filteredCommits.length} commits after author filter.`);
            }

            if (filteredCommits.length > 0) {
                const newestCommit = filteredCommits[0].hash;
                const oldestCommit = filteredCommits[filteredCommits.length - 1].hash;

                // Check if oldestCommit has a parent
                try {
                    await git.revparse([`${oldestCommit}^`]);
                    diffOptions.push(`${oldestCommit}^..${newestCommit}`);
                } catch (e) {
                    // No parent (root commit), diff against empty tree to get everything
                    const EMPTY_TREE_HASH = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';
                    diffOptions.push(`${EMPTY_TREE_HASH}..${newestCommit}`);
                }
                console.log(`[Diff API] Resulting diff range: ${diffOptions[0]}`);
            } else {
                console.log(`[Diff API] Status: No matching commits found.`);
                return NextResponse.json({ files: [], message: 'No matching commits found for this period' });
            }
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
